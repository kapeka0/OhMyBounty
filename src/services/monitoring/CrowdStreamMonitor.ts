import axios from 'axios';
import { MonitorService } from './MonitorService.js';
import { Logger } from '../../utils/logger.js';
import { ConfigManager } from '../../utils/config.js';
import pc from 'picocolors';
import type { Engagement, CrowdStreamResponse } from '../../types/index.js';

export class CrowdStreamMonitor extends MonitorService {
  constructor(
    private telegramService: any,
    private discordService: any,
    private notificationsConfig: { telegram: boolean; discord: boolean }
  ) {
    super();
  }

  async monitor(engagement: Engagement): Promise<void> {
    try {
      const url = `https://bugcrowd.com/engagements/${
        engagement.engagementCode
      }/crowdstream.json?page=1&filter_by=${engagement.crowdStream.filterBy.join(
        ','
      )}`;
      const res = await axios.get<CrowdStreamResponse>(url);
      const crowdStream = res.data.results;
      const lastReportId = engagement.crowdStream.lastReportId;

      if (lastReportId === null) {
        const configManager = ConfigManager.getInstance();
        const config = configManager.getConfig();
        const engagementToUpdate = config.engagements.find(
          (e) => e.name === engagement.name
        );
        if (engagementToUpdate) {
          engagementToUpdate.crowdStream.lastReportId = crowdStream[0].id;
        }
      } else {
        for (const report of crowdStream) {
          const reportId = report.id;
          if (reportId === lastReportId) {
            break;
          }

          if (
            reportId !== lastReportId &&
            engagement.crowdStream.enabled &&
            report.priority <= parseInt(engagement.crowdStream.minimumPriorityNumber)
          ) {
            Logger.success(
              `[+] New report in ${pc.cyan(engagement.name)}: ${pc.red(
                report.title || 'Redacted'
              )}`
            );

            if (this.notificationsConfig.telegram) {
              Logger.warning(`[+] Sending notification to Telegram`);
              let message = `<b>🚨 New report in <a href="https://bugcrowd.com${report.engagement_path}">${engagement.name}</a> 🚨 </b>\n\n`;
              message += `<b>${report.title || '<s>Redacted</s>'}</b>\n\n`;
              message += `•<i> Priority:</i> ${report.priority}\n`;
              message += `•<i> Created:</i> ${new Date(
                report.created_at
              ).toLocaleString()}\n`;
              message += `•<i> Disclosed:</i> ${
                report.disclosed || report.accepted_at
              }\n`;
              message += `•<i> Bounty:</i> ${report.amount || 0} $\n`;
              message += `•<i> Points:</i> ${report.points || 0}\n`;
              message += `•<i> Status:</i> ${report.substate}\n`;
              message += report.researcher_username
                ? `•<i> Researcher:</i> <a href="https://bugcrowd.com${report.researcher_profile_path}">${report.researcher_username}</a>\n`
                : `•<i> Researcher:</i> <s>Private User</s>\n`;
              message += `•<i> Target:</i> ${report.target}\n`;
              message += report.disclosed
                ? `•<i> <a href="https://bugcrowd.com/${report.disclosure_report_url}">Link</a></i> \n`
                : '';

              await this.telegramService.sendMessageWithImage(
                message,
                report.logo_url
              );
            }

            if (this.notificationsConfig.discord) {
              Logger.warning(`[+] Sending notification to Discord`);
              await this.discordService.sendReport(engagement, report);
            }
          }
        }

        const configManager = ConfigManager.getInstance();
        const config = configManager.getConfig();
        const engagementToUpdate = config.engagements.find(
          (e) => e.name === engagement.name
        );
        if (engagementToUpdate) {
          engagementToUpdate.crowdStream.lastReportId = crowdStream[0].id;
        }
      }
    } catch (err) {
      console.error(`Error monitoring crowdstream for ${engagement.name}:`, err);
      throw err;
    }
  }
}
