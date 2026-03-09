import type { ProviderProfile } from '@/contracts';
import { AppError, ErrorCode } from '@/errors';
import type { PipelineStage } from './resolve-profile-for-stage';

const API_KEY_ERROR_CODES: Record<PipelineStage, ErrorCode> = {
  text: ErrorCode.TEXT_API_KEY_MISSING,
  screenshot_direct: ErrorCode.SCREENSHOT_DIRECT_API_KEY_MISSING,
  screenshot_extract: ErrorCode.SCREENSHOT_EXTRACT_API_KEY_MISSING,
  screenshot_translate: ErrorCode.SCREENSHOT_TRANSLATE_API_KEY_MISSING,
};

const MODEL_ERROR_CODES: Record<PipelineStage, ErrorCode> = {
  text: ErrorCode.TEXT_MODEL_MISSING,
  screenshot_direct: ErrorCode.VISION_MODEL_MISSING,
  screenshot_extract: ErrorCode.VISION_MODEL_MISSING,
  screenshot_translate: ErrorCode.TEXT_MODEL_MISSING,
};

export function assertProviderProfileReady(
  profile: ProviderProfile,
  stage: PipelineStage,
): void {
  if (!profile.baseUrl.trim()) {
    throw new AppError(ErrorCode.INVALID_INPUT);
  }

  if (!profile.apiKey.trim()) {
    throw new AppError(API_KEY_ERROR_CODES[stage]);
  }

  if (!profile.model.trim()) {
    throw new AppError(MODEL_ERROR_CODES[stage]);
  }
}
