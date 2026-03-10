import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '@/errors';
import PasteTranslateTab from '@/features/paste-translate/PasteTranslateTab';
import { createTranslateResult } from '@/test/factories';

describe('PasteTranslateTab', () => {
  it('shows settings guide when config is missing', () => {
    render(<PasteTranslateTab configStatus={{ textTranslateReady: false, screenshotTranslateReady: false }} targetLang="zh-CN" />);

    expect(screen.getByText('请先完成文本翻译配置，再进行粘贴翻译。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '打开设置' })).toBeInTheDocument();
  });

  it('shows loading state while translating', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockImplementationOnce(async () => new Promise(() => undefined));
    render(<PasteTranslateTab configStatus={{ textTranslateReady: true, screenshotTranslateReady: false }} targetLang="zh-CN" />);

    fireEvent.change(screen.getByPlaceholderText('粘贴要翻译的内容...'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '翻译' }));

    expect(screen.getByRole('button', { name: '翻译中...' })).toBeDisabled();
  });

  it('shows error state when translation fails', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({
      success: false,
      error: { code: ErrorCode.NETWORK_ERROR, userMessage: '网络连接失败，请检查网络设置' },
    });
    render(<PasteTranslateTab configStatus={{ textTranslateReady: true, screenshotTranslateReady: false }} targetLang="zh-CN" />);

    fireEvent.change(screen.getByPlaceholderText('粘贴要翻译的内容...'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '翻译' }));

    expect(await screen.findByText('网络连接失败，请检查网络设置')).toBeInTheDocument();
  });

  it('shows success state and copy feedback', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({ success: true, data: createTranslateResult() });
    render(<PasteTranslateTab configStatus={{ textTranslateReady: true, screenshotTranslateReady: false }} targetLang="zh-CN" />);

    fireEvent.change(screen.getByPlaceholderText('粘贴要翻译的内容...'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '翻译' }));

    expect(await screen.findByText('你好，世界')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '复制译文' }));
    await waitFor(() => expect(screen.getByText('复制成功')).toBeInTheDocument());
  });

  it('uses the popup-level target language in the request payload', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({ success: true, data: createTranslateResult({ targetLang: 'ja' }) });
    render(<PasteTranslateTab configStatus={{ textTranslateReady: true, screenshotTranslateReady: false }} targetLang="ja" />);

    fireEvent.change(screen.getByPlaceholderText('粘贴要翻译的内容...'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '翻译' }));

    await waitFor(() => expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'TRANSLATE_PASTE',
      payload: { text: 'hello', targetLang: 'ja' },
    }));
  });
});
