import { Router } from 'express';

import { NotificationsControllers } from './notifications.controller';
import { NotificationsValidations } from './notifications.validation';
import validateRequest from '../../middlewares/validateRequest';

const router = Router();

router.post(
  '/send-notification',
  validateRequest(NotificationsValidations.sendPushNotificationSchema),
  NotificationsControllers.sendPushNotification,
);

export const NotificationsRoutes = router;
