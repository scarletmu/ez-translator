import type {
  TranslateResult,
  TextTranslateConfig,
  ScreenshotTranslateConfig,
} from '@/contracts';
import { AppError, ErrorCode } from '@/errors';
import { resolveProfileForStage } from './resolve-profile-for-stage';
import { translateScreenshotDirect } from './screenshot-direct-client';
import { extractScreenshotText } from './screenshot-extract-client';
import { translateExtractedText } from './screenshot-translate-client';

export async function executeScreenshotPipeline(
  imageBase64: string,
  mimeType: string,
  targetLang: string,
  textConfig: TextTranslateConfig | null,
  screenshotConfig: ScreenshotTranslateConfig | null,
): Promise<TranslateResult> {
  if (!screenshotConfig) {
    throw new AppError(ErrorCode.SCREENSHOT_DIRECT_CONFIG_MISSING);
  }

  if (screenshotConfig.mode === 'direct_multimodal') {
    const profile = resolveProfileForStage('screenshot_direct', textConfig, screenshotConfig);
    return translateScreenshotDirect(imageBase64, mimeType, targetLang, profile);
  }

  // extract_then_translate mode
  const extractProfile = resolveProfileForStage('screenshot_extract', textConfig, screenshotConfig);
  const extractedText = await extractScreenshotText(imageBase64, mimeType, extractProfile);

  const translateProfile = resolveProfileForStage('screenshot_translate', textConfig, screenshotConfig);
  const result = await translateExtractedText(extractedText, targetLang, translateProfile);

  // Override originalText with the extracted text from the image
  return {
    ...result,
    originalText: extractedText,
  };
}
