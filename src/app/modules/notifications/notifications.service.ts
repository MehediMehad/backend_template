import prisma from '../../libs/prisma';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import { fcm } from '../../libs/firebaseAdmin';

interface ISendPushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

const sendPushNotification = async (payload: ISendPushNotificationPayload) => {
  const { userId, title, body, data } = payload;

  // 1. User fetch
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fcmTokens: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.fcmTokens || user.fcmTokens.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User has no FCM tokens');
  }

  // 2. FCM Multicast Message
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

  // 3. Send notification
  const response = await fcm.sendEachForMulticast(message);

  // 4. Remove invalid tokens (production best practice)
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
      where: { id: userId },
      data: {
        fcmTokens: {
          set: user.fcmTokens.filter(
            (token) => !invalidTokens.includes(token),
          ),
        },
      },
    });
  }

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
};

// await NotificationsServices.sendPushNotification({
//   userId,
//   title: 'Purchase Successful 🎉',
//   body: `You purchased "${ebook.name}"`,
//   data: {
//     ebookId: ebook.id,
//   },
// });

export const NotificationsServices = {
  sendPushNotification,
};
