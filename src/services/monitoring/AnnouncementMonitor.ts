import axios from 'axios';
import * as cheerio from 'cheerio';
import { MonitorService } from './MonitorService.js';
import { Logger } from '../../utils/logger.js';
import { ConfigManager } from '../../utils/config.js';
import pc from 'picocolors';
import type {
  Engagement,
  AnnouncementsResponse,
} from '../../types/index.js';

export class AnnouncementMonitor extends MonitorService {
  constructor(
    private telegramService: any,
    private discordService: any,
    private notificationsConfig: { telegram: boolean; discord: boolean }
  ) {
    super();
  }

  async monitor(engagement: Engagement): Promise<void> {
    try {
      const url = `https://bugcrowd.com/engagements/${engagement.engagementCode}/announcements.json`;
      const res = await axios.get<AnnouncementsResponse>(url);
      const announcements = res.data.announcements;
      const lastAnnouncementId = engagement.announcements.lastAnnouncementId;

      if (lastAnnouncementId === null) {
        const configManager = ConfigManager.getInstance();
        const config = configManager.getConfig();
        const engagementToUpdate = config.engagements.find(
          (e) => e.name === engagement.name
        );
        if (engagementToUpdate) {
          engagementToUpdate.announcements.lastAnnouncementId =
            announcements[0].id;
        }
      } else {
        for (const announcement of announcements) {
          const announcementId = announcement.id;
          if (announcementId === lastAnnouncementId) {
            break;
          }

          if (
            announcementId !== lastAnnouncementId &&
            engagement.announcements.enabled
          ) {
            Logger.success(
              `[+] New announcement in ${pc.cyan(engagement.name)}: ${pc.red(
                announcement.title || 'Redacted'
              )}`
            );

            if (this.notificationsConfig.telegram) {
              Logger.warning(`[+] Sending notification to Telegram`);
              let message = `<b>📢 New announcement in <u>${engagement.name}</u> 📢</b>\n\n`;
              const parsedBody = cheerio.load(announcement.body);
              message += parsedBody.text();
              await this.telegramService.sendMessage(message);
            }

            if (this.notificationsConfig.discord) {
              Logger.warning(`[+] Sending notification to Discord`);
              const parsedBody = cheerio.load(announcement.body);
              const message = parsedBody.text();
              await this.discordService.sendEmbed(
                `📢 New announcement in ${engagement.name} 📢 `,
                message
              );
            }
          } else {
            break;
          }
        }

        const configManager = ConfigManager.getInstance();
        const config = configManager.getConfig();
        const engagementToUpdate = config.engagements.find(
          (e) => e.name === engagement.name
        );
        if (engagementToUpdate) {
          engagementToUpdate.announcements.lastAnnouncementId =
            announcements[0].id;
        }
      }
    } catch (err) {
      console.error(`Error monitoring announcements for ${engagement.name}:`, err);
      throw err;
    }
  }
}
