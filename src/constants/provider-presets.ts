export const PROVIDER_PRESETS = {
  openai: {
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
  },
  openrouter: {
    label: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
  },
  deepseek: {
    label: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
  },
  'custom-openai-compatible': {
    label: '自定义 OpenAI 兼容',
    defaultBaseUrl: '',
  },
} as const;

export type ProviderPreset = keyof typeof PROVIDER_PRESETS;

export const PROVIDER_PRESET_OPTIONS = Object.entries(PROVIDER_PRESETS).map(
  ([key, value]) => ({
    value: key as ProviderPreset,
    label: value.label,
  }),
);
