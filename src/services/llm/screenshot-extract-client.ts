import type { ProviderProfile } from '@/contracts';
import { assertProviderProfileReady } from './assert-provider-profile';
import { fetchChatCompletion } from './fetch-chat-completion';
import { buildImageUserMessage, buildScreenshotExtractPrompt } from './prompt-builders';
import { parseScreenshotExtractResponse } from './response-parsers';

export async function extractScreenshotText(
  imageBase64: string,
  mimeType: string,
  profile: ProviderProfile,
): Promise<string> {
  assertProviderProfileReady(profile, 'screenshot_extract');

  const messages = [
    ...buildScreenshotExtractPrompt(),
    buildImageUserMessage(imageBase64, mimeType),
  ];
  const raw = await fetchChatCompletion(profile, messages);
  return parseScreenshotExtractResponse(raw);
}
