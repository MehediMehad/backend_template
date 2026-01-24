import { UserRoleEnum } from '@prisma/client';
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(32, 'Password must be less than 32 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[@$!%*?&#]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  image: z.url('Image must be a valid URL'),
  email: z.email('Invalid email address').trim().toLowerCase(),
  phone: z
    .string()
    .regex(/^(?:\+8801|01)[3-9]\d{8}$/, 'Phone number must be a valid Bangladeshi number'),
  password: passwordSchema,
  role: z.nativeEnum(UserRoleEnum),
  fcmToken: z.string().optional(),
});

export const AuthsValidations = {
  registerSchema,
};
