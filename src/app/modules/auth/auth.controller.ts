import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import { AuthServices } from './auth.service';
import ApiError from '../../errors/ApiError';
import catchAsync from '../../helpers/catchAsync';
import { extractDeviceInfo } from '../../utils/device';
import sendResponse from '../../utils/sendResponse';

const registerUserIntoDB = catchAsync(async (req: Request, res: Response) => {
  const deviceInfo = extractDeviceInfo(req);
  const result = await AuthServices.registerUser(req.body, deviceInfo);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const loginUserIntoDB = catchAsync(async (req: Request, res: Response) => {
  const deviceInfo = extractDeviceInfo(req);
  const result = await AuthServices.loginUser(req.body, deviceInfo);

  if ('code' in result && result.code === 'DEVICE_LIMIT_REACHED') {
    sendResponse(res, {
      statusCode: httpStatus.CONFLICT,
      success: false,
      message: result.message,
      data: {
        code: result.code,
        pendingToken: result.pendingToken,
        devices: result.devices,
      },
    });
    return;
  }

  if (result.tokens?.refreshToken) {
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Login successful',
    data: result,
  });
});

const confirmPendingLogin = catchAsync(async (req: Request, res: Response) => {
  const deviceInfo = extractDeviceInfo(req);
  const result = await AuthServices.confirmPendingLogin(req.body, deviceInfo);

  if (result.tokens?.refreshToken) {
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Device replaced and login successful',
    data: result,
  });
});

const getUserDevices = catchAsync(async (req: Request, res: Response) => {
  const currentDeviceId =
    req.user.deviceId || (req.headers['x-device-id'] as string) || (req.query.deviceId as string);
  const result = await AuthServices.getUserDevices(req.user.userId, currentDeviceId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Devices retrieved successfully',
    data: result,
  });
});

const logoutDevice = catchAsync(async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const result = await AuthServices.logoutDevice(req.user.userId, deviceId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
  }

  const result = await AuthServices.logout(
    token,
    req.user?.userId,
    req.user?.deviceId || (req.headers['x-device-id'] as string),
  );

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
  });
});

const logoutAllDevices = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
  }

  const result = await AuthServices.logoutAll(req.user.userId, token);

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
  });
});

const verifyEmailIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.verifyEmail(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || 'Email verified successfully',
    data: result.result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.getMe(req.user.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const forgotPasswordIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.forgotPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || 'Password reset email sent successfully',
  });
});

const resetPasswordIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.resetPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || 'Password reset successful',
  });
});

const changePasswordIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.changePassword(req.user.userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || 'Password changed successfully',
  });
});

const refreshTokenIntoDB = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'No refresh token provided');
  }

  const result = await AuthServices.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Token refreshed successfully',
    data: result,
  });
});

const resendOtpIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.resendOtp(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
  });
});

export const AuthControllers = {
  registerUserIntoDB,
  loginUserIntoDB,
  confirmPendingLogin,
  getUserDevices,
  logoutDevice,
  logoutUser,
  logoutAllDevices,
  verifyEmailIntoDB,
  getMyProfile,
  forgotPasswordIntoDB,
  resetPasswordIntoDB,
  changePasswordIntoDB,
  refreshTokenIntoDB,
  resendOtpIntoDB,
};
