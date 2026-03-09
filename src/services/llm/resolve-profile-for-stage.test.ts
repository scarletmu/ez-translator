import { describe, expect, it } from 'vitest';
import { ErrorCode } from '@/errors';
import { resolveProfileForStage } from '@/services/llm/resolve-profile-for-stage';
import { createDirectScreenshotConfig, createExtractScreenshotConfig, createTextConfig } from '@/test/factories';

describe('resolveProfileForStage', () => {
  it('reuses text config when configured to do so', () => {
    const textConfig = createTextConfig();
    const screenshotConfig = createDirectScreenshotConfig({ direct: { source: 'reuse_text_translate' } });

    expect(resolveProfileForStage('screenshot_direct', textConfig, screenshotConfig)).toEqual(textConfig.profile);
  });

  it('returns custom stage profile when present', () => {
    const screenshotConfig = createExtractScreenshotConfig();

    expect(resolveProfileForStage('screenshot_extract', null, screenshotConfig)).toEqual(screenshotConfig.extract.profile);
    expect(resolveProfileForStage('screenshot_translate', null, screenshotConfig)).toEqual(screenshotConfig.translate.profile);
  });

  it('throws stage-specific config missing errors', () => {
    expect(() => resolveProfileForStage('text', null, null)).toThrowError(
      expect.objectContaining({ code: ErrorCode.TEXT_TRANSLATE_CONFIG_MISSING }),
    );
    expect(() => resolveProfileForStage('screenshot_extract', null, createDirectScreenshotConfig())).toThrowError(
      expect.objectContaining({ code: ErrorCode.SCREENSHOT_EXTRACT_CONFIG_MISSING }),
    );
    expect(() => resolveProfileForStage('screenshot_translate', null, createExtractScreenshotConfig({ translate: { source: 'custom_translate_profile', profile: undefined } }))).toThrowError(
      expect.objectContaining({ code: ErrorCode.SCREENSHOT_TRANSLATE_CONFIG_MISSING }),
    );
  });
});
