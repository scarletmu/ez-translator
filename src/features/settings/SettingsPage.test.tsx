import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY_SCREENSHOT_TRANSLATE } from '@/constants/storage-keys';
import { createTextConfig } from '@/test/factories';
import { getConfigStatus } from '@/services/storage/get-config-status';
import SettingsPage from './SettingsPage';
import { DEFAULT_SCREENSHOT_TRANSLATE_CONFIG } from './ScreenshotTranslateSection';

const reloadMock = vi.fn(async () => undefined);
const useStorageConfigMock = vi.fn();

vi.mock('@/hooks/useStorageConfig', () => ({
  useStorageConfig: () => useStorageConfigMock(),
}));

describe('SettingsPage', () => {
  it('saves the default screenshot reuse config when screenshot settings were never edited', async () => {
    useStorageConfigMock.mockReturnValue({
      textConfig: createTextConfig(),
      screenshotConfig: null,
      defaultTargetLang: 'zh-CN',
      configStatus: null,
      loading: false,
      reload: reloadMock,
    });

    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: '保存设置' }));

    await waitFor(() => expect(reloadMock).toHaveBeenCalled());

    await expect(getConfigStatus()).resolves.toEqual({
      textTranslateReady: true,
      screenshotTranslateReady: true,
      screenshotMode: 'direct_multimodal',
    });

    const stored = await chrome.storage.local.get(STORAGE_KEY_SCREENSHOT_TRANSLATE);
    expect(stored[STORAGE_KEY_SCREENSHOT_TRANSLATE]).toEqual(DEFAULT_SCREENSHOT_TRANSLATE_CONFIG);
  });
});
