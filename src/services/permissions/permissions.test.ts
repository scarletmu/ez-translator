import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { AppError, ErrorCode } from '@/errors';
import { getOriginFromBaseUrl } from '@/services/permissions/get-origin-from-base-url';
import { hasProfilePermission } from '@/services/permissions/has-profile-permission';
import { resolveActiveProfileOrigins } from '@/services/permissions/resolve-active-profile-origins';
import { validatePermissionBeforeRequest } from '@/services/permissions/validate-permission-before-request';
import { createDirectScreenshotConfig, createExtractScreenshotConfig, createProviderProfile, createTextConfig } from '@/test/factories';

describe('permission services', () => {
  it('derives origin from base url', () => {
    expect(getOriginFromBaseUrl('https://api.openai.com/v1/chat/completions')).toBe('https://api.openai.com/*');
  });

  it('maps invalid base url to invalid input', () => {
    expect(() => getOriginFromBaseUrl('not-a-url')).toThrowError(new AppError(ErrorCode.INVALID_INPUT));
  });

  it('checks profile permission by origin', async () => {
    const containsMock = chrome.permissions.contains as unknown as Mock;
    containsMock.mockResolvedValueOnce(true);

    await expect(hasProfilePermission(createProviderProfile())).resolves.toBe(true);
    expect(chrome.permissions.contains).toHaveBeenCalledWith({ origins: ['https://api.openai.com/*'] });
  });

  it('throws configured error when permission is missing', async () => {
    const containsMock = chrome.permissions.contains as unknown as Mock;
    containsMock.mockResolvedValueOnce(false);

    await expect(
      validatePermissionBeforeRequest(createProviderProfile(), ErrorCode.TEXT_TRANSLATE_PERMISSION_DENIED),
    ).rejects.toMatchObject({ code: ErrorCode.TEXT_TRANSLATE_PERMISSION_DENIED });
  });

  it('resolves active profile origins without duplicates', () => {
    const textConfig = createTextConfig();
    const screenshotConfig = createExtractScreenshotConfig({
      translate: {
        source: 'custom_translate_profile',
        profile: createProviderProfile({ baseUrl: 'https://api.openai.com/v1' }),
      },
    });

    expect(resolveActiveProfileOrigins(textConfig, screenshotConfig)).toEqual([
      'https://api.openai.com/*',
      'https://vision.example.com/*',
    ]);
  });

  it('skips extra origin when direct mode reuses text config', () => {
    expect(
      resolveActiveProfileOrigins(createTextConfig(), createDirectScreenshotConfig({ direct: { source: 'reuse_text_translate' } })),
    ).toEqual(['https://api.openai.com/*']);
  });
});
