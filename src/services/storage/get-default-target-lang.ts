import { DEFAULT_TARGET_LANG } from '@/constants/languages';
import { STORAGE_KEY_DEFAULT_TARGET_LANG } from '@/constants/storage-keys';

export async function getDefaultTargetLang(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEY_DEFAULT_TARGET_LANG);
  const lang = result[STORAGE_KEY_DEFAULT_TARGET_LANG];
  return typeof lang === 'string' && lang.length > 0 ? lang : DEFAULT_TARGET_LANG;
}
