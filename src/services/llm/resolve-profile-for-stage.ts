import type {
  ProviderProfile,
  TextTranslateConfig,
  ScreenshotTranslateConfig,
} from '@/contracts';
import { AppError, ErrorCode } from '@/errors';

export type PipelineStage =
  | 'text'
  | 'screenshot_direct'
  | 'screenshot_extract'
  | 'screenshot_translate';

export function resolveProfileForStage(
  stage: PipelineStage,
  textConfig: TextTranslateConfig | null,
  screenshotConfig: ScreenshotTranslateConfig | null,
): ProviderProfile {
  if (stage === 'text') {
    if (!textConfig) throw new AppError(ErrorCode.TEXT_TRANSLATE_CONFIG_MISSING);
    return textConfig.profile;
  }

  if (!screenshotConfig) {
    throw new AppError(ErrorCode.SCREENSHOT_DIRECT_CONFIG_MISSING);
  }

  if (stage === 'screenshot_direct') {
    if (screenshotConfig.direct.source === 'reuse_text_translate') {
      if (!textConfig) throw new AppError(ErrorCode.TEXT_TRANSLATE_CONFIG_MISSING);
      return textConfig.profile;
    }
    if (!screenshotConfig.direct.profile) {
      throw new AppError(ErrorCode.SCREENSHOT_DIRECT_CONFIG_MISSING);
    }
    return screenshotConfig.direct.profile;
  }

  if (stage === 'screenshot_extract') {
    if (!screenshotConfig.extract.profile) {
      throw new AppError(ErrorCode.SCREENSHOT_EXTRACT_CONFIG_MISSING);
    }
    return screenshotConfig.extract.profile;
  }

  if (stage === 'screenshot_translate') {
    if (screenshotConfig.translate.source === 'reuse_text_translate') {
      if (!textConfig) throw new AppError(ErrorCode.TEXT_TRANSLATE_CONFIG_MISSING);
      return textConfig.profile;
    }
    if (!screenshotConfig.translate.profile) {
      throw new AppError(ErrorCode.SCREENSHOT_TRANSLATE_CONFIG_MISSING);
    }
    return screenshotConfig.translate.profile;
  }

  throw new AppError(ErrorCode.INVALID_INPUT, `Unknown stage: ${stage}`);
}
