import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '@/errors';
import { fetchChatCompletion } from '@/services/llm/fetch-chat-completion';
import { createProviderProfile } from '@/test/factories';

const profile = createProviderProfile();

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('fetchChatCompletion', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('returns json payload on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(createJsonResponse({ id: 'ok' }));

    await expect(fetchChatCompletion(profile, [{ role: 'user', content: 'hello' }])).resolves.toEqual({ id: 'ok' });
  });

  it('maps 401 and 403 to upstream bad response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(createJsonResponse({ error: { message: 'forbidden' } }, 401));
    await expect(fetchChatCompletion(profile, [{ role: 'user', content: 'hello' }])).rejects.toMatchObject({ code: ErrorCode.UPSTREAM_BAD_RESPONSE });

    vi.mocked(fetch).mockResolvedValueOnce(createJsonResponse({ error: { message: 'forbidden' } }, 403));
    await expect(fetchChatCompletion(profile, [{ role: 'user', content: 'hello' }])).rejects.toMatchObject({ code: ErrorCode.UPSTREAM_BAD_RESPONSE });
  });

  it('maps 5xx to upstream bad response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(createJsonResponse({ error: { message: 'server error' } }, 500));

    await expect(fetchChatCompletion(profile, [{ role: 'user', content: 'hello' }])).rejects.toMatchObject({ code: ErrorCode.UPSTREAM_BAD_RESPONSE });
  });

  it('maps aborted request to timeout', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

    await expect(fetchChatCompletion(profile, [{ role: 'user', content: 'hello' }])).rejects.toMatchObject({ code: ErrorCode.UPSTREAM_TIMEOUT });
  });

  it('maps network errors to network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('socket hang up'));

    await expect(fetchChatCompletion(profile, [{ role: 'user', content: 'hello' }])).rejects.toMatchObject({ code: ErrorCode.NETWORK_ERROR });
  });

  it('maps unsupported vision model responses when image input exists', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(createJsonResponse({ error: { message: 'This model does not support image_url input' } }, 400));

    await expect(
      fetchChatCompletion(profile, [{ role: 'user', content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,Zm9v' } }] }]),
    ).rejects.toMatchObject({ code: ErrorCode.VISION_MODEL_UNSUPPORTED });
  });
});
