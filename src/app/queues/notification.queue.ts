import type { NotificationType } from '@prisma/client';
import { Queue } from 'bullmq';

import { queueConnection } from '../libs/queueConnection';

export interface INotificationJobData {
  type: 'SINGLE' | 'BROADCAST';
  isSaveToDb?: boolean;
  receiverId?: string; // Required for 'SINGLE' type
  title: string;
  body: string;
  data?: Record<string, string>;
  notificationType?: NotificationType;
}

export const notificationQueueName = 'NotificationQueue';

export const notificationQueue = new Queue<INotificationJobData>(notificationQueueName, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3, // Auto-retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5 seconds before retrying
    },
    removeOnComplete: true, // Clean up successful jobs
    removeOnFail: 1000, // Keep last 1000 failed jobs for debugging
  },
});

export const queueNotification = async (data: INotificationJobData) => {
  await notificationQueue.add(`send-notification-${data.type}-${Date.now()}`, data);
};
