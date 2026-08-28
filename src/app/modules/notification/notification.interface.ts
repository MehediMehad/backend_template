import type { NotificationType } from '@prisma/client';

export interface ISendNotificationPayload {
  receiverId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  isSaveToDb?: boolean;
  notificationType?: NotificationType;
}

export interface IBroadcastNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  isSaveToDb?: boolean;
}

export interface IFcmTokenPayload {
  deviceId: string;
  fcmToken: string;
}
