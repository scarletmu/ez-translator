import type { ProviderProfile } from './provider-profile';

export type ScreenshotTranslateMode = 'direct_multimodal' | 'extract_then_translate';

export type DirectSource = 'reuse_text_translate' | 'custom_direct_profile';

export type TranslateSource = 'reuse_text_translate' | 'custom_translate_profile';

export interface ScreenshotTranslateConfig {
  mode: ScreenshotTranslateMode;
  direct: {
    source: DirectSource;
    profile?: ProviderProfile;
  };
  extract: {
    profile?: ProviderProfile;
  };
  translate: {
    source: TranslateSource;
    profile?: ProviderProfile;
  };
}
