import { ErrorCode } from './error-codes';
import { ERROR_MESSAGES } from './error-messages';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly details?: unknown;

  constructor(code: ErrorCode, details?: unknown) {
    const userMessage = ERROR_MESSAGES[code];
    super(userMessage);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
  }

  toJSON() {
    return {
      code: this.code,
      userMessage: this.userMessage,
      details: this.details,
    };
  }
}

export function createAppError(code: ErrorCode, details?: unknown): AppError {
  return new AppError(code, details);
}
