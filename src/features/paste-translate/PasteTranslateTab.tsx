import { useCallback, useState } from 'react';
import type { ConfigStatus, TranslateResult } from '@/contracts';
import { MessageType } from '@/contracts';
import StatusMessage from '@/components/StatusMessage';
import TranslationResultCard from '@/components/TranslationResultCard';
import { MAX_TEXT_LENGTH } from '@/constants/limits';
import { sendMessage } from '@/services/messaging';

interface PasteTranslateTabProps {
  configStatus: ConfigStatus | null;
  targetLang: string;
}

export default function PasteTranslateTab({ configStatus, targetLang }: PasteTranslateTabProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isReady = configStatus?.textTranslateReady ?? false;

  const handleTranslate = useCallback(async () => {
    if (!text.trim() || loading) {
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const response = await sendMessage<{ text: string; targetLang: string }, TranslateResult>(
      MessageType.TRANSLATE_PASTE,
      { text: text.trim(), targetLang },
    );

    setLoading(false);

    if (response.success && response.data) {
      setResult(response.data);
      return;
    }

    setError(response.error?.userMessage || '翻译失败，请稍后重试');
  }, [loading, targetLang, text]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleTranslate();
    }
  };

  if (!isReady) {
    return (
      <div className="panel-card empty-card">
        <StatusMessage
          type="warning"
          message="请先完成文本翻译配置，再进行粘贴翻译。"
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
    <div className="tab-panel-content">
      <textarea
        className="translate-textarea"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="粘贴要翻译的内容..."
        maxLength={MAX_TEXT_LENGTH}
      />
      <div className="char-count">{text.length}/{MAX_TEXT_LENGTH}</div>

      <button
        type="button"
        className="btn btn-primary action-button"
        onClick={() => void handleTranslate()}
        disabled={loading || !text.trim()}
      >
        {loading ? '翻译中...' : '翻译'}
      </button>

      {error ? <StatusMessage type="error" message={error} /> : null}
      {result ? <TranslationResultCard result={result} /> : null}
    </div>
  );
}
