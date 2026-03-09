import { useState, useEffect, useCallback } from 'react';
import type { TextTranslateConfig, ScreenshotTranslateConfig, ConfigStatus } from '@/contracts';
import { MessageType } from '@/contracts';
import { sendMessage } from '@/services/messaging';

interface StorageConfigState {
  textConfig: TextTranslateConfig | null;
  screenshotConfig: ScreenshotTranslateConfig | null;
  defaultTargetLang: string;
  configStatus: ConfigStatus | null;
  loading: boolean;
}

export function useStorageConfig() {
  const [state, setState] = useState<StorageConfigState>({
    textConfig: null,
    screenshotConfig: null,
    defaultTargetLang: 'zh-CN',
    configStatus: null,
    loading: true,
  });

  const loadConfig = useCallback(async () => {
    try {
      // Load from storage directly (options page has access)
      const { getTextTranslateConfig } = await import('@/services/storage/get-text-translate-config');
      const { getScreenshotTranslateConfig } = await import('@/services/storage/get-screenshot-translate-config');
      const { getDefaultTargetLang } = await import('@/services/storage/get-default-target-lang');

      const [textConfig, screenshotConfig, defaultTargetLang] = await Promise.all([
        getTextTranslateConfig(),
        getScreenshotTranslateConfig(),
        getDefaultTargetLang(),
      ]);

      const statusResponse = await sendMessage<unknown, ConfigStatus>(
        MessageType.GET_PROVIDER_CONFIG_STATUS,
        {},
      );

      setState({
        textConfig,
        screenshotConfig,
        defaultTargetLang,
        configStatus: statusResponse.success ? statusResponse.data! : null,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return { ...state, reload: loadConfig };
}
