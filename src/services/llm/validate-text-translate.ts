import type { ProviderProfile, ProviderValidationResult } from '@/contracts';
import { ErrorCode } from '@/errors';
import { validateProviderConnection } from './validate-provider-connection';

export async function validateTextTranslate(
  profile: ProviderProfile,
): Promise<ProviderValidationResult> {
  return validateProviderConnection(profile, {
    stage: 'text',
    permissionErrorCode: ErrorCode.TEXT_TRANSLATE_PERMISSION_DENIED,
    messages: [
      { role: 'user', content: 'Translate "hello" to Chinese. Reply with only the translation.' },
    ],
  });
}
