import type { NotificationType } from '@prisma/client';
import httpStatus from 'http-status';

import type {
  ISendNotificationPayload,
  IBroadcastNotificationPayload,
  IFcmTokenPayload,
} from './notification.interface';
import ApiError from '../../errors/ApiError';
import { fcm } from '../../libs/firebaseAdmin';
import prisma from '../../libs/prisma';
import { redis } from '../../libs/redis';

const updateFcmToken = async (userId: string, payload: IFcmTokenPayload) => {
  const { deviceId, fcmToken } = payload;

  const existingDevice = await prisma.device.findUnique({
    where: {
      userId_deviceId: {
        userId,
        deviceId,
      },
    },
  });

  if (!existingDevice) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Device not found for this user');
  }

  const updated = await prisma.device.update({
    where: {
      id: existingDevice.id,
    },
    data: {
      fcmToken,
      isActive: true,
      lastActiveAt: new Date(),
    },
  });

  // Invalidate Redis user devices cache
  await redis.del(`user:devices:${userId}`);

  return updated;
};

const sendPushNotification = async (payload: ISendNotificationPayload) => {
  const {
    receiverId,
    title,
    body,
    data = {},
    isSaveToDb = true,
    notificationType = 'SYSTEM',
  } = payload;

  if (isSaveToDb) {
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title,
        body,
        type: notificationType as NotificationType,
        metadata: data,
      },
    });
  }

  // Get active devices with valid FCM token
  const devices = await prisma.device.findMany({
    where: {
      userId: receiverId,
      isActive: true,
      fcmToken: {
        not: null,
      },
    },
    select: {
      fcmToken: true,
      deviceId: true,
    },
  });

  const tokens = devices.map((d) => d.fcmToken).filter((token): token is string => Boolean(token));

  if (!tokens.length) {
    return { success: true, sentCount: 0, message: 'No active device FCM tokens found' };
  }

  try {
    const response = await fcm.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data,
    });

    // Cleanup invalid tokens
    const invalidTokens: string[] = [];
    response.responses.forEach((res, index) => {
      if (!res.success && res.error) {
        const errorCode = res.error.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await prisma.device.updateMany({
        where: {
          fcmToken: {
            in: invalidTokens,
          },
        },
        data: {
          fcmToken: null,
        },
      });
      await redis.del(`user:devices:${receiverId}`);
    }

    return {
      success: true,
      sentCount: response.successCount,
      failedCount: response.failureCount,
    };
  } catch (error) {
    console.error('❌ FCM Multicast Error:', error);
    return { success: false, error: (error as Error).message };
  }
};

const sendPushNotificationToAllUsers = async (payload: IBroadcastNotificationPayload) => {
  const { title, body, data = {}, isSaveToDb = false } = payload;

  const devices = await prisma.device.findMany({
    where: {
      isActive: true,
      fcmToken: {
        not: null,
      },
    },
    select: {
      fcmToken: true,
      userId: true,
    },
  });

  const tokens = devices.map((d) => d.fcmToken).filter((token): token is string => Boolean(token));

  if (isSaveToDb) {
    const uniqueUserIds = Array.from(new Set(devices.map((d) => d.userId)));
    if (uniqueUserIds.length > 0) {
      await prisma.notification.createMany({
        data: uniqueUserIds.map((userId) => ({
          userId,
          title,
          body,
          metadata: data,
        })),
      });
    }
  }

  if (!tokens.length) {
    return { success: true, sentCount: 0 };
  }

  try {
    const response = await fcm.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((res, index) => {
      if (!res.success && res.error) {
        const errorCode = res.error.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await prisma.device.updateMany({
        where: {
          fcmToken: {
            in: invalidTokens,
          },
        },
        data: {
          fcmToken: null,
        },
      });
    }

    return {
      success: true,
      sentCount: response.successCount,
      failedCount: response.failureCount,
    };
  } catch (error) {
    console.error('❌ Broadcast FCM Error:', error);
    return { success: false, error: (error as Error).message };
  }
};

const getMyNotifications = async (userId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
      unreadCount,
    },
    data: notifications,
  };
};

const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

const markAllAsRead = async (userId: string) =>
  prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

export const NotificationServices = {
  updateFcmToken,
  sendPushNotification,
  sendPushNotificationToAllUsers,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
