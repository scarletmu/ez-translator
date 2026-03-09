import type { TextTranslateConfig } from '@/contracts';
import { textTranslateConfigSchema } from '@/schemas';
import { STORAGE_KEY_TEXT_TRANSLATE } from '@/constants/storage-keys';

export async function getTextTranslateConfig(): Promise<TextTranslateConfig | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY_TEXT_TRANSLATE);
  const raw = result[STORAGE_KEY_TEXT_TRANSLATE];
  if (!raw) return null;

  const parsed = textTranslateConfigSchema.safeParse(raw);
  if (!parsed.success) return null;

  return parsed.data as TextTranslateConfig;
}
