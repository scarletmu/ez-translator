import { STORAGE_KEY_DEFAULT_TARGET_LANG } from '@/constants/storage-keys';

export async function setDefaultTargetLang(lang: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_DEFAULT_TARGET_LANG]: lang });
}
