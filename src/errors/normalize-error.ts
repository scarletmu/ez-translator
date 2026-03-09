import { ZodError } from 'zod';
import { AppError } from './app-error';
import { ErrorCode } from './error-codes';

export function normalizeError(
  error: unknown,
  fallbackCode: ErrorCode = ErrorCode.INTERNAL_ERROR,
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError(ErrorCode.INVALID_INPUT);
  }

  return new AppError(fallbackCode);
}
