import type { ScreenshotTranslateMode } from './screenshot-translate-config';

export interface ConfigStatus {
  textTranslateReady: boolean;
  screenshotTranslateReady: boolean;
  screenshotMode?: ScreenshotTranslateMode;
}
