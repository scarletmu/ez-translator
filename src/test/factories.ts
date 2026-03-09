import type {
  ProviderProfile,
  ScreenshotTranslateConfig,
  TextTranslateConfig,
  TranslateResult,
} from '@/contracts';

export function createProviderProfile(overrides: Partial<ProviderProfile> = {}): ProviderProfile {
  return {
    providerPreset: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-test',
    model: 'gpt-4.1-mini',
    ...overrides,
  };
}

export function createTextConfig(overrides: Partial<TextTranslateConfig> = {}): TextTranslateConfig {
  return {
    profile: createProviderProfile(),
    ...overrides,
  };
}

export function createDirectScreenshotConfig(
  overrides: Partial<ScreenshotTranslateConfig> = {},
): ScreenshotTranslateConfig {
  return {
    mode: 'direct_multimodal',
    direct: {
      source: 'custom_direct_profile',
      profile: createProviderProfile({ model: 'gpt-4.1' }),
    },
    extract: {},
    translate: { source: 'reuse_text_translate' },
    ...overrides,
  };
}

export function createExtractScreenshotConfig(
  overrides: Partial<ScreenshotTranslateConfig> = {},
): ScreenshotTranslateConfig {
  return {
    mode: 'extract_then_translate',
    direct: { source: 'reuse_text_translate' },
    extract: {
      profile: createProviderProfile({ baseUrl: 'https://vision.example.com/v1', model: 'gpt-4.1' }),
    },
    translate: {
      source: 'custom_translate_profile',
      profile: createProviderProfile({ baseUrl: 'https://text.example.com/v1', model: 'gpt-4.1-mini' }),
    },
    ...overrides,
  };
}

export function createTranslateResult(overrides: Partial<TranslateResult> = {}): TranslateResult {
  return {
    originalText: 'Hello world',
    translatedText: '你好，世界',
    targetLang: 'zh-CN',
    model: 'gpt-4.1-mini',
    provider: 'openai',
    requestId: 'req_123',
    ...overrides,
  };
}
