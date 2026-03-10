import type { ProviderProfile } from '@/contracts';

export function buildSafeProfileDebugMeta(profile: ProviderProfile) {
  return {
    providerPreset: profile.providerPreset,
    baseUrl: profile.baseUrl,
    model: profile.model,
  };
}
