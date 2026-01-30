import { Router } from "express";
import { NotificationsControllers } from "./notifications.controller";
import validateRequest from "../../middlewares/validateRequest";
import { NotificationsValidations } from "./notifications.validation";

const router = Router();

router.post(
  "/send-notification",
  validateRequest(NotificationsValidations.sendPushNotificationSchema),
  NotificationsControllers.sendPushNotification,
);

export const NotificationsRoutes = router;