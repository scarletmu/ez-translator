import { useCallback, useEffect, useState } from 'react';
import type { ProviderProfile, ScreenshotTranslateConfig } from '@/contracts';
import StatusMessage from '@/components/StatusMessage';
import { ErrorCode, normalizeError } from '@/errors';
import { useStorageConfig } from '@/hooks/useStorageConfig';
import { setDefaultTargetLang } from '@/services/storage/set-default-target-lang';
import { setScreenshotTranslateConfig } from '@/services/storage/set-screenshot-translate-config';
import { setTextTranslateConfig } from '@/services/storage/set-text-translate-config';
import DefaultLanguageSection from './DefaultLanguageSection';
import ScreenshotTranslateSection, { DEFAULT_SCREENSHOT_TRANSLATE_CONFIG } from './ScreenshotTranslateSection';
import StorageInfoSection from './StorageInfoSection';
import TextTranslateSection from './TextTranslateSection';

export default function SettingsPage() {
  const { textConfig, screenshotConfig, defaultTargetLang, loading, reload } = useStorageConfig();

  const [textProfile, setTextProfile] = useState<ProviderProfile | null>(null);
  const [screenshotCfg, setScreenshotCfg] = useState<ScreenshotTranslateConfig>(DEFAULT_SCREENSHOT_TRANSLATE_CONFIG);
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const effectiveTargetLang = targetLang ?? defaultTargetLang;

  useEffect(() => {
    setScreenshotCfg(screenshotConfig ?? DEFAULT_SCREENSHOT_TRANSLATE_CONFIG);
  }, [screenshotConfig]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const profileToSave = textProfile ?? textConfig?.profile;
      if (profileToSave) {
        await setTextTranslateConfig({ profile: profileToSave });
      }

      await setScreenshotTranslateConfig(screenshotCfg);

      await setDefaultTargetLang(effectiveTargetLang);

      setSaveMessage({ type: 'success', message: '设置已保存，新的配置已写入本地扩展存储。' });
      await reload();
    } catch (error) {
      const appError = normalizeError(error);
      setSaveMessage({
        type: 'error',
        message: appError.code === ErrorCode.INVALID_INPUT ? '保存失败，请先检查当前配置项是否填写完整。' : appError.userMessage,
      });
    } finally {
      setSaving(false);
    }
  }, [effectiveTargetLang, reload, screenshotCfg, textConfig, textProfile]);

  if (loading) {
    return (
      <div className="options-page">
        <h1>设置</h1>
        <StatusMessage type="info" message="正在加载本地配置..." />
      </div>
    );
  }

  return (
    <div className="options-page">
      <h1>设置</h1>

      <TextTranslateSection initialProfile={textConfig?.profile ?? null} onChange={setTextProfile} />

      <ScreenshotTranslateSection initialConfig={screenshotCfg} onChange={setScreenshotCfg} />

      <DefaultLanguageSection value={effectiveTargetLang} onChange={setTargetLang} />

      <StorageInfoSection onCleared={reload} />

      <div className="form-actions form-actions-sticky">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存设置'}
        </button>
        {saveMessage ? <StatusMessage type={saveMessage.type} message={saveMessage.message} /> : null}
      </div>
    </div>
  );
}
