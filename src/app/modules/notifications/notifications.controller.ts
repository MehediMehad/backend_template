import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import { NotificationsServices } from './notifications.service';
import catchAsync from '../../helpers/catchAsync';
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

export const NotificationsControllers = {
  sendPushNotification,
};
