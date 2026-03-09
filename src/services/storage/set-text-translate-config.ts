import type { TextTranslateConfig } from '@/contracts';
import { textTranslateConfigSchema } from '@/schemas';
import { STORAGE_KEY_TEXT_TRANSLATE } from '@/constants/storage-keys';

export async function setTextTranslateConfig(config: TextTranslateConfig): Promise<void> {
  textTranslateConfigSchema.parse(config);
  await chrome.storage.local.set({ [STORAGE_KEY_TEXT_TRANSLATE]: config });
}
