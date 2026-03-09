import type { ProviderProfile, ProviderValidationResult } from '@/contracts';
import { ErrorCode } from '@/errors';
import { buildImageUserMessage } from './prompt-builders';
import { validateProviderConnection } from './validate-provider-connection';

const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

export async function validateScreenshotExtract(
  profile: ProviderProfile,
): Promise<ProviderValidationResult> {
  return validateProviderConnection(profile, {
    stage: 'screenshot_extract',
    permissionErrorCode: ErrorCode.SCREENSHOT_EXTRACT_PERMISSION_DENIED,
    messages: [
      { role: 'system', content: 'Extract the text in this image.' },
      buildImageUserMessage(TEST_IMAGE_BASE64, 'image/png'),
    ],
  });
}
