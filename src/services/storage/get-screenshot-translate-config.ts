import type { ScreenshotTranslateConfig } from '@/contracts';
import { screenshotTranslateConfigSchema } from '@/schemas';
import { STORAGE_KEY_SCREENSHOT_TRANSLATE } from '@/constants/storage-keys';

export async function getScreenshotTranslateConfig(): Promise<ScreenshotTranslateConfig | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY_SCREENSHOT_TRANSLATE);
  const raw = result[STORAGE_KEY_SCREENSHOT_TRANSLATE];
  if (!raw) return null;

  const parsed = screenshotTranslateConfigSchema.safeParse(raw);
  if (!parsed.success) return null;

  return parsed.data as ScreenshotTranslateConfig;
}
