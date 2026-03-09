import { describe, expect, it } from 'vitest';
import { STORAGE_KEY_DEFAULT_TARGET_LANG, STORAGE_KEY_SCREENSHOT_TRANSLATE, STORAGE_KEY_TEXT_TRANSLATE } from '@/constants/storage-keys';
import { clearAllProviderConfigs } from '@/services/storage/clear-all-provider-configs';
import { getConfigStatus } from '@/services/storage/get-config-status';
import { getScreenshotTranslateConfig } from '@/services/storage/get-screenshot-translate-config';
import { getTextTranslateConfig } from '@/services/storage/get-text-translate-config';
import { setScreenshotTranslateConfig } from '@/services/storage/set-screenshot-translate-config';
import { setTextTranslateConfig } from '@/services/storage/set-text-translate-config';
import { createDirectScreenshotConfig, createExtractScreenshotConfig, createTextConfig } from '@/test/factories';

describe('storage services', () => {
  it('sets and gets text translate config', async () => {
    const textConfig = createTextConfig();

    await setTextTranslateConfig(textConfig);

    await expect(getTextTranslateConfig()).resolves.toEqual(textConfig);
  });

  it('sets and gets screenshot translate config', async () => {
    const screenshotConfig = createDirectScreenshotConfig();

    await setScreenshotTranslateConfig(screenshotConfig);

    await expect(getScreenshotTranslateConfig()).resolves.toEqual(screenshotConfig);
  });

  it('clears all provider configs and target language', async () => {
    await chrome.storage.local.set({
      [STORAGE_KEY_TEXT_TRANSLATE]: createTextConfig(),
      [STORAGE_KEY_SCREENSHOT_TRANSLATE]: createDirectScreenshotConfig(),
      [STORAGE_KEY_DEFAULT_TARGET_LANG]: 'ja',
    });

    await clearAllProviderConfigs();
    const result = await chrome.storage.local.get([
      STORAGE_KEY_TEXT_TRANSLATE,
      STORAGE_KEY_SCREENSHOT_TRANSLATE,
      STORAGE_KEY_DEFAULT_TARGET_LANG,
    ]);

    expect(result[STORAGE_KEY_TEXT_TRANSLATE]).toBeUndefined();
    expect(result[STORAGE_KEY_SCREENSHOT_TRANSLATE]).toBeUndefined();
    expect(result[STORAGE_KEY_DEFAULT_TARGET_LANG]).toBeUndefined();
  });

  it('returns config status for text configured only', async () => {
    await setTextTranslateConfig(createTextConfig());

    await expect(getConfigStatus()).resolves.toEqual({
      textTranslateReady: true,
      screenshotTranslateReady: false,
      screenshotMode: undefined,
    });
  });

  it('returns ready when direct screenshot reuses text config', async () => {
    await setTextTranslateConfig(createTextConfig());
    await setScreenshotTranslateConfig(createDirectScreenshotConfig({
      direct: { source: 'reuse_text_translate' },
    }));

    await expect(getConfigStatus()).resolves.toEqual({
      textTranslateReady: true,
      screenshotTranslateReady: true,
      screenshotMode: 'direct_multimodal',
    });
  });

  it('returns ready when direct screenshot has custom profile', async () => {
    await setScreenshotTranslateConfig(createDirectScreenshotConfig());

    await expect(getConfigStatus()).resolves.toEqual({
      textTranslateReady: false,
      screenshotTranslateReady: true,
      screenshotMode: 'direct_multimodal',
    });
  });

  it('returns not ready when extract is configured but translate stage is missing', async () => {
    await chrome.storage.local.set({
      [STORAGE_KEY_SCREENSHOT_TRANSLATE]: {
        ...createExtractScreenshotConfig(),
        translate: { source: 'custom_translate_profile', profile: undefined },
      },
    });

    await expect(getConfigStatus()).resolves.toEqual({
      textTranslateReady: false,
      screenshotTranslateReady: false,
      screenshotMode: undefined,
    });
  });

  it('returns ready when extract and translate stages are both configured', async () => {
    await setTextTranslateConfig(createTextConfig());
    await setScreenshotTranslateConfig(createExtractScreenshotConfig());

    await expect(getConfigStatus()).resolves.toEqual({
      textTranslateReady: true,
      screenshotTranslateReady: true,
      screenshotMode: 'extract_then_translate',
    });
  });
});
