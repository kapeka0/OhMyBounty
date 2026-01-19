import puppeteer, { Browser } from 'puppeteer';
import { platform } from 'os';

export class BrowserService {
  private static instance: BrowserService;
  private browser: Browser | null = null;

  private constructor() {}

  static getInstance(): BrowserService {
    if (!BrowserService.instance) {
      BrowserService.instance = new BrowserService();
    }
    return BrowserService.instance;
  }

  async launch(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    const launchOptions: any = {
      headless: true,
      args: ['--start-maximized', '--no-sandbox', '--no-zygote'],
    };

    // Platform-specific executable path
    const currentPlatform = platform();
    if (currentPlatform === 'linux') {
      launchOptions.executablePath = '/usr/bin/chromium-browser';
    }
    // Windows and macOS will use Puppeteer's bundled Chromium

    this.browser = await puppeteer.launch(launchOptions);
    return this.browser;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getBrowser(): Browser {
    if (!this.browser) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return this.browser;
  }
}
