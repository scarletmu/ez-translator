import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '@/errors';
import ScreenshotLaunchTab from '@/features/screenshot-translate/ScreenshotLaunchTab';

describe('ScreenshotLaunchTab', () => {
  it('shows settings guide when config is missing', () => {
    render(<ScreenshotLaunchTab configStatus={{ textTranslateReady: true, screenshotTranslateReady: false }} />);

    expect(screen.getByText('请先完成截图翻译配置，再启动页面框选模式。')).toBeInTheDocument();
  });

  it('starts screenshot mode when ready', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({ success: true });
    render(<ScreenshotLaunchTab configStatus={{ textTranslateReady: true, screenshotTranslateReady: true, screenshotMode: 'direct_multimodal' }} />);

    fireEvent.click(screen.getByRole('button', { name: '开始截图翻译' }));

    expect(await screen.findByRole('button', { name: '正在启动...' })).toBeDisabled();
  });

  it('shows launch error and settings CTA when permission is missing', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({
      success: false,
      error: {
        code: ErrorCode.SCREENSHOT_DIRECT_PERMISSION_DENIED,
        userMessage: '请先授权访问截图直译服务地址',
      },
    });
    render(<ScreenshotLaunchTab configStatus={{ textTranslateReady: true, screenshotTranslateReady: true, screenshotMode: 'direct_multimodal' }} />);

    fireEvent.click(screen.getByRole('button', { name: '开始截图翻译' }));

    expect(await screen.findByText('请先授权访问截图直译服务地址')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '打开设置' })).toBeInTheDocument();
  });
});
