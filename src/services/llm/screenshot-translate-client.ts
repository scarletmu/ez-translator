import type { ProviderProfile, TranslateResult } from '@/contracts';
import { assertProviderProfileReady } from './assert-provider-profile';
import { fetchChatCompletion } from './fetch-chat-completion';
import { buildScreenshotTranslatePrompt } from './prompt-builders';
import { parseTextTranslateResponse } from './response-parsers';

export async function translateExtractedText(
  text: string,
  targetLang: string,
  profile: ProviderProfile,
): Promise<TranslateResult> {
  assertProviderProfileReady(profile, 'screenshot_translate');

  const messages = buildScreenshotTranslatePrompt(text, targetLang);
  const raw = await fetchChatCompletion(profile, messages);
  return parseTextTranslateResponse(raw, profile, targetLang);
}
