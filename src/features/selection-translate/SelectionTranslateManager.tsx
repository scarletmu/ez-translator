import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import TranslationOverlayCard from '@/components/TranslationOverlayCard';
import { MessageType } from '@/contracts';
import type { TranslateResult } from '@/contracts';
import { getErrorAction } from '@/errors';
import type { ErrorCode } from '@/errors';
import { getSelectionRect } from '@/services/dom/get-selection-rect';
import { positionNearRect } from '@/services/dom/position-near-rect';
import { sendMessage } from '@/services/messaging';

type OverlayState = 'hidden' | 'trigger' | 'loading' | 'success' | 'error';

const triggerButtonStyle: CSSProperties = {
  position: 'absolute',
  zIndex: 2147483647,
  background: '#4a90d9',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '4px 10px',
  fontSize: 13,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  whiteSpace: 'nowrap',
};

export default function SelectionTranslateManager() {
  const [state, setState] = useState<OverlayState>('hidden');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [error, setError] = useState<{ code?: ErrorCode; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    setState('hidden');
    setResult(null);
    setError(null);
    setCopied(false);
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!selectedText.trim()) {
      return;
    }

    setState('loading');
    setError(null);

    const pageContext = { title: document.title, url: location.href };
    const response = await sendMessage<{ text: string; pageContext: { title: string; url: string } }, TranslateResult>(
      MessageType.TRANSLATE_SELECTION,
      { text: selectedText, pageContext },
    );

    if (response.success && response.data) {
      setResult(response.data);
      setState('success');
      return;
    }

    setError({
      code: response.error?.code,
      message: response.error?.userMessage || '翻译失败，请稍后重试',
    });
    setState('error');
  }, [selectedText]);

  const handleErrorAction = useCallback(() => {
    const action = getErrorAction(error?.code);
    if (action.kind === 'open-settings') {
      chrome.runtime.openOptionsPage();
      return;
    }

    void handleTranslate();
  }, [error?.code, handleTranslate]);

  const handleCopy = useCallback(async () => {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  useEffect(() => {
    const onMouseUp = () => {
      setTimeout(() => {
        const selection = getSelectionRect();
        if (!selection) {
          setState((currentState) => (currentState === 'trigger' ? 'hidden' : currentState));
          return;
        }

        setSelectedText(selection.text);
        setPosition(positionNearRect(selection.rect, { width: 72, height: 32 }));
        setState('trigger');
      }, 10);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss();
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      if (state === 'hidden') {
        return;
      }

      const target = event.target as HTMLElement;
      if (target.classList?.contains('translator-trigger-btn')) {
        return;
      }

      if (overlayRef.current && !overlayRef.current.contains(target)) {
        dismiss();
      }
    };

    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);

    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [dismiss, state]);

  if (state === 'hidden') {
    return null;
  }

  return (
    <>
      {state === 'trigger' ? (
        <button
          type="button"
          className="translator-trigger-btn"
          style={{ ...triggerButtonStyle, top: position.top, left: position.left }}
          onClick={() => void handleTranslate()}
        >
          翻译
        </button>
      ) : null}

      {state === 'loading' ? (
        <TranslationOverlayCard
          ref={overlayRef}
          title="翻译结果"
          position={position}
          positioning="absolute"
          status="loading"
          loadingMessage="正在翻译选中文本..."
          onClose={dismiss}
        />
      ) : null}

      {state === 'error' && error ? (
        <TranslationOverlayCard
          ref={overlayRef}
          title="翻译结果"
          position={position}
          positioning="absolute"
          status="error"
          errorCode={error.code}
          errorMessage={error.message}
          onRetry={() => void handleTranslate()}
          onOpenSettings={() => chrome.runtime.openOptionsPage()}
          onClose={dismiss}
          onActionOverride={handleErrorAction}
          actionLabelOverride={getErrorAction(error.code).label}
        />
      ) : null}

      {state === 'success' && result ? (
        <TranslationOverlayCard
          ref={overlayRef}
          title="翻译结果"
          position={position}
          positioning="absolute"
          status="success"
          result={result}
          originalLabel="原文"
          translatedLabel="译文"
          copied={copied}
          onCopy={() => void handleCopy()}
          onRetry={() => void handleTranslate()}
          onClose={dismiss}
        />
      ) : null}
    </>
  );
}
