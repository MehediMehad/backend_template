import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import { AuthsServices } from './auths.service';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../utils/sendResponse';

const createUserIntoDB = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  const result = await AuthsServices.createUserIntoDB(body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Auths created successfully',
    data: result,
  });
});

export const AuthsControllers = {
  createUserIntoDB,
};
