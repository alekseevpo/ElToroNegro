/**
 * Centralized error handling utilities
 * 
 * Provides consistent error handling and user-friendly error messages
 */

import { logger } from './logger';
import { ERROR_MESSAGES } from './constants';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  userMessage?: string;
  context?: Record<string, unknown>;
}

export class CustomError extends Error implements AppError {
  code?: string;
  statusCode?: number;
  userMessage?: string;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      code?: string;
      statusCode?: number;
      userMessage?: string;
      context?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = options?.code;
    this.statusCode = options?.statusCode;
    this.userMessage = options?.userMessage || message;
    this.context = options?.context;
  }
}

/**
 * Handle and format errors for display to users
 */
export function handleError(error: unknown): {
  message: string;
  code?: string;
  statusCode?: number;
} {
  // Log the error
  if (error instanceof CustomError) {
    logger.error('Application error', error, error.context);
    return {
      message: error.userMessage || error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    logger.error('Unexpected error', error);
    
    // Map common errors to user-friendly messages
    if (error.message.includes('user rejected')) {
      return {
        message: 'Transaction was cancelled',
        code: 'USER_REJECTED',
      };
    }

    if (error.message.includes('insufficient funds')) {
      return {
        message: ERROR_MESSAGES.INSUFFICIENT_BALANCE,
        code: 'INSUFFICIENT_FUNDS',
      };
    }

    if (error.message.includes('network')) {
      return {
        message: ERROR_MESSAGES.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
      };
    }

    return {
      message: error.message || ERROR_MESSAGES.NETWORK_ERROR,
    };
  }

  // Unknown error type
  logger.error('Unknown error type', error);
  return {
    message: ERROR_MESSAGES.NETWORK_ERROR,
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Create a user-friendly error from various error types
 */
export function createAppError(
  message: string,
  options?: {
    code?: string;
    statusCode?: number;
    userMessage?: string;
    context?: Record<string, unknown>;
  }
): CustomError {
  return new CustomError(message, options);
}

/**
 * Check if error is a specific type
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof CustomError || (error instanceof Error && 'code' in error);
}

