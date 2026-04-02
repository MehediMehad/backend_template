import type { z } from 'zod';

import type { createProductSchema } from './product.validation';

export type TCreateProductPayload = z.infer<typeof createProductSchema>;
