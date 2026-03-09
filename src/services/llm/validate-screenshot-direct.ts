import type { ProviderProfile, ProviderValidationResult } from '@/contracts';
import { ErrorCode } from '@/errors';
import { buildImageUserMessage } from './prompt-builders';
import { validateProviderConnection } from './validate-provider-connection';

const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

export async function validateScreenshotDirect(
  profile: ProviderProfile,
): Promise<ProviderValidationResult> {
  return validateProviderConnection(profile, {
    stage: 'screenshot_direct',
    permissionErrorCode: ErrorCode.SCREENSHOT_DIRECT_PERMISSION_DENIED,
    messages: [
      { role: 'system', content: 'Describe what you see in this image briefly.' },
      buildImageUserMessage(TEST_IMAGE_BASE64, 'image/png'),
    ],
  });
}
