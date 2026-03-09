import { z } from 'zod';
import { MAX_TEXT_LENGTH } from '@/constants/limits';

const pageContextSchema = z.object({
  title: z.string(),
  url: z.string(),
});

export const translateTextRequestSchema = z.object({
  text: z.string().min(1, '翻译文本不能为空').max(MAX_TEXT_LENGTH, `文本超过 ${MAX_TEXT_LENGTH} 字符限制`),
  source: z.enum(['selection', 'paste']),
  targetLang: z.string().min(1),
  style: z.literal('bilingual'),
  pageContext: pageContextSchema.optional(),
});

export const translateImageRequestSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().min(1),
  source: z.literal('screenshot'),
  targetLang: z.string().min(1),
  style: z.literal('bilingual'),
  pageContext: pageContextSchema.optional(),
  region: z.lazy(() => screenshotRegionSchema),
});

const screenshotRegionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  viewportWidth: z.number().positive(),
  viewportHeight: z.number().positive(),
  devicePixelRatio: z.number().positive(),
});
