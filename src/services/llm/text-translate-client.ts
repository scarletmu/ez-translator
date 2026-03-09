import type { ProviderProfile, TranslateResult, TranslateTextRequest } from '@/contracts';
import { AppError, ErrorCode } from '@/errors';
import { translateTextRequestSchema } from '@/schemas';
import { assertProviderProfileReady } from './assert-provider-profile';
import { fetchChatCompletion } from './fetch-chat-completion';
import { buildTextTranslatePrompt } from './prompt-builders';
import { parseTextTranslateResponse } from './response-parsers';

function validateRequest(request: TranslateTextRequest): void {
  const validation = translateTextRequestSchema.safeParse(request);
  if (validation.success) {
    return;
  }

  const textIssue = validation.error.issues.find((issue) => issue.path[0] === 'text');
  if (textIssue?.code === 'too_big') {
    throw new AppError(ErrorCode.TEXT_TOO_LONG);
  }

  throw new AppError(ErrorCode.INVALID_INPUT);
}

export async function translateText(
  request: TranslateTextRequest,
  profile: ProviderProfile,
): Promise<TranslateResult> {
  validateRequest(request);
  assertProviderProfileReady(profile, 'text');

  const messages = buildTextTranslatePrompt(request);
  const raw = await fetchChatCompletion(profile, messages);
  return parseTextTranslateResponse(raw, profile, request.targetLang);
}
