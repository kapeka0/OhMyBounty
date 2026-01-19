import cron from 'node-cron';
import { EngagementProcessor } from './EngagementProcessor.js';
import { ConfigManager } from '../utils/config.js';
import pc from 'picocolors';

export class Scheduler {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor(private processor: EngagementProcessor) {}

  async start(): Promise<void> {
    const configManager = ConfigManager.getInstance();
    const config = await configManager.loadConfig();

    const isConfigCronValid = cron.validate(config.cronInterval);
    if (!isConfigCronValid) {
      console.log(pc.red(`[!] Invalid cron interval, using default value`));
    }

    const cronExpression = isConfigCronValid
      ? config.cronInterval
      : '* * * * *';

    this.task = cron.schedule(
      cronExpression,
      async () => {
        if (!this.isRunning) {
          this.isRunning = true;
          await this.processor.processAllEngagements();
          this.isRunning = false;
        }
      },
      {}
    );

    console.log(
      pc.green(`[+] Scheduled task to run every ${cronExpression}`)
    );

    const monitoringList = config.engagements.filter((e) => e.enabled);
    console.log(
      pc.yellow(
        `[+] Programs to monitor: ${pc.cyan(
          monitoringList.map((e) => e.name).join(', ')
        )}`
      )
    );

    this.task.start();
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
    }
  }
}
