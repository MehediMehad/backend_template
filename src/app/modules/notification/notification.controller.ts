import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import { NotificationServices } from './notification.service';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../utils/sendResponse';

const saveFcmToken = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const result = await NotificationServices.updateFcmToken(userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'FCM Token updated successfully',
    data: result,
  });
});

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await NotificationServices.getMyNotifications(userId, page, limit);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const markNotificationAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const result = await NotificationServices.markAsRead(userId, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification marked as read',
    data: result,
  });
});

const markAllNotificationsAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  const result = await NotificationServices.markAllAsRead(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All notifications marked as read',
    data: result,
  });
});

export const NotificationControllers = {
  saveFcmToken,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
