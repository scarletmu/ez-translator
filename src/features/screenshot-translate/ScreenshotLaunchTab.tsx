import { useCallback, useState } from 'react';
import type { ConfigStatus } from '@/contracts';
import { MessageType } from '@/contracts';
import StatusMessage from '@/components/StatusMessage';
import type { ErrorCode } from '@/errors';
import { getErrorAction } from '@/errors';
import { sendMessage } from '@/services/messaging';

interface ScreenshotLaunchTabProps {
  configStatus: ConfigStatus | null;
}

export default function ScreenshotLaunchTab({ configStatus }: ScreenshotLaunchTabProps) {
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<{ code?: ErrorCode; message: string } | null>(null);

  const isReady = configStatus?.screenshotTranslateReady ?? false;
  const modeLabel = configStatus?.screenshotMode === 'extract_then_translate' ? '提取后翻译' : '直接多模态';

  const handleStart = useCallback(async () => {
    setLaunching(true);
    setLaunchError(null);

    const response = await sendMessage(MessageType.START_SCREENSHOT_TRANSLATE, {});
    if (response.success) {
      setTimeout(() => window.close(), 300);
      return;
    }

    setLaunchError({
      code: response.error?.code,
      message: response.error?.userMessage || '启动截图翻译失败，请稍后重试',
    });
    setLaunching(false);
  }, []);

  if (!isReady) {
    return (
      <div className="panel-card empty-card">
        <StatusMessage
          type="warning"
          message="请先完成截图翻译配置，再启动页面框选模式。"
          action={(
            <button type="button" className="btn btn-outline btn-sm" onClick={() => chrome.runtime.openOptionsPage()}>
              打开设置
            </button>
          )}
        />
      </div>
    );
  }

  return (
    <div className="screenshot-tab">
      <StatusMessage type="info" message={`当前模式：${modeLabel}，仅上传你框选的区域，不会上传整页截图。`} />
      {launchError ? (
        <StatusMessage
          type="error"
          message={launchError.message}
          action={(
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                const action = getErrorAction(launchError.code);
                if (action.kind === 'open-settings') {
                  chrome.runtime.openOptionsPage();
                  return;
                }
                void handleStart();
              }}
            >
              {getErrorAction(launchError.code).label}
            </button>
          )}
        />
      ) : null}
      <button
        type="button"
        className="btn btn-primary action-button"
        style={{ marginTop: 'var(--space-lg)' }}
        onClick={() => void handleStart()}
        disabled={launching}
      >
        {launching ? '正在启动...' : '开始截图翻译'}
      </button>
    </div>
  );
}
