import { Router } from 'express';

import { AuthsControllers } from './auths.controller';
import { AuthsValidations } from './auths.validation';
import auth from '../../middlewares/auth';
import {
  forgotPasswordLimiter,
  loginLimiter,
  resendOtpLimiter,
} from '../../middlewares/rateLimiter';
import { fileUploader } from '../../middlewares/s3MulterMiddleware';
import validateRequest from '../../middlewares/validateRequest';

const router = Router();

router.post(
  '/register',
  fileUploader.uploadFields, // multipart/form-data → image upload
  validateRequest(AuthsValidations.registerSchema, {
    image: 'single', // field name = 'image', single file
  }),
  AuthsControllers.registerUserIntoDB,
);

router.post(
  '/login',
  loginLimiter,
  validateRequest(AuthsValidations.loginSchema),
  AuthsControllers.loginUserIntoDB,
);

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateRequest(AuthsValidations.forgotPasswordSchema),
  AuthsControllers.forgotPasswordIntoDB,
);

router.post(
  '/reset-password',
  validateRequest(AuthsValidations.resetPasswordSchema),
  AuthsControllers.resetPasswordIntoDB,
);

router.post('/refresh-token', AuthsControllers.refreshTokenIntoDB);

router.get('/me', auth('USER', 'ADMIN', 'MODERATOR'), AuthsControllers.getMyProfile);

router.post(
  '/change-password',
  auth('ADMIN', 'MODERATOR', 'USER'),
  validateRequest(AuthsValidations.changePasswordSchema),
  AuthsControllers.changePasswordIntoDB,
);

router.post(
  '/verify',
  validateRequest(AuthsValidations.verifySchema),
  AuthsControllers.verifyEmailIntoDB,
);

router.post(
  '/resend-otp',
  resendOtpLimiter,
  validateRequest(AuthsValidations.resendOtpSchema),
  AuthsControllers.resendOtpIntoDB,
);

router.post('/logout', auth('ADMIN', 'MODERATOR', 'USER'), AuthsControllers.logoutUser);

export const AuthsRoutes = router;
