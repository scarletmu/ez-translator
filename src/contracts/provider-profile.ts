import type { ProviderPreset } from '@/constants/provider-presets';

export interface ProviderProfile {
  providerPreset: ProviderPreset;
  baseUrl: string;
  apiKey: string;
  model: string;
}
