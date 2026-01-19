import { Logger } from '../utils/logger.js';
import { ConfigManager } from '../utils/config.js';
import { BrowserService } from '../services/browser/BrowserService.js';
import {
  AnnouncementMonitor,
  CrowdStreamMonitor,
  SubdomainMonitor,
} from '../services/monitoring/index.js';
import pc from 'picocolors';
import type { Engagement } from '../types/index.js';

export class EngagementProcessor {
  private announcementMonitor: AnnouncementMonitor;
  private crowdStreamMonitor: CrowdStreamMonitor;
  private subdomainMonitor: SubdomainMonitor;

  constructor(
    private telegramService: any,
    private discordService: any,
    private notificationsConfig: { telegram: boolean; discord: boolean }
  ) {
    this.announcementMonitor = new AnnouncementMonitor(
      telegramService,
      discordService,
      notificationsConfig
    );
    this.crowdStreamMonitor = new CrowdStreamMonitor(
      telegramService,
      discordService,
      notificationsConfig
    );
    this.subdomainMonitor = new SubdomainMonitor(
      telegramService,
      discordService,
      notificationsConfig
    );
  }

  async processEngagement(engagement: Engagement): Promise<void> {
    if (!engagement.enabled) {
      return;
    }

    Logger.warning(`[+] Monitoring ${pc.cyan(engagement.name)}`);

    try {
      if (engagement.announcements.enabled) {
        await this.announcementMonitor.monitor(engagement);
      }

      if (engagement.crowdStream.enabled) {
        await this.crowdStreamMonitor.monitor(engagement);
      }

      if (engagement.subdomainMonitor.enabled) {
        await this.subdomainMonitor.monitor(engagement);
      }
    } catch (err) {
      console.error(`Error processing engagement ${engagement.name}:`, err);
    }
  }

  async processAllEngagements(): Promise<void> {
    const configManager = ConfigManager.getInstance();
    const browserService = BrowserService.getInstance();

    try {
      await browserService.launch();
      await configManager.loadConfig();

      const config = configManager.getConfig();

      for (const engagement of config.engagements) {
        if (engagement.enabled) {
          await this.processEngagement(engagement);
        }
      }

      await configManager.saveConfig();
      Logger.clear();
      Logger.info('[i] Waiting for next scheduled iteration');
    } catch (err) {
      console.error('Error processing all engagements:', err);
    } finally {
      await browserService.close();
    }
  }
}
