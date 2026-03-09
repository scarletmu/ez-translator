import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TranslationOverlayCard from '@/components/TranslationOverlayCard';
import { ErrorCode } from '@/errors';
import { createTranslateResult } from '@/test/factories';

describe('TranslationOverlayCard', () => {
  it('uses open settings CTA for config errors', () => {
    const openSettings = vi.fn();

    render(
      <TranslationOverlayCard
        title="翻译结果"
        position={{ top: 0, left: 0 }}
        status="error"
        errorCode={ErrorCode.TEXT_TRANSLATE_CONFIG_MISSING}
        errorMessage="请先完成文本翻译配置"
        onClose={vi.fn()}
        onOpenSettings={openSettings}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '打开设置' }));
    expect(openSettings).toHaveBeenCalled();
  });

  it('uses retry CTA for transient errors', () => {
    const retry = vi.fn();

    render(
      <TranslationOverlayCard
        title="翻译结果"
        position={{ top: 0, left: 0 }}
        status="error"
        errorCode={ErrorCode.NETWORK_ERROR}
        errorMessage="网络连接失败，请检查网络设置"
        onClose={vi.fn()}
        onRetry={retry}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(retry).toHaveBeenCalled();
  });

  it('renders bilingual success blocks', () => {
    render(
      <TranslationOverlayCard
        title="截图翻译结果"
        position={{ top: 0, left: 0 }}
        status="success"
        result={createTranslateResult()}
        originalLabel="识别原文"
        translatedLabel="译文"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('识别原文')).toBeInTheDocument();
    expect(screen.getByText('译文')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('你好，世界')).toBeInTheDocument();
  });
});
