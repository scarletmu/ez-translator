import { z } from 'zod';
import { providerProfileSchema } from './provider-profile.schema';

export const textTranslateConfigSchema = z.object({
  profile: providerProfileSchema,
});
