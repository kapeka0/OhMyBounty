import 'dotenv/config';
import logUpdate from 'log-update';
import pc from 'picocolors';
import { EngagementProcessor } from './core/EngagementProcessor.js';
import { Scheduler } from './core/Scheduler.js';
import { TelegramService } from './services/notification/TelegramService.js';
import { DiscordService } from './services/notification/DiscordService.js';
import { ConfigManager } from './utils/config.js';
import { wait } from './utils/helpers.js';

const BANNER = `  ____  __   __  ___     ___                 __
 / __ \/ /  /  |/  /_ __/ _ )___  __ _____  / /___ __
/ /_/ / _ \/ /|_/ / // / _  / _ \/ // / _ \/ __/ // /
\____/_//_/_/  /_/\_, /____/\___/\_,_/_//_/\__/\_, /
                 /___/                        /___/  `;

async function showNeon(): Promise<void> {
  const colors = [pc.cyan, pc.green, pc.yellow, pc.magenta, pc.red, pc.blue];
  let i = 0;
  while (i < 10) {
    logUpdate(colors[i % colors.length](BANNER));
    await wait(150);
    i++;
  }
  logUpdate.done();
}

async function main() {
  try {
    await showNeon();

    const configManager = ConfigManager.getInstance();
    const config = await configManager.loadConfig();

    let telegramService = null;
    let discordService = null;

    if (config.notifications.telegram) {
      try {
        telegramService = new TelegramService();
      } catch (err) {
        console.error('Failed to initialize Telegram service:', err);
      }
    }

    if (config.notifications.discord) {
      try {
        discordService = new DiscordService();
      } catch (err) {
        console.error('Failed to initialize Discord service:', err);
      }
    }

    const processor = new EngagementProcessor(
      telegramService,
      discordService,
      config.notifications
    );

    const scheduler = new Scheduler(processor);
    await scheduler.start();

    process.on('SIGINT', () => {
      console.log(pc.yellow('\n[!] Received SIGINT, shutting down gracefully...'));
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log(pc.yellow('\n[!] Received SIGTERM, shutting down gracefully...'));
      scheduler.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error(pc.red('Fatal error:'), err);
    process.exit(1);
  }
}

main();
