import type { ProviderProfile } from '@/contracts';
import { getOriginFromBaseUrl } from './get-origin-from-base-url';

export async function requestProfilePermission(profile: ProviderProfile): Promise<boolean> {
  const origin = getOriginFromBaseUrl(profile.baseUrl);
  return chrome.permissions.request({ origins: [origin] });
}
