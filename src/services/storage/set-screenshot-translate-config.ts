import type { ScreenshotTranslateConfig } from '@/contracts';
import { screenshotTranslateConfigSchema } from '@/schemas';
import { STORAGE_KEY_SCREENSHOT_TRANSLATE } from '@/constants/storage-keys';

export async function setScreenshotTranslateConfig(config: ScreenshotTranslateConfig): Promise<void> {
  screenshotTranslateConfigSchema.parse(config);
  await chrome.storage.local.set({ [STORAGE_KEY_SCREENSHOT_TRANSLATE]: config });
}
