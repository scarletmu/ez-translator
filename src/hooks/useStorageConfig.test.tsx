import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY_DEFAULT_TARGET_LANG, STORAGE_KEY_SCREENSHOT_TRANSLATE, STORAGE_KEY_TEXT_TRANSLATE } from '@/constants/storage-keys';
import { useStorageConfig } from '@/hooks/useStorageConfig';
import { createDirectScreenshotConfig, createTextConfig } from '@/test/factories';

describe('useStorageConfig', () => {
  it('loads storage-backed config successfully', async () => {
    await chrome.storage.local.set({
      [STORAGE_KEY_TEXT_TRANSLATE]: createTextConfig(),
      [STORAGE_KEY_SCREENSHOT_TRANSLATE]: createDirectScreenshotConfig(),
      [STORAGE_KEY_DEFAULT_TARGET_LANG]: 'ja',
    });
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({
      success: true,
      data: {
        textTranslateReady: true,
        screenshotTranslateReady: true,
        screenshotMode: 'direct_multimodal',
      },
    });

    const { result } = renderHook(() => useStorageConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.textConfig).toEqual(createTextConfig());
    expect(result.current.screenshotConfig).toEqual(createDirectScreenshotConfig());
    expect(result.current.defaultTargetLang).toBe('ja');
  });

  it('falls back to default values when storage read fails', async () => {
    vi.mocked(chrome.storage.local.get).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useStorageConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.textConfig).toBeNull();
    expect(result.current.screenshotConfig).toBeNull();
    expect(result.current.defaultTargetLang).toBe('zh-CN');
    expect(result.current.configStatus).toBeNull();
  });
});
