import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { NotificationService } from './NotificationService.js';

export class TelegramService extends NotificationService {
  private readonly botToken: string;
  private readonly chatId: string;

  constructor() {
    super();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      throw new Error('Telegram bot token or chat ID not defined.');
    }

    this.botToken = botToken;
    this.chatId = chatId;
  }

  async sendMessage(message: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    await axios.post(url, {
      chat_id: this.chatId,
      text: message,
      parse_mode: 'html',
    });
  }

  async sendMessageWithImage(message: string, imageUrl: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendPhoto`;
    await axios.post(url, {
      chat_id: this.chatId,
      photo: imageUrl,
      caption: message,
      parse_mode: 'html',
    });
  }

  async sendLocalImage(message: string, imagePath: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendPhoto`;
    const formData = new FormData();
    formData.append('chat_id', this.chatId);
    formData.append('caption', message);
    formData.append('parse_mode', 'html');
    formData.append('photo', fs.createReadStream(imagePath));

    try {
      await axios.post(url, formData);
    } catch (error) {
      console.error('Error sending image:', error);
      throw error;
    }
  }
}
