import type { ConfigStatus } from '@/contracts';
import { getTextTranslateConfig } from './get-text-translate-config';
import { getScreenshotTranslateConfig } from './get-screenshot-translate-config';

export async function getConfigStatus(): Promise<ConfigStatus> {
  const textConfig = await getTextTranslateConfig();
  const screenshotConfig = await getScreenshotTranslateConfig();

  const textTranslateReady = textConfig !== null;

  let screenshotTranslateReady = false;
  if (screenshotConfig) {
    if (screenshotConfig.mode === 'direct_multimodal') {
      if (screenshotConfig.direct.source === 'reuse_text_translate') {
        screenshotTranslateReady = textTranslateReady;
      } else {
        screenshotTranslateReady = !!screenshotConfig.direct.profile;
      }
    } else {
      const extractReady = !!screenshotConfig.extract.profile;
      const translateReady =
        screenshotConfig.translate.source === 'reuse_text_translate'
          ? textTranslateReady
          : !!screenshotConfig.translate.profile;
      screenshotTranslateReady = extractReady && translateReady;
    }
  }

  return {
    textTranslateReady,
    screenshotTranslateReady,
    screenshotMode: screenshotConfig?.mode,
  };
}
