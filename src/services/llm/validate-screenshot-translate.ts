import type { ProviderProfile, ProviderValidationResult } from '@/contracts';
import { ErrorCode } from '@/errors';
import { validateProviderConnection } from './validate-provider-connection';

export async function validateScreenshotTranslate(
  profile: ProviderProfile,
): Promise<ProviderValidationResult> {
  return validateProviderConnection(profile, {
    stage: 'screenshot_translate',
    permissionErrorCode: ErrorCode.SCREENSHOT_TRANSLATE_PERMISSION_DENIED,
    messages: [
      { role: 'user', content: 'Translate "Sign in to continue" to Chinese. Reply with only the translation.' },
    ],
  });
}
