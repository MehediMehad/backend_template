import { UserRoleEnum } from '@prisma/client';
import { Router } from 'express';

import { NotificationsControllers } from './notifications.controller';
import { NotificationsValidations } from './notifications.validation';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

const router = Router();

router.post(
  '/send-notification',
  validateRequest(NotificationsValidations.sendPushNotificationSchema),
  NotificationsControllers.sendPushNotification,
);

router.get(
  '/',
  auth(UserRoleEnum.USER, UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR),
  NotificationsControllers.getUserNotifications,
);

router.patch(
  '/read-all',
  auth(UserRoleEnum.USER, UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR),
  NotificationsControllers.markAllAsRead,
);

router.patch(
  '/:id/read',
  auth(UserRoleEnum.USER, UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR),
  NotificationsControllers.markAsRead,
);

export const NotificationsRoutes = router;
