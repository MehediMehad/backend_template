import type { z } from 'zod';

import type {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
  verifySchema,
} from './auths.validation';

export type TRegisterPayload = z.infer<typeof registerSchema>;
export type TLoginPayload = z.infer<typeof loginSchema>;
export type TForgotPasswordPayload = z.infer<typeof forgotPasswordSchema>;
export type TResetPasswordPayload = z.infer<typeof resetPasswordSchema>;
export type TChangePasswordPayload = z.infer<typeof changePasswordSchema>;
export type TRefreshTokenPayload = z.infer<typeof refreshTokenSchema>;
export type TVerifyPayload = z.infer<typeof verifySchema>;

// export interface TChangePasswordPayload {
//     oldPassword: string;
//     newPassword: string;
// }

// export interface TForgotPasswordPayload {
//     email: string;
// }

// export interface TResetPasswordPayload {
//     token: string;        // OTP code
//     newPassword: string;
// }

// export interface TRefreshTokenPayload {
//     refreshToken: string;
// }
