import { NotificationTypeEnum } from '@prisma/client';
import httpStatus from 'http-status';

import ApiError from '../../errors/ApiError';
import { paginationHelper } from '../../helpers/paginationHelper';
import { fcm } from '../../libs/firebaseAdmin';
import prisma from '../../libs/prisma';

interface ISendPushNotificationPayload {
  isSaveToDb?: boolean;
  receiverId?: string;
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

const sendPushNotification = async (payload: ISendPushNotificationPayload) => {
  const { isSaveToDb = true, title, body, data } = payload;
  const receiverId = payload.receiverId || payload.userId;

  if (!receiverId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'receiverId or userId is required');
  }

  // 1. User fetch
  const user = await prisma.user.findUnique({
    where: { id: receiverId },
    select: {
      id: true,
      fcmTokens: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  let successCount = 0;
  let failureCount = 0;

  // 2. FCM Multicast Message (if user has FCM tokens)
  if (user.fcmTokens && user.fcmTokens.length > 0) {
    const message = {
      tokens: user.fcmTokens,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high' as const,
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    };

    // Send notification
    const response = await fcm.sendEachForMulticast(message);
    successCount = response.successCount;
    failureCount = response.failureCount;

    // Remove invalid tokens (production best practice)
    const invalidTokens: string[] = [];
    response.responses.forEach((res, index) => {
      if (!res.success) {
        const errorCode = res.error?.code;
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(user.fcmTokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await prisma.user.update({
        where: { id: receiverId },
        data: {
          fcmTokens: {
            set: user.fcmTokens.filter((token) => !invalidTokens.includes(token)),
          },
        },
      });
    }
  }

  // 3. Save notification to DB (if enabled)
  let savedNotification = null;
  if (isSaveToDb) {
    savedNotification = await prisma.notification.create({
      data: {
        receiverId,
        title,
        body,
        data: data ?? undefined,
        type: NotificationTypeEnum.NOTIFY,
        // senderId: null → system notification
      },
    });
  }

  // 4. Emit real-time notification via Socket.IO
  const io = global.io;
  if (io) {
    io.to(`user:${receiverId}`).emit('notification', {
      id: savedNotification?.id,
      title,
      body,
      data: data ?? {},
      type: NotificationTypeEnum.NOTIFY,
      createdAt: savedNotification?.createdAt || new Date().toISOString(),
    });
    console.log(`📡 Emitted real-time notification to user:${receiverId}`);
  } else {
    console.warn('⚠️ Socket.io not initialized, skipping real-time emit');
  }

  return {
    successCount,
    failureCount,
    notification: savedNotification,
  };
};

interface ISendPushNotificationToAllUsersPayload {
  isSaveToDb?: boolean;
  title: string;
  body: string;
  data?: Record<string, string>;
}

const sendPushNotificationToAllUsers = async (payload: ISendPushNotificationToAllUsersPayload) => {
  const { isSaveToDb = true, title, body, data } = payload;

  // 1. Fetch all users' tokens
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fcmTokens: true,
    },
  });

  const userTokenMap = users
    .filter((u) => u.fcmTokens && u.fcmTokens.length > 0)
    .map((u) => ({
      userId: u.id,
      tokens: u.fcmTokens,
    }));

  const allTokens = userTokenMap.flatMap((u) => u.tokens);

  let successCount = 0;
  let failureCount = 0;

  // 2. Multicast FCM if any tokens exist
  if (allTokens.length > 0) {
    const CHUNK_SIZE = 500;
    const tokenChunks: string[][] = [];

    for (let i = 0; i < allTokens.length; i += CHUNK_SIZE) {
      tokenChunks.push(allTokens.slice(i, i + CHUNK_SIZE));
    }

    const invalidTokens = new Set<string>();

    for (const tokens of tokenChunks) {
      const message = {
        tokens,
        notification: {
          title,
          body,
        },
        data,
        android: {
          priority: 'high' as const,
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
        },
      };

      const response = await fcm.sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((res, index) => {
        if (!res.success) {
          const errorCode = res.error?.code;
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            invalidTokens.add(tokens[index]);
          }
        }
      });
    }

    if (invalidTokens.size > 0) {
      for (const user of userTokenMap) {
        const cleanedTokens = user.tokens.filter((token) => !invalidTokens.has(token));

        if (cleanedTokens.length !== user.tokens.length) {
          await prisma.user.update({
            where: { id: user.userId },
            data: {
              fcmTokens: {
                set: cleanedTokens,
              },
            },
          });
        }
      }
    }
  }

  // 3. Save notifications to DB if enabled
  if (isSaveToDb) {
    const notificationsToCreate = users.map((user) => ({
      receiverId: user.id,
      title,
      body,
      data: data ?? undefined,
      type: NotificationTypeEnum.NOTIFY,
      // senderId: null
    }));

    await prisma.notification.createMany({
      data: notificationsToCreate,
    });
  }

  // 4. Emit real-time notification to all connected clients
  const io = global.io;
  if (io) {
    io.emit('notification', {
      title,
      body,
      data: data ?? {},
      type: NotificationTypeEnum.NOTIFY,
      createdAt: new Date().toISOString(),
    });
    console.log('📡 Broadcasted real-time notification to all users');
  } else {
    console.warn('⚠️ Socket.io not initialized, skipping real-time emit');
  }

  return {
    successCount,
    failureCount,
  };
};

/**
 * Get notifications for a user with pagination
 */
const getUserNotifications = async (
  userId: string,
  options: { page?: number; limit?: number; sortBy?: string; sortOrder?: string },
) => {
  const { limit, page, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const whereConditions = {
    receiverId: userId,
  };

  const resultData = await prisma.notification.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.notification.count({
    where: whereConditions,
  });

  const unreadCount = await prisma.notification.count({
    where: { receiverId: userId, isRead: false },
  });

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      unreadCount,
      notifications: resultData,
    },
  };
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (notificationId: string, userId: string) => {
  const result = await prisma.notification.update({
    where: {
      id: notificationId,
      receiverId: userId, // Ensure user owns this notification
    },
    data: {
      isRead: true,
    },
  });

  return result;
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: {
      receiverId: userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result;
};

export const NotificationsServices = {
  sendPushNotification,
  sendPushNotificationToAllUsers,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
