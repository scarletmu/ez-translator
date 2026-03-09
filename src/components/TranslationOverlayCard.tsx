import { forwardRef } from 'react';
import type { TranslateResult } from '@/contracts';
import type { ErrorCode } from '@/errors';
import { getErrorAction } from '@/errors';

export type TranslationOverlayStatus = 'loading' | 'error' | 'success';

interface TranslationOverlayCardProps {
  title: string;
  position: { top: number; left: number };
  positioning?: 'absolute' | 'fixed';
  status: TranslationOverlayStatus;
  loadingMessage?: string;
  errorCode?: ErrorCode;
  errorMessage?: string;
  result?: Pick<TranslateResult, 'originalText' | 'translatedText'>;
  originalLabel?: string;
  translatedLabel?: string;
  copied?: boolean;
  onClose: () => void;
  onCopy?: () => void;
  onRetry?: () => void;
  onOpenSettings?: () => void;
  actionLabelOverride?: string;
  onActionOverride?: () => void;
}

function resolveAction(
  errorCode: ErrorCode | undefined,
  onRetry: (() => void) | undefined,
  onOpenSettings: (() => void) | undefined,
  actionLabelOverride: string | undefined,
  onActionOverride: (() => void) | undefined,
) {
  if (actionLabelOverride && onActionOverride) {
    return { label: actionLabelOverride, onClick: onActionOverride };
  }

  const action = getErrorAction(errorCode);
  if (action.kind === 'open-settings' && onOpenSettings) {
    return { label: action.label, onClick: onOpenSettings };
  }

  if (action.kind === 'retry' && onRetry) {
    return { label: action.label, onClick: onRetry };
  }

  return null;
}

const baseButtonStyle = {
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '12px',
  lineHeight: 1.5,
  padding: '4px 8px',
  borderRadius: '4px',
} as const;

const overlayTextStyle = {
  fontSize: '14px',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  userSelect: 'text',
} as const;

const TranslationOverlayCard = forwardRef<HTMLDivElement, TranslationOverlayCardProps>(function TranslationOverlayCard(
  {
    title,
    position,
    positioning = 'absolute',
    status,
    loadingMessage = '处理中...',
    errorCode,
    errorMessage,
    result,
    originalLabel = '原文',
    translatedLabel = '译文',
    copied = false,
    onClose,
    onCopy,
    onRetry,
    onOpenSettings,
    actionLabelOverride,
    onActionOverride,
  },
  ref,
) {
  const errorAction = resolveAction(
    errorCode,
    onRetry,
    onOpenSettings,
    actionLabelOverride,
    onActionOverride,
  );

  return (
    <div
      ref={ref}
      style={{
        position: positioning,
        top: position.top,
        left: position.left,
        zIndex: 2147483647,
        width: 360,
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'min(420px, calc(100vh - 24px))',
        overflowY: 'auto',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        background: '#fff',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        color: '#1a1a1a',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid #f0f0f0',
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        <span>{title}</span>
        <button
          type="button"
          aria-label="关闭"
          onClick={onClose}
          style={{
            ...baseButtonStyle,
            fontSize: '16px',
            color: '#999',
            padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>

      {status === 'loading' ? (
        <div style={{ padding: '18px 14px', color: '#666', fontSize: 13 }}>{loadingMessage}</div>
      ) : null}

      {status === 'error' ? (
        <>
          <div style={{ padding: '14px', color: '#f5222d', fontSize: 13 }}>{errorMessage}</div>
          {errorAction ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                gap: 8,
                padding: '8px 14px',
                borderTop: '1px solid #f0f0f0',
              }}
            >
              <button
                type="button"
                onClick={errorAction.onClick}
                style={{
                  ...baseButtonStyle,
                  color: '#4a90d9',
                }}
              >
                {errorAction.label}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {status === 'success' && result ? (
        <>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4, fontWeight: 500 }}>{originalLabel}</div>
            <div style={overlayTextStyle}>{result.originalText}</div>
            <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '10px 0' }} />
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4, fontWeight: 500 }}>{translatedLabel}</div>
            <div style={overlayTextStyle}>{result.translatedText}</div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '8px 14px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              {onCopy ? (
                <button
                  type="button"
                  onClick={onCopy}
                  style={{
                    ...baseButtonStyle,
                    color: '#4a90d9',
                  }}
                >
                  {copied ? '已复制' : '复制译文'}
                </button>
              ) : null}
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  style={{
                    ...baseButtonStyle,
                    color: '#4a90d9',
                  }}
                >
                  重试
                </button>
              ) : null}
            </div>
            <span style={{ fontSize: 12, color: '#999' }}>{copied ? '已复制' : '已完成'}</span>
          </div>
        </>
      ) : null}
    </div>
  );
});

export default TranslationOverlayCard;
