import fs from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';
import type { Config } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config | null = null;
  private readonly configPath: string;

  private constructor() {
    this.configPath = path.join(__dirname, '..', '..', 'config.json');
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async loadConfig(): Promise<Config> {
    const data = await fs.readFile(this.configPath, 'utf-8');
    this.config = JSON.parse(data) as Config;
    return this.config;
  }

  async saveConfig(): Promise<void> {
    if (!this.config) {
      throw new Error('No config loaded');
    }
    const updatedConfig = JSON.stringify(this.config, null, 2);
    await fs.writeFile(this.configPath, updatedConfig);
  }

  getConfig(): Config {
    if (!this.config) {
      throw new Error('Config not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  setConfig(config: Config): void {
    this.config = config;
  }
}
