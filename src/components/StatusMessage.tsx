import type { ReactNode } from 'react';

interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  action?: ReactNode;
}

const ICONS: Record<StatusMessageProps['type'], string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const STYLES: Record<StatusMessageProps['type'], { color: string; background: string; border: string }> = {
  success: {
    color: 'var(--color-success)',
    background: '#f6ffed',
    border: 'rgba(82, 196, 26, 0.18)',
  },
  error: {
    color: 'var(--color-error)',
    background: '#fff2f0',
    border: 'rgba(245, 34, 45, 0.18)',
  },
  warning: {
    color: 'var(--color-warning)',
    background: '#fffbe6',
    border: 'rgba(250, 173, 20, 0.2)',
  },
  info: {
    color: 'var(--color-info)',
    background: '#f0f7ff',
    border: 'rgba(24, 144, 255, 0.16)',
  },
};

export default function StatusMessage({ type, message, action }: StatusMessageProps) {
  const style = STYLES[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-sm)',
        fontSize: 'var(--font-size-sm)',
        color: style.color,
        padding: 'var(--space-sm) var(--space-md)',
        borderRadius: 'var(--radius-md)',
        background: style.background,
        border: `1px solid ${style.border}`,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 }}>
        <span aria-hidden="true" style={{ lineHeight: 1.2 }}>
          {ICONS[type]}
        </span>
        <span>{message}</span>
      </span>
      {action ? <span style={{ flexShrink: 0 }}>{action}</span> : null}
    </div>
  );
}
