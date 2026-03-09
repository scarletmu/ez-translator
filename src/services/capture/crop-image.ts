import type { ScreenshotRegion } from '@/contracts';
import { MAX_IMAGE_SIZE_BYTES } from '@/constants/limits';
import { AppError, ErrorCode } from '@/errors';
import { screenshotRegionSchema } from '@/schemas';

export async function cropImage(
  fullDataUrl: string,
  region: ScreenshotRegion,
): Promise<{ base64: string; mimeType: string }> {
  const validation = screenshotRegionSchema.safeParse(region);
  if (!validation.success) {
    throw new AppError(ErrorCode.SCREENSHOT_REGION_INVALID);
  }

  try {
    const dpr = region.devicePixelRatio;
    const sx = Math.round(region.x * dpr);
    const sy = Math.round(region.y * dpr);
    const sw = Math.round(region.width * dpr);
    const sh = Math.round(region.height * dpr);

    const response = await fetch(fullDataUrl);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(sw, sh);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new AppError(ErrorCode.SCREENSHOT_CAPTURE_FAILED);
    }

    ctx.drawImage(imageBitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    imageBitmap.close();

    const outputBlob = await canvas.convertToBlob({ type: 'image/png' });
    if (outputBlob.size > MAX_IMAGE_SIZE_BYTES) {
      throw new AppError(ErrorCode.IMAGE_TOO_LARGE);
    }

    const arrayBuffer = await outputBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';

    for (const value of uint8Array) {
      binary += String.fromCharCode(value);
    }

    return {
      base64: btoa(binary),
      mimeType: 'image/png',
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(ErrorCode.SCREENSHOT_CAPTURE_FAILED);
  }
}
