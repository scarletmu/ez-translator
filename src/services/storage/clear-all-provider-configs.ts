import {
  STORAGE_KEY_TEXT_TRANSLATE,
  STORAGE_KEY_SCREENSHOT_TRANSLATE,
  STORAGE_KEY_DEFAULT_TARGET_LANG,
} from '@/constants/storage-keys';

export async function clearAllProviderConfigs(): Promise<void> {
  await chrome.storage.local.remove([
    STORAGE_KEY_TEXT_TRANSLATE,
    STORAGE_KEY_SCREENSHOT_TRANSLATE,
    STORAGE_KEY_DEFAULT_TARGET_LANG,
  ]);
}
