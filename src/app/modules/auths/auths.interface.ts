import type { z } from 'zod';

import type { registerSchema } from './auths.validation';

export type TRegisterPayload = z.infer<typeof registerSchema>;
