import type { TextTranslateConfig, ScreenshotTranslateConfig } from '@/contracts';
import { getOriginFromBaseUrl } from './get-origin-from-base-url';

export function resolveActiveProfileOrigins(
  textConfig: TextTranslateConfig | null,
  screenshotConfig: ScreenshotTranslateConfig | null,
): string[] {
  const origins = new Set<string>();

  if (textConfig) {
    origins.add(getOriginFromBaseUrl(textConfig.profile.baseUrl));
  }

  if (screenshotConfig) {
    if (screenshotConfig.mode === 'direct_multimodal') {
      if (screenshotConfig.direct.source === 'custom_direct_profile' && screenshotConfig.direct.profile) {
        origins.add(getOriginFromBaseUrl(screenshotConfig.direct.profile.baseUrl));
      }
    } else {
      if (screenshotConfig.extract.profile) {
        origins.add(getOriginFromBaseUrl(screenshotConfig.extract.profile.baseUrl));
      }
      if (screenshotConfig.translate.source === 'custom_translate_profile' && screenshotConfig.translate.profile) {
        origins.add(getOriginFromBaseUrl(screenshotConfig.translate.profile.baseUrl));
      }
    }
  }

  return Array.from(origins);
}
