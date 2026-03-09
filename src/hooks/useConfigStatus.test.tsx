import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MessageType } from '@/contracts';
import { useConfigStatus } from '@/hooks/useConfigStatus';

describe('useConfigStatus', () => {
  it('loads config status successfully', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({
      success: true,
      data: {
        textTranslateReady: true,
        screenshotTranslateReady: false,
        screenshotMode: 'direct_multimodal',
      },
    });

    const { result } = renderHook(() => useConfigStatus());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.configStatus).toEqual({
      textTranslateReady: true,
      screenshotTranslateReady: false,
      screenshotMode: 'direct_multimodal',
    });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: MessageType.GET_PROVIDER_CONFIG_STATUS, payload: {} });
  });

  it('falls back to null on message failure', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({ success: false });

    const { result } = renderHook(() => useConfigStatus());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.configStatus).toBeNull();
  });
});
