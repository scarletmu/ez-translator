import { z } from 'zod';

export const providerProfileSchema = z.object({
  providerPreset: z.enum([
    'openai',
    'openrouter',
    'deepseek',
    'custom-openai-compatible',
  ]),
  baseUrl: z.string().url('服务地址必须是有效的 URL'),
  apiKey: z.string().min(1, 'API Key 不能为空'),
  model: z.string().min(1, '模型名称不能为空'),
});
