import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import TranslationOverlayCard from '@/components/TranslationOverlayCard';
import type { MessageEnvelope, ScreenshotRegion, TranslateResult } from '@/contracts';
import { MessageType } from '@/contracts';
import { ERROR_MESSAGES, ErrorCode } from '@/errors';
import type { ErrorCode as AppErrorCode } from '@/errors';
import { sendMessage } from '@/services/messaging';

type ScreenshotState = 'idle' | 'armed' | 'selecting' | 'processing' | 'success' | 'error';

const MIN_SIZE = 20;

const hintStyle: CSSProperties = {
  position: 'fixed',
  top: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 2147483647,
  background: 'rgba(0,0,0,0.75)',
  color: '#fff',
  padding: '8px 20px',
  borderRadius: 6,
  fontSize: 14,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
};

const maskStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2147483646,
  cursor: 'crosshair',
  background: 'rgba(0, 0, 0, 0.3)',
};

export default function ScreenshotModeManager() {
  const [state, setState] = useState<ScreenshotState>('idle');
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [error, setError] = useState<{ code?: AppErrorCode; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [resultPos, setResultPos] = useState({ top: 0, left: 0 });
  const regionRef = useRef<ScreenshotRegion | null>(null);

  const dismiss = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
    setCopied(false);
  }, []);

  const showError = useCallback((code: AppErrorCode, message?: string) => {
    setResult(null);
    setError({
      code,
      message: message || ERROR_MESSAGES[code],
    });
    setState('error');
  }, []);

  const submitRegion = useCallback(async (region: ScreenshotRegion) => {
    setState('processing');
    setError(null);

    const response = await sendMessage<{ region: ScreenshotRegion; pageContext: { title: string; url: string } }, TranslateResult>(
      MessageType.SUBMIT_SCREENSHOT_REGION,
      {
        region,
        pageContext: { title: document.title, url: location.href },
      },
    );

    if (response.success && response.data) {
      setResult(response.data);
      setState('success');
      return;
    }

    showError(response.error?.code || ErrorCode.INTERNAL_ERROR, response.error?.userMessage);
  }, [showError]);

  useEffect(() => {
    const listener = (message: MessageEnvelope) => {
      if (message.type === MessageType.ENTER_SCREENSHOT_MODE) {
        setState('armed');
        setResult(null);
        setError(null);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (state !== 'armed') {
      return;
    }

    setStartPoint({ x: event.clientX, y: event.clientY });
    setEndPoint({ x: event.clientX, y: event.clientY });
    setState('selecting');
  }, [state]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (state !== 'selecting') {
      return;
    }

    setEndPoint({ x: event.clientX, y: event.clientY });
  }, [state]);

  const handleMouseUp = useCallback(async () => {
    if (state !== 'selecting') {
      return;
    }

    const x = Math.min(startPoint.x, endPoint.x);
    const y = Math.min(startPoint.y, endPoint.y);
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);

    setResultPos({
      top: Math.min(y + height + 8, window.innerHeight - 200),
      left: Math.min(x, window.innerWidth - 380),
    });

    if (width < MIN_SIZE || height < MIN_SIZE) {
      showError(ErrorCode.SCREENSHOT_REGION_INVALID);
      return;
    }

    const region: ScreenshotRegion = {
      x,
      y,
      width,
      height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    };

    regionRef.current = region;
    await submitRegion(region);
  }, [endPoint, showError, startPoint, state, submitRegion]);

  const handleRetry = useCallback(async () => {
    if (!regionRef.current) {
      setState('armed');
      setError(null);
      return;
    }

    await submitRegion(regionRef.current);
  }, [submitRegion]);

  const handleCopy = useCallback(async () => {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dismiss]);

  if (state === 'idle') {
    return null;
  }

  const selectionLeft = Math.min(startPoint.x, endPoint.x);
  const selectionTop = Math.min(startPoint.y, endPoint.y);
  const selectionWidth = Math.abs(endPoint.x - startPoint.x);
  const selectionHeight = Math.abs(endPoint.y - startPoint.y);

  const hintText = state === 'armed'
    ? '拖拽选择要翻译的区域，按 Esc 取消'
    : state === 'selecting'
      ? '松开鼠标开始翻译'
      : '正在识别并翻译区域内容...';

  const canReselect = error?.code === ErrorCode.SCREENSHOT_REGION_INVALID || error?.code === ErrorCode.IMAGE_TOO_LARGE;

  return (
    <>
      {state === 'armed' || state === 'selecting' || state === 'processing' ? (
        <>
          <div style={maskStyle} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => void handleMouseUp()} />
          <div style={hintStyle}>{hintText}</div>
        </>
      ) : null}

      {state === 'selecting' && selectionWidth > 0 && selectionHeight > 0 ? (
        <div
          style={{
            position: 'fixed',
            top: selectionTop,
            left: selectionLeft,
            width: selectionWidth,
            height: selectionHeight,
            zIndex: 2147483647,
            border: '2px solid #4a90d9',
            background: 'rgba(74, 144, 217, 0.1)',
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {state === 'processing' ? (
        <TranslationOverlayCard
          title="截图翻译结果"
          position={resultPos}
          positioning="fixed"
          status="loading"
          loadingMessage="正在识别并翻译区域内容..."
          onClose={dismiss}
        />
      ) : null}

      {state === 'error' && error ? (
        <TranslationOverlayCard
          title="截图翻译结果"
          position={resultPos}
          positioning="fixed"
          status="error"
          errorCode={error.code}
          errorMessage={error.message}
          onClose={dismiss}
          onRetry={() => void handleRetry()}
          onOpenSettings={() => chrome.runtime.openOptionsPage()}
          actionLabelOverride={canReselect ? '重新框选' : undefined}
          onActionOverride={canReselect ? () => {
            setError(null);
            setState('armed');
          } : undefined}
        />
      ) : null}

      {state === 'success' && result ? (
        <TranslationOverlayCard
          title="截图翻译结果"
          position={resultPos}
          positioning="fixed"
          status="success"
          result={result}
          originalLabel="识别原文"
          translatedLabel="译文"
          copied={copied}
          onCopy={() => void handleCopy()}
          onRetry={() => void handleRetry()}
          onClose={dismiss}
        />
      ) : null}
    </>
  );
}
