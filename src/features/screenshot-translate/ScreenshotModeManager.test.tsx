import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MessageType } from '@/contracts';
import { createTranslateResult } from '@/test/factories';
import ScreenshotModeManager from './ScreenshotModeManager';

describe('ScreenshotModeManager', () => {
  it('forwards the popup session target language when submitting a screenshot region', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({
      success: true,
      data: createTranslateResult({ targetLang: 'ja' }),
    });

    const { container } = render(<ScreenshotModeManager />);
    const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0];

    act(() => {
      listener(
        { type: MessageType.ENTER_SCREENSHOT_MODE, payload: { targetLang: 'ja' } },
        {} as chrome.runtime.MessageSender,
        () => undefined,
      );
    });

    const mask = container.querySelector('div[style*="cursor: crosshair"]');
    expect(mask).not.toBeNull();

    fireEvent.mouseDown(mask!, { clientX: 10, clientY: 20 });
    fireEvent.mouseMove(mask!, { clientX: 90, clientY: 120 });
    fireEvent.mouseUp(mask!);

    await waitFor(() => expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MessageType.SUBMIT_SCREENSHOT_REGION,
      payload: expect.objectContaining({
        targetLang: 'ja',
        pageContext: {
          title: document.title,
          url: location.href,
        },
      }),
    }));
  });
});
