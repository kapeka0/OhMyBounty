import fs from 'node:fs/promises';
import path from 'path';
import { MonitorService } from './MonitorService.js';
import { Logger } from '../../utils/logger.js';
import { DatabaseService } from '../database/DatabaseService.js';
import { BrowserService } from '../browser/BrowserService.js';
import { normalizeDomain, ensureHttpsUrl } from '../../utils/helpers.js';
import pc from 'picocolors';
import type { Engagement, SubdomainRecord } from '../../types/index.js';

export class SubdomainMonitor extends MonitorService {
  private readonly screenshotDir = 'screenshots';

  constructor(
    private telegramService: any,
    private discordService: any,
    private notificationsConfig: { telegram: boolean; discord: boolean }
  ) {
    super();
  }

  async monitor(engagement: Engagement): Promise<void> {
    const dbService = DatabaseService.getInstance();

    try {
      await dbService.connect();
      await dbService.createTableIfNotExists(engagement.engagementCode);

      const files = await fs.readdir(
        engagement.subdomainMonitor.subdomainsDirectory
      );
      const txtFiles = files.filter((file) => path.extname(file) === '.txt');

      for (const file of txtFiles) {
        Logger.warning(
          `[i] Reading ${pc.cyan(file)} files for ${engagement.name}`
        );
        await this.processFile(
          path.resolve(engagement.subdomainMonitor.subdomainsDirectory, file),
          engagement
        );
      }
    } catch (err) {
      console.error(`Error checking subdomains for ${engagement.name}:`, err);
      throw err;
    } finally {
      await dbService.disconnect();
    }
  }

  private async processFile(
    filePath: string,
    engagement: Engagement
  ): Promise<void> {
    const dbService = DatabaseService.getInstance();

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const subdomains = data
        .split('\n')
        .map((subdomain) => normalizeDomain(subdomain));

      for (const subdomain of subdomains) {
        if (subdomain) {
          try {
            const rows = await dbService.query<SubdomainRecord[]>(
              `SELECT * FROM \`${engagement.engagementCode}\` WHERE subdomain = ?`,
              [subdomain]
            );

            if (rows.length === 0 || !rows) {
              Logger.success(`[+] New subdomain found: ${subdomain}`);

              if (!engagement.subdomainMonitor.storeMode) {
                try {
                  await this.notifySubdomain(subdomain, engagement);
                } catch (err) {
                  console.error(err);
                }
              } else {
                Logger.warning(`[+] Storing new domain: ${subdomain}`);
              }

              await dbService.query(
                `INSERT IGNORE INTO \`${engagement.engagementCode}\` (subdomain) VALUES (?)`,
                [subdomain]
              );
            }
          } catch (err) {
            console.error(err);
          }
        }
      }

      await fs.unlink(filePath);
    } catch (err) {
      throw new Error(`[!] Error reading file: ${err}`);
    }
  }

  private async notifySubdomain(
    subdomain: string,
    engagement: Engagement
  ): Promise<void> {
    const imgPath = path.resolve(this.screenshotDir, 'screenshot.png');
    Logger.update(pc.yellow(`[+] Checking `) + pc.cyan(subdomain));

    const URL = ensureHttpsUrl(subdomain);
    const browserService = BrowserService.getInstance();
    const browser = browserService.getBrowser();

    let page;
    try {
      page = await browser.newPage();
      page.setDefaultTimeout(5 * 60 * 1000); // 5 mins

      let pageResponse;
      try {
        pageResponse = await page.goto(URL, {
          waitUntil: 'networkidle2',
        });
      } catch (err) {
        Logger.error(`[!] Timeout error: ${URL}`);
        await page.close();
        return;
      }

      if (!pageResponse) {
        await page.close();
        return;
      }

      Logger.success(`[+] ${subdomain} is up`);

      if (engagement.subdomainMonitor.screenshotEnabled) {
        await page.screenshot({
          type: 'png',
          path: path.join(this.screenshotDir, 'screenshot.png'),
        });
      }

      const headers = pageResponse.headers();

      if (
        engagement.subdomainMonitor.hideCodes.includes(pageResponse.status())
      ) {
        Logger.warning(
          `[!] Status code ${pageResponse.status()} is in the hide list`
        );
        await page.close();
        return;
      }

      if (this.notificationsConfig.telegram) {
        Logger.warning(`[+] Sending notification to Telegram`);
        let message = `<b>🌐 New active subdomain found in <a href="https://bugcrowd.com/engagements/${engagement.engagementCode}">${engagement.name}</a> </b>\n\n`;
        message += `•<i> <a href="${URL}">${subdomain}</a> </i>\n`;
        message += `•<i> Status:</i> ${
          pageResponse.status() + ' ' + pageResponse.statusText()
        }\n`;
        message += `•<i> Response Time:</i> ${
          pageResponse.timing()?.receiveHeadersEnd || 'N/A'
        } ms\n`;
        message += `•<i> Address:</i> ${
          (pageResponse.remoteAddress()?.ip || 'N/A') +
          ':' +
          (pageResponse.remoteAddress()?.port || 'N/A')
        } \n`;
        message += `•<i> Server:</i> ${headers['server']}\n`;
        message += `•<i> Content-Type:</i> ${headers['content-type']}\n`;

        engagement.subdomainMonitor.screenshotEnabled
          ? await this.telegramService.sendLocalImage(message, imgPath)
          : await this.telegramService.sendMessage(message);
      }

      if (this.notificationsConfig.discord) {
        Logger.warning(`[+] Sending notification to Discord`);
        let messageMd = '';
        let title = `**🌐 New active subdomain found in [${engagement.name}](https://bugcrowd.com/engagements/${engagement.engagementCode})**\n`;

        if (engagement.subdomainMonitor.screenshotEnabled) {
          messageMd += title;
        }

        messageMd += `• *[${subdomain}](${URL})*\n`;
        messageMd += `• *Status:* ${pageResponse.status()} ${pageResponse.statusText()}\n`;
        messageMd += `• *Response Time:* ${
          pageResponse.timing()?.receiveHeadersEnd || 'N/A'
        } ms\n`;
        messageMd += `• *Address:* ${pageResponse.remoteAddress()?.ip || 'N/A'}:${
          pageResponse.remoteAddress()?.port || 'N/A'
        }\n`;
        messageMd += `• *Server:* ${headers['server']}\n`;
        messageMd += `• *Content-Type:* ${headers['content-type']}\n`;
        messageMd =
          messageMd.length >= 250
            ? messageMd.slice(0, 250) + '...'
            : messageMd;

        engagement.subdomainMonitor.screenshotEnabled
          ? await this.discordService.sendSubdomain(messageMd, imgPath)
          : await this.discordService.sendEmbed(title, messageMd);
      }

      await page.close();
    } catch (err) {
      console.error(err);
      if (page) {
        await page.close();
      }
    } finally {
      try {
        await fs.unlink(imgPath);
      } catch (err) {
        // File may not exist
      }
    }
  }
}
