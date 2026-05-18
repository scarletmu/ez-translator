import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import TranslationOverlayCard from '@/components/TranslationOverlayCard';
import { MessageType } from '@/contracts';
import type { MessageEnvelope, TranslateResult } from '@/contracts';
import { getErrorAction } from '@/errors';
import type { ErrorCode } from '@/errors';
import { getSelectionRect } from '@/services/dom/get-selection-rect';
import { positionNearRect } from '@/services/dom/position-near-rect';
import { sendMessage } from '@/services/messaging';

type OverlayState = 'hidden' | 'trigger' | 'loading' | 'success' | 'error';
type OverlayPosition = { top: number; left: number };

const TRIGGER_BUTTON_SIZE = { width: 72, height: 32 };
const OVERLAY_FALLBACK_SIZE = { width: 320, height: 160 };

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

function resolveOverlayPosition(): OverlayPosition {
  const selection = getSelectionRect();
  if (selection) {
    return positionNearRect(selection.rect, OVERLAY_FALLBACK_SIZE);
  }
  return { top: window.scrollY + 80, left: window.scrollX + 80 };
}

export default function SelectionTranslateManager() {
  const [state, setState] = useState<OverlayState>('hidden');
  const [position, setPosition] = useState<OverlayPosition>({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [error, setError] = useState<{ code?: ErrorCode; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const selectionTimerRef = useRef<number | null>(null);

  const syncSelectionTrigger = useCallback(() => {
    if (selectionTimerRef.current !== null) {
      window.clearTimeout(selectionTimerRef.current);
    }

    selectionTimerRef.current = window.setTimeout(() => {
      selectionTimerRef.current = null;

      const selection = getSelectionRect();
      if (!selection) {
        setState((currentState) => (currentState === 'trigger' ? 'hidden' : currentState));
        return;
      }

      setSelectedText(selection.text);
      setPosition(positionNearRect(selection.rect, TRIGGER_BUTTON_SIZE));
      setState('trigger');
    }, 10);
  }, []);

  const dismiss = useCallback(() => {
    setState('hidden');
    setResult(null);
    setError(null);
    setCopied(false);
  }, []);

  const runTranslate = useCallback(async (text: string, overlayPosition: OverlayPosition) => {
    const normalized = text.trim();
    if (!normalized) return;

    setSelectedText(normalized);
    setPosition(overlayPosition);
    setState('loading');
    setError(null);
    setResult(null);
    setCopied(false);

    const pageContext = { title: document.title, url: location.href };
    const response = await sendMessage<{ text: string; pageContext: { title: string; url: string } }, TranslateResult>(
      MessageType.TRANSLATE_SELECTION,
      { text: normalized, pageContext },
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
  }, []);

  const handleTranslate = useCallback(() => {
    void runTranslate(selectedText, position);
  }, [runTranslate, selectedText, position]);

  const handleErrorAction = useCallback(() => {
    const action = getErrorAction(error?.code);
    if (action.kind === 'open-settings') {
      chrome.runtime.openOptionsPage();
      return;
    }

    handleTranslate();
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

    const onSelectionChange = () => {
      syncSelectionTrigger();
    };

    document.addEventListener('mouseup', syncSelectionTrigger);
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);

    return () => {
      document.removeEventListener('mouseup', syncSelectionTrigger);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);

      if (selectionTimerRef.current !== null) {
        window.clearTimeout(selectionTimerRef.current);
        selectionTimerRef.current = null;
      }
    };
  }, [dismiss, state, syncSelectionTrigger]);

  useEffect(() => {
    const listener = (message: MessageEnvelope) => {
      if (message.type !== MessageType.TRIGGER_SELECTION_TRANSLATE) return;
      const payload = message.payload as { text?: string } | undefined;
      const text = payload?.text?.trim();
      if (!text) return;

      void runTranslate(text, resolveOverlayPosition());
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [runTranslate]);

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
