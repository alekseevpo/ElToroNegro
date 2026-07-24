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

declare const process: {
  env: {
    NODE_ENV?: string;
    [key: string]: string | undefined;
  };
};

class Logger {
  private isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

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

  private processLogArgs(
    level: LogLevel,
    message: string,
    errorOrContext?: Error | unknown | LogContext,
    context?: LogContext
  ): void {
    if (context !== undefined) {
      const error = errorOrContext;
      const errorContext: LogContext = {
        ...context,
        ...(error instanceof Error && {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }),
        ...(typeof error === 'object' && error !== null && !(error instanceof Error) && { error }),
      };
      this.log(level, message, errorContext);
    } else if (errorOrContext instanceof Error) {
      this.log(level, message, {
        error: {
          name: errorOrContext.name,
          message: errorOrContext.message,
          stack: errorOrContext.stack,
        },
      });
    } else {
      this.log(level, message, errorOrContext as LogContext);
    }
  }

  debug(message: string, context?: LogContext): void;
  debug(message: string, error: Error | unknown, context?: LogContext): void;
  debug(message: string, errorOrContext?: Error | unknown | LogContext, context?: LogContext): void {
    if (this.isDevelopment) {
      this.processLogArgs('debug', message, errorOrContext, context);
    }
  }

  info(message: string, context?: LogContext): void;
  info(message: string, error: Error | unknown, context?: LogContext): void;
  info(message: string, errorOrContext?: Error | unknown | LogContext, context?: LogContext): void {
    this.processLogArgs('info', message, errorOrContext, context);
  }

  warn(message: string, context?: LogContext): void;
  warn(message: string, error: Error | unknown, context?: LogContext): void;
  warn(message: string, errorOrContext?: Error | unknown | LogContext, context?: LogContext): void {
    this.processLogArgs('warn', message, errorOrContext, context);
  }

  error(message: string, context?: LogContext): void;
  error(message: string, error: Error | unknown, context?: LogContext): void;
  error(message: string, errorOrContext?: Error | unknown | LogContext, context?: LogContext): void {
    this.processLogArgs('error', message, errorOrContext, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogContext };

