import { Router } from 'express';

import { AuthsControllers } from './auths.controller';
import { AuthsValidations } from './auths.validation';
import auth from '../../middlewares/auth';
import { fileUploader } from '../../middlewares/s3MulterMiddleware';
import validateRequest from '../../middlewares/validateRequest';

const router = Router();

router.post(
  '/register',
  fileUploader.uploadFields,
  validateRequest(AuthsValidations.registerSchema, {
    image: 'single',
  }),
  AuthsControllers.createUserIntoDB,
);

export const AuthsRoutes = router;
