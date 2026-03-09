import { z } from 'zod';
import { providerProfileSchema } from './provider-profile.schema';

export const screenshotTranslateConfigSchema = z.object({
  mode: z.enum(['direct_multimodal', 'extract_then_translate']),
  direct: z.object({
    source: z.enum(['reuse_text_translate', 'custom_direct_profile']),
    profile: providerProfileSchema.optional(),
  }),
  extract: z.object({
    profile: providerProfileSchema.optional(),
  }),
  translate: z.object({
    source: z.enum(['reuse_text_translate', 'custom_translate_profile']),
    profile: providerProfileSchema.optional(),
  }),
}).refine(
  (data) => {
    if (data.mode === 'direct_multimodal') {
      if (data.direct.source === 'custom_direct_profile' && !data.direct.profile) {
        return false;
      }
    }
    if (data.mode === 'extract_then_translate') {
      if (!data.extract.profile) {
        return false;
      }
      if (data.translate.source === 'custom_translate_profile' && !data.translate.profile) {
        return false;
      }
    }
    return true;
  },
  { message: '截图翻译配置不完整：自定义配置或提取阶段缺少必要的 profile' },
);
