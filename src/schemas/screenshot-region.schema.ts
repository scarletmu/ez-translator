import { z } from 'zod';
import { MIN_SCREENSHOT_DIMENSION } from '@/constants/limits';

export const screenshotRegionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(MIN_SCREENSHOT_DIMENSION, `宽度不能小于 ${MIN_SCREENSHOT_DIMENSION}px`),
  height: z.number().min(MIN_SCREENSHOT_DIMENSION, `高度不能小于 ${MIN_SCREENSHOT_DIMENSION}px`),
  viewportWidth: z.number().positive(),
  viewportHeight: z.number().positive(),
  devicePixelRatio: z.number().positive(),
});
