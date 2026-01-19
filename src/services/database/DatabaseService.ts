import mysql from 'mysql2/promise';
import type { Connection } from 'mysql2/promise';

export class DatabaseService {
  private static instance: DatabaseService;
  private connection: Connection | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(): Promise<Connection> {
    if (this.connection) {
      return this.connection;
    }

    this.connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'omb',
    });

    return this.connection;
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async createTableIfNotExists(tableName: string): Promise<void> {
    const connection = await this.connect();
    const table = `
      CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subdomain VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(table);
  }

  async query<T>(sql: string, params?: any[]): Promise<T> {
    const connection = await this.connect();
    const [rows] = await connection.query(sql, params);
    return rows as T;
  }
}
