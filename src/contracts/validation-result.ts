import type { ScreenshotTranslateMode } from './screenshot-translate-config';

export interface ProviderValidationResult {
  ok: boolean;
  provider: string;
  baseUrl: string;
  model: string;
  permissionGranted: boolean;
  error?: string;
}

export interface ConfigValidationStatus {
  textTranslate?: ProviderValidationResult;
  screenshotTranslate?: {
    mode: ScreenshotTranslateMode;
    direct?: ProviderValidationResult;
    extract?: ProviderValidationResult;
    translate?: ProviderValidationResult;
  };
}
