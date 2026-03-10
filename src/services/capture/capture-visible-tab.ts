import { AppError, ErrorCode } from '@/errors';

export async function captureVisibleTab(windowId?: number): Promise<string> {
  try {
    const targetWindowId = typeof windowId === 'number'
      ? windowId
      : chrome.windows.WINDOW_ID_CURRENT;

    return await chrome.tabs.captureVisibleTab(targetWindowId, { format: 'png' });
  } catch (error) {
    console.warn('[capture] captureVisibleTab failed', {
      windowId: windowId ?? null,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    throw new AppError(ErrorCode.SCREENSHOT_CAPTURE_FAILED);
  }
}
