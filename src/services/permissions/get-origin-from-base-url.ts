import { AppError, ErrorCode } from '@/errors';

export function getOriginFromBaseUrl(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    return `${url.origin}/*`;
  } catch {
    throw new AppError(ErrorCode.INVALID_INPUT);
  }
}
