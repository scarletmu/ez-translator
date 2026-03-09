import { AppError, ErrorCode } from '@/errors';

export async function captureVisibleTab(): Promise<string> {
  try {
    return await chrome.tabs.captureVisibleTab(chrome.windows.WINDOW_ID_CURRENT, { format: 'png' });
  } catch {
    throw new AppError(ErrorCode.SCREENSHOT_CAPTURE_FAILED);
  }
}
