import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MessageType } from '@/contracts';
import { STORAGE_KEY_DEFAULT_TARGET_LANG } from '@/constants/storage-keys';
import { createTranslateResult } from '@/test/factories';
import App from './App';

function mockPopupMessages() {
  vi.mocked(chrome.runtime.sendMessage).mockImplementation(async (envelope: unknown) => {
    const message = envelope as { type: MessageType; payload: Record<string, unknown> };

    switch (message.type) {
      case MessageType.GET_PROVIDER_CONFIG_STATUS:
        return {
          success: true,
          data: {
            textTranslateReady: true,
            screenshotTranslateReady: true,
            screenshotMode: 'direct_multimodal',
          },
        };
      case MessageType.TRANSLATE_PASTE:
        return {
          success: true,
          data: createTranslateResult({ targetLang: message.payload.targetLang as string }),
        };
      case MessageType.START_SCREENSHOT_TRANSLATE:
        return { success: true };
      default:
        return { success: true };
    }
  });
}

describe('popup App', () => {
  it('loads the stored default language and uses it as the popup session initial value', async () => {
    await chrome.storage.local.set({ [STORAGE_KEY_DEFAULT_TARGET_LANG]: 'ja' });
    mockPopupMessages();

    render(<App />);

    await waitFor(() => expect(screen.getByLabelText('选择目标语言')).toHaveValue('ja'));
  });

  it('uses the header language for paste translation and screenshot launch', async () => {
    await chrome.storage.local.set({ [STORAGE_KEY_DEFAULT_TARGET_LANG]: 'ja' });
    mockPopupMessages();

    render(<App />);

    const languageSelect = await screen.findByLabelText('选择目标语言');
    fireEvent.change(languageSelect, { target: { value: 'en' } });

    fireEvent.change(screen.getByPlaceholderText('粘贴要翻译的内容...'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '翻译' }));

    await waitFor(() => expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MessageType.TRANSLATE_PASTE,
      payload: { text: 'hello', targetLang: 'en' },
    }));

    fireEvent.click(screen.getByRole('tab', { name: '截图翻译' }));
    fireEvent.click(screen.getByRole('button', { name: '开始截图翻译' }));

    await waitFor(() => expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MessageType.START_SCREENSHOT_TRANSLATE,
      payload: { targetLang: 'en' },
    }));
  });

  it('does not persist popup-only language changes across popup sessions', async () => {
    await chrome.storage.local.set({ [STORAGE_KEY_DEFAULT_TARGET_LANG]: 'ja' });
    mockPopupMessages();

    const firstRender = render(<App />);
    const firstSelect = await screen.findByLabelText('选择目标语言');
    fireEvent.change(firstSelect, { target: { value: 'en' } });
    expect(firstSelect).toHaveValue('en');
    firstRender.unmount();

    mockPopupMessages();
    render(<App />);

    await waitFor(() => expect(screen.getByLabelText('选择目标语言')).toHaveValue('ja'));
    const stored = await chrome.storage.local.get(STORAGE_KEY_DEFAULT_TARGET_LANG);
    expect(stored[STORAGE_KEY_DEFAULT_TARGET_LANG]).toBe('ja');
  });
});
