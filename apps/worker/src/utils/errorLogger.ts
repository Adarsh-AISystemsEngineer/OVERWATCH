import fs from 'fs';
import path from 'path';

/**
 * Error logging for scraper failures
 * Stores errors with context for debugging
 */
export class ErrorLogger {
  private static readonly LOG_DIR = path.join(process.cwd(), 'logs');

  static {
    if (!fs.existsSync(this.LOG_DIR)) {
      fs.mkdirSync(this.LOG_DIR, { recursive: true });
    }
  }

  /**
   * Log scraper error with context
   */
  static logError(
    state: string,
    error: Error,
    context: Record<string, unknown> = {}
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      state,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    };

    const logFile = path.join(this.LOG_DIR, `scraper-errors-${new Date().toISOString().split('T')[0]}.json`);

    try {
      let logs: unknown[] = [];
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
      }

      logs.push(logEntry);
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

      console.error(`[ErrorLogger] Error logged to ${logFile}`);
    } catch (logError) {
      console.error('[ErrorLogger] Failed to write log:', logError);
    }
  }

  /**
   * Log validation errors from transformed data
   */
  static logValidationErrors(
    state: string,
    errors: Array<{ data: unknown; errors: string[] }>
  ): void {
    const timestamp = new Date().toISOString();
    const logFile = path.join(
      this.LOG_DIR,
      `validation-errors-${new Date().toISOString().split('T')[0]}.json`
    );

    const logEntry = {
      timestamp,
      state,
      errorCount: errors.length,
      errors,
    };

    try {
      let logs: unknown[] = [];
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
      }

      logs.push(logEntry);
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

      console.log(`[ErrorLogger] Validation errors logged (${errors.length} records)`);
    } catch (error) {
      console.error('[ErrorLogger] Failed to write validation log:', error);
    }
  }
}
