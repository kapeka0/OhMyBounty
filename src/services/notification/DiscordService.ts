import {
  AttachmentBuilder,
  EmbedBuilder,
  WebhookClient,
} from 'discord.js';
import fs from 'fs';
import { NotificationService } from './NotificationService.js';
import type { Engagement, Report } from '../../types/index.js';

export class DiscordService extends NotificationService {
  private readonly webhookClient: WebhookClient;
  private readonly bugcrowdColors = [
    null,
    0xff0000, // P1 - Red
    0xff8000, // P2 - Orange
    0xffff00, // P3 - Yellow
    0x00ff00, // P4 - Green
    0x0000ff, // P5 - Blue
  ];

  constructor() {
    super();
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('Discord webhook URL not defined.');
    }

    this.webhookClient = new WebhookClient({ url: webhookUrl });
  }

  async sendMessage(message: string): Promise<void> {
    await this.sendEmbed('Notification', message, 0x8a2be2);
  }

  async sendMessageWithImage(message: string, imageUrl: string): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('Notification')
      .setColor(0x8a2be2)
      .setDescription(message)
      .setThumbnail(imageUrl);

    await this.webhookClient.send({
      username: 'OhMyBounty',
      avatarURL: 'https://i.imgur.com/8uE8voU.jpeg',
      embeds: [embed],
    });
  }

  async sendLocalImage(message: string, imagePath: string): Promise<void> {
    try {
      const attachment = new AttachmentBuilder(
        fs.readFileSync(imagePath),
        { name: 'subdomains.png' }
      );
      await this.webhookClient.send({
        username: 'OhMyBounty',
        avatarURL: 'https://i.imgur.com/8uE8voU.jpeg',
        content: message,
        files: [attachment],
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async sendEmbed(
    title: string,
    message: string,
    color: number = 0x8a2be2
  ): Promise<void> {
    try {
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setDescription(message);

      await this.webhookClient.send({
        username: 'OhMyBounty',
        avatarURL: 'https://i.imgur.com/8uE8voU.jpeg',
        embeds: [embed],
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async sendReport(engagement: Engagement, report: Report): Promise<void> {
    try {
      const embed = new EmbedBuilder()
        .setTitle(`🚨 New report in ${engagement.name} 🚨`)
        .setURL(`https://bugcrowd.com${report.engagement_path}`)
        .setColor(this.bugcrowdColors[report.priority] ?? 0x8a2be2)
        .setDescription(
          `**${report.title || '~~Redacted~~'}**\n\n` +
            `• **Priority:** ${report.priority}\n` +
            `• **Created:** ${new Date(report.created_at).toLocaleString()}\n` +
            `• **Disclosed:** ${report.disclosed || report.accepted_at}\n` +
            `• **Bounty:** ${report.amount || 0} $\n` +
            `• **Points:** ${report.points || 0}\n` +
            `• **Status:** ${report.substate}\n` +
            `• **Researcher:** ${
              report.researcher_username
                ? `[${report.researcher_username}](https://bugcrowd.com${report.researcher_profile_path})`
                : '~~Private User~~'
            }\n` +
            `• **Target:** ${report.target}\n` +
            (report.disclosed
              ? `• **[Link](https://bugcrowd.com/${report.disclosure_report_url})**`
              : '')
        )
        .setThumbnail(report.logo_url || 'https://i.imgur.com/AfFp7pu.png')
        .setTimestamp();

      await this.webhookClient.send({
        username: 'OhMyBounty',
        avatarURL: 'https://i.imgur.com/8uE8voU.jpeg',
        embeds: [embed],
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async sendSubdomain(message: string, localImage: string): Promise<void> {
    await this.sendLocalImage(message, localImage);
  }
}
