import type { ProviderProfile } from '@/contracts';
import { AppError } from '@/errors';
import type { ErrorCode } from '@/errors';
import { hasProfilePermission } from './has-profile-permission';

export async function validatePermissionBeforeRequest(
  profile: ProviderProfile,
  errorCode: ErrorCode,
): Promise<void> {
  const granted = await hasProfilePermission(profile);
  if (!granted) {
    throw new AppError(errorCode);
  }
}
