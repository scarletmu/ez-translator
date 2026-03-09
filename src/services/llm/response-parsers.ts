import type { TranslateResult, ProviderProfile } from '@/contracts';
import { AppError, ErrorCode } from '@/errors';

function generateRequestId(): string {
  return `local_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function extractContent(raw: unknown): string {
  const data = raw as { choices?: Array<{ message?: { content?: string } }> };
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.length === 0) {
    throw new AppError(ErrorCode.UPSTREAM_BAD_RESPONSE, 'Empty response content');
  }
  return content.trim();
}

function parseJsonFromContent(content: string): { originalText: string; translatedText: string } {
  // Try to extract JSON from markdown code blocks or raw JSON
  let jsonStr = content;
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed.originalText === 'string' && typeof parsed.translatedText === 'string') {
      return parsed;
    }
    throw new Error('Missing required fields');
  } catch {
    throw new AppError(ErrorCode.UPSTREAM_BAD_RESPONSE, 'Failed to parse translation response as JSON');
  }
}

export function parseTextTranslateResponse(
  raw: unknown,
  profile: ProviderProfile,
  targetLang: string,
): TranslateResult {
  const content = extractContent(raw);
  const parsed = parseJsonFromContent(content);

  return {
    originalText: parsed.originalText,
    translatedText: parsed.translatedText,
    targetLang,
    model: profile.model,
    provider: profile.providerPreset,
    requestId: generateRequestId(),
  };
}

export function parseScreenshotDirectResponse(
  raw: unknown,
  profile: ProviderProfile,
  targetLang: string,
): TranslateResult {
  const content = extractContent(raw);
  const parsed = parseJsonFromContent(content);

  return {
    originalText: parsed.originalText,
    translatedText: parsed.translatedText,
    targetLang,
    model: profile.model,
    provider: profile.providerPreset,
    requestId: generateRequestId(),
  };
}

export function parseScreenshotExtractResponse(raw: unknown): string {
  return extractContent(raw);
}
