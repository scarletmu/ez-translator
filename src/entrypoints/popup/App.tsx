import { useState } from 'react';
import '@/styles/global.css';
import '@/styles/popup.css';
import { DEFAULT_TARGET_LANG } from '@/constants/languages';
import PasteTranslateTab from '@/features/paste-translate/PasteTranslateTab';
import ScreenshotLaunchTab from '@/features/screenshot-translate/ScreenshotLaunchTab';
import { useConfigStatus } from '@/hooks/useConfigStatus';

type Tab = 'text' | 'screenshot';

function getTextStatusLabel(loading: boolean, ready: boolean | undefined): string {
  if (loading) return '加载中';
  return ready ? '已就绪' : '未配置';
}

function getScreenshotStatusLabel(
  loading: boolean,
  ready: boolean | undefined,
  mode: 'direct_multimodal' | 'extract_then_translate' | undefined,
): string {
  if (loading) return '加载中';
  if (ready) {
    return mode === 'extract_then_translate' ? '两阶段已就绪' : '直译可用';
  }
  if (mode === 'extract_then_translate') {
    return '两阶段未完整';
  }
  return '未配置';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('text');
  const { configStatus, loading } = useConfigStatus();

  const textStatusLabel = getTextStatusLabel(loading, configStatus?.textTranslateReady);
  const screenshotStatusLabel = getScreenshotStatusLabel(
    loading,
    configStatus?.screenshotTranslateReady,
    configStatus?.screenshotMode,
  );

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1>Edge 翻译插件</h1>
        <button
          type="button"
          className="settings-link"
          onClick={() => chrome.runtime.openOptionsPage()}
          aria-label="打开设置"
        >
          ⚙
        </button>
      </div>

      <div className="config-badges" aria-live="polite">
        <span className={`config-badge ${loading ? 'loading' : configStatus?.textTranslateReady ? 'ready' : 'not-ready'}`}>
          文本翻译：{textStatusLabel}
        </span>
        <span className={`config-badge ${loading ? 'loading' : configStatus?.screenshotTranslateReady ? 'ready' : 'not-ready'}`}>
          截图翻译：{screenshotStatusLabel}
        </span>
      </div>

      <div className="tab-bar" role="tablist" aria-label="翻译能力切换">
        <button
          id="popup-tab-text"
          type="button"
          role="tab"
          aria-selected={activeTab === 'text'}
          aria-controls="popup-panel-text"
          className={`tab-item ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          文本翻译
        </button>
        <button
          id="popup-tab-screenshot"
          type="button"
          role="tab"
          aria-selected={activeTab === 'screenshot'}
          aria-controls="popup-panel-screenshot"
          className={`tab-item ${activeTab === 'screenshot' ? 'active' : ''}`}
          onClick={() => setActiveTab('screenshot')}
        >
          截图翻译
        </button>
      </div>

      {activeTab === 'text' ? (
        <div id="popup-panel-text" role="tabpanel" aria-labelledby="popup-tab-text">
          <PasteTranslateTab configStatus={configStatus} defaultTargetLang={DEFAULT_TARGET_LANG} />
        </div>
      ) : null}

      {activeTab === 'screenshot' ? (
        <div id="popup-panel-screenshot" role="tabpanel" aria-labelledby="popup-tab-screenshot">
          <ScreenshotLaunchTab configStatus={configStatus} />
        </div>
      ) : null}
    </div>
  );
}
