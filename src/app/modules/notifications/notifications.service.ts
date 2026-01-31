import httpStatus from 'http-status';

import ApiError from '../../errors/ApiError';
import { fcm } from '../../libs/firebaseAdmin';
import prisma from '../../libs/prisma';

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
          set: user.fcmTokens.filter((token) => !invalidTokens.includes(token)),
        },
      },
    });
  }

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
};

// Example Use Case
// await NotificationsServices.sendPushNotification({
//   userId,
//   title: 'Purchase Successful 🎉',
//   body: `You purchased "${ebook.name}"`,
//   data: {
//     ebookId: ebook.id,
//   },
// });

interface ISendPushNotificationToAllUsersPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}
const sendPushNotificationToAllUsers = async (payload: ISendPushNotificationToAllUsersPayload) => {
  const { title, body, data } = payload;

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

  if (allTokens.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No FCM tokens found for any user');
  }

  // 2. Firebase allows max 500 tokens per multicast
  const CHUNK_SIZE = 500;
  const tokenChunks: string[][] = [];

  for (let i = 0; i < allTokens.length; i += CHUNK_SIZE) {
    tokenChunks.push(allTokens.slice(i, i + CHUNK_SIZE));
  }

  let successCount = 0;
  let failureCount = 0;

  const invalidTokens = new Set<string>();

  // 3. Send notifications chunk by chunk
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

    // 4. Collect invalid tokens
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

  // 5. Remove invalid tokens from DB (best practice)
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

  return {
    successCount,
    failureCount,
  };
};

// Example Use Case
// await NotificationsServices.sendPushNotificationToAllUsers({
//   title: 'Happy New Year 🎉',
//   body: `Wishing you a happy new year!`,
//   data: {
//     year: new Date().getFullYear(),
//   },
// });

export const NotificationsServices = {
  sendPushNotification,
  sendPushNotificationToAllUsers,
};
