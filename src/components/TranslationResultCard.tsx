import { useState, useCallback } from 'react';
import type { TranslateResult } from '@/contracts';

interface TranslationResultCardProps {
  result: TranslateResult;
  originalLabel?: string;
  translatedLabel?: string;
}

export default function TranslationResultCard({
  result,
  originalLabel = '原文',
  translatedLabel = '译文',
}: TranslationResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result.translatedText]);

  return (
    <div className="result-card">
      <div className="result-section">
        <div className="result-label">{originalLabel}</div>
        <div className="result-text">{result.originalText}</div>
      </div>
      <hr className="result-divider" />
      <div className="result-section">
        <div className="result-label">{translatedLabel}</div>
        <div className="result-text">{result.translatedText}</div>
      </div>
      <div className="result-footer">
        <button type="button" className="copy-btn" onClick={handleCopy}>
          {copied ? '已复制' : '复制译文'}
        </button>
        <span className="result-footer-status">{copied ? '复制成功' : '已完成'}</span>
      </div>
    </div>
  );
}
