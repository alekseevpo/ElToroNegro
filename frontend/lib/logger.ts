/**
 * Centralized logging utility
 * 
 * Provides structured logging with different log levels.
 * In production, can be configured to send logs to external services.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
    };

    // In development, use console with colors
    if (this.isDevelopment) {
      const styles = {
        debug: 'color: #888',
        info: 'color: #2196F3',
        warn: 'color: #FF9800',
        error: 'color: #F44336',
      };

      console[level === 'debug' ? 'log' : level](
        `%c[${level.toUpperCase()}] ${timestamp}`,
        styles[level],
        message,
        context || ''
      );
    } else {
      // In production, use structured logging
      // Can be extended to send to external services (Sentry, LogRocket, etc.)
      if (level === 'error') {
        console.error(JSON.stringify(logEntry));
      } else if (level === 'warn') {
        console.warn(JSON.stringify(logEntry));
      } else {
        console.log(JSON.stringify(logEntry));
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
      ...(typeof error === 'object' && error !== null && { error }),
    };

    this.log('error', message, errorContext);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogContext };

