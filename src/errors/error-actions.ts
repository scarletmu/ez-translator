import { ErrorCode } from './error-codes';

export interface ErrorAction {
  kind: 'open-settings' | 'retry';
  label: string;
}

const OPEN_SETTINGS_CODES = new Set<ErrorCode>([
  ErrorCode.TEXT_TRANSLATE_CONFIG_MISSING,
  ErrorCode.SCREENSHOT_DIRECT_CONFIG_MISSING,
  ErrorCode.SCREENSHOT_EXTRACT_CONFIG_MISSING,
  ErrorCode.SCREENSHOT_TRANSLATE_CONFIG_MISSING,
  ErrorCode.TEXT_TRANSLATE_PERMISSION_DENIED,
  ErrorCode.SCREENSHOT_DIRECT_PERMISSION_DENIED,
  ErrorCode.SCREENSHOT_EXTRACT_PERMISSION_DENIED,
  ErrorCode.SCREENSHOT_TRANSLATE_PERMISSION_DENIED,
  ErrorCode.TEXT_API_KEY_MISSING,
  ErrorCode.SCREENSHOT_DIRECT_API_KEY_MISSING,
  ErrorCode.SCREENSHOT_EXTRACT_API_KEY_MISSING,
  ErrorCode.SCREENSHOT_TRANSLATE_API_KEY_MISSING,
  ErrorCode.TEXT_MODEL_MISSING,
  ErrorCode.VISION_MODEL_MISSING,
]);

export function getErrorAction(code?: ErrorCode): ErrorAction {
  if (code && OPEN_SETTINGS_CODES.has(code)) {
    return { kind: 'open-settings', label: '打开设置' };
  }

  return { kind: 'retry', label: '重试' };
}
