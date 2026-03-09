import type { ProviderProfile, TranslateResult } from '@/contracts';
import { assertProviderProfileReady } from './assert-provider-profile';
import { fetchChatCompletion } from './fetch-chat-completion';
import { buildImageUserMessage, buildScreenshotDirectPrompt } from './prompt-builders';
import { parseScreenshotDirectResponse } from './response-parsers';

export async function translateScreenshotDirect(
  imageBase64: string,
  mimeType: string,
  targetLang: string,
  profile: ProviderProfile,
): Promise<TranslateResult> {
  assertProviderProfileReady(profile, 'screenshot_direct');

  const messages = [
    ...buildScreenshotDirectPrompt(targetLang),
    buildImageUserMessage(imageBase64, mimeType),
  ];
  const raw = await fetchChatCompletion(profile, messages);
  return parseScreenshotDirectResponse(raw, profile, targetLang);
}
