import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import { NotificationsServices } from './notifications.service';
import type { TAccessTokenPayload } from '../../helpers/authHelpers';
import catchAsync from '../../helpers/catchAsync';
import pick from '../../helpers/pick';
import sendResponse from '../../utils/sendResponse';

const sendPushNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationsServices.sendPushNotification(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Send Notification Successful',
    data: result,
  });
});

const getUserNotifications = catchAsync(
  async (req: Request & { user?: TAccessTokenPayload }, res: Response) => {
    const userId = req.user!.userId;
    const paginationOptions = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    const result = await NotificationsServices.getUserNotifications(userId, paginationOptions);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Notifications retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  },
);

const markAsRead = catchAsync(
  async (req: Request & { user?: TAccessTokenPayload }, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const result = await NotificationsServices.markAsRead(id, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Notification marked as read successfully',
      data: result,
    });
  },
);

const markAllAsRead = catchAsync(
  async (req: Request & { user?: TAccessTokenPayload }, res: Response) => {
    const userId = req.user!.userId;

    const result = await NotificationsServices.markAllAsRead(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'All notifications marked as read successfully',
      data: result,
    });
  },
);

export const NotificationsControllers = {
  sendPushNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
