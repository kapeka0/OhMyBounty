import logUpdate from 'log-update';
import pc from 'picocolors';

export class Logger {
  static info(message: string): void {
    logUpdate(pc.blue(message));
    logUpdate.done();
  }

  static success(message: string): void {
    logUpdate(pc.green(message));
    logUpdate.done();
  }

  static warning(message: string): void {
    logUpdate(pc.yellow(message));
    logUpdate.done();
  }

  static error(message: string): void {
    logUpdate(pc.red(message));
    logUpdate.done();
  }

  static update(message: string): void {
    logUpdate(message);
  }

  static clear(): void {
    logUpdate.clear();
  }
}
