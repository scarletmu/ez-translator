import type { ProviderProfile } from '@/contracts';
import { AppError, ErrorCode } from '@/errors';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatContentPart[];
}

export interface ChatContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string; detail?: string };
}

const REQUEST_TIMEOUT_MS = 30_000;
const VISION_UNSUPPORTED_HINTS = ['vision', 'image', 'multimodal', 'image_url', 'not support'];

function includesImageContent(messages: ChatMessage[]): boolean {
  return messages.some(
    (message) => Array.isArray(message.content) && message.content.some((part) => part.type === 'image_url'),
  );
}

async function readErrorBody(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const payload = await response.json() as { error?: { message?: string }; message?: string };
      return payload.error?.message || payload.message || '';
    }

    return await response.text();
  } catch {
    return '';
  }
}

function isVisionModelUnsupported(status: number, body: string, hasImageInput: boolean): boolean {
  if (!hasImageInput) {
    return false;
  }

  const normalized = body.toLowerCase();
  return [400, 404, 415, 422].includes(status)
    && VISION_UNSUPPORTED_HINTS.some((hint) => normalized.includes(hint));
}

export async function fetchChatCompletion(
  profile: ProviderProfile,
  messages: ChatMessage[],
): Promise<unknown> {
  const url = `${profile.baseUrl}/chat/completions`;
  const hasImageInput = includesImageContent(messages);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${profile.apiKey}`,
      },
      body: JSON.stringify({
        model: profile.model,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await readErrorBody(response);

      if (response.status === 408 || response.status === 504) {
        throw new AppError(ErrorCode.UPSTREAM_TIMEOUT);
      }

      if (response.status === 401 || response.status === 403) {
        throw new AppError(ErrorCode.UPSTREAM_BAD_RESPONSE);
      }

      if (isVisionModelUnsupported(response.status, errorBody, hasImageInput)) {
        throw new AppError(ErrorCode.VISION_MODEL_UNSUPPORTED);
      }

      throw new AppError(ErrorCode.UPSTREAM_BAD_RESPONSE);
    }

    try {
      return await response.json();
    } catch {
      throw new AppError(ErrorCode.UPSTREAM_BAD_RESPONSE);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AppError(ErrorCode.UPSTREAM_TIMEOUT);
    }

    throw new AppError(ErrorCode.NETWORK_ERROR);
  } finally {
    clearTimeout(timeoutId);
  }
}
