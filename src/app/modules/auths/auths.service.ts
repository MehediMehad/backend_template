import type { Prisma } from '@prisma/client';
import { compare } from 'bcrypt';
import httpStatus from 'http-status';
import { JwtPayload, verify } from 'jsonwebtoken';

import type {
  TRegisterPayload,
  TLoginPayload,
  TChangePasswordPayload,
  TForgotPasswordPayload,
  TResetPasswordPayload,
  TRefreshTokenPayload,
  TVerifyPayload,
} from './auths.interface';
import ApiError from '../../errors/ApiError';
import { authHelpers } from '../../helpers/authHelpers';
import { generateHelpers } from '../../helpers/generateHelpers';
import prisma from '../../libs/prisma';
import { ForgotPasswordHtml } from '../../utils/email/ForgotPasswordHtml';
import { sentEmailUtility } from '../../utils/email/sendEmail.util';
import { SignUpVerificationHtml } from '../../utils/email/SignUpVerificationHtml';
import config from '../../configs';

const registerUser = async (payload: TRegisterPayload) => {
  // if user already exists
  const isUserExists = await prisma.user.findFirst({
    where: {
      email: payload.email,
    },
  });

  if (isUserExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already exists');
  }

  const hashedPassword: string = await authHelpers.hashPassword(payload.password);

  // Create user data
  const CreateUserdata: Prisma.UserCreateInput = {
    name: payload.name,
    image: payload.image,
    email: payload.email,
    password: hashedPassword,
    role: payload.role,
    phone: payload.phone,
    isVerified: false,
    fcmToken: payload.fcmToken,
  };

  // transaction
  const result = await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: CreateUserdata,
      });

      const { otp, expiresAt } = generateHelpers.generateOTP(6, 10);

      const createOTP = await tx.otp.create({
        data: {
          code: otp,
          email: user.email,
          type: 'VERIFY_EMAIL',
          expiresAt,
        },
      });

      // Send email in a separate thread
      setImmediate(async () => {
        try {
          await sentEmailUtility(
            user.email,
            'Verify Your Email',
            SignUpVerificationHtml('Verify Your Email', createOTP.code),
          );
        } catch (err) {
          console.error('Email sending failed:', err);
        }
      });

      const { password: _, ...userResponse } = user;

      return userResponse;
    },
    {
      timeout: 10000, // 10 seconds
    },
  );

  return result;
};

const loginUser = async (payload: TLoginPayload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  if (user.status !== 'ACTIVE')
    throw new ApiError(httpStatus.FORBIDDEN, `Account is ${user.status.toLowerCase()}`);

  const isPasswordMatch = await compare(payload.password, user.password);
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  if (!user.isVerified) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Please verify your email first');
  }

  const accessToken = authHelpers.createAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  const refreshToken = authHelpers.createRefreshToken({
    userId: user.id,
  });

  // password should not be sent
  const { password: _, ...userData } = user;

  return {
    accessToken,
    refreshToken,
    user: userData,
  };
};

const verifyEmail = async (payload: TVerifyPayload) => {
  const otpRecord = await prisma.otp.findFirst({
    where: {
      email: payload.email,
      code: payload.code,
      type: payload.type,
      expiresAt: { gt: new Date() }, // not expired OTP
    },
    orderBy: { createdAt: 'desc' }, // newest OTP
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired verification code');
  }

  // Transaction usage
  await prisma.$transaction(async (tx) => {
    // 1. Verify email
    await tx.user.update({
      where: { email: payload.email },
      data: { isVerified: true },
    });

    // 2. Delete all (payload.type) OTPs from this email (security + cleanup)
    await tx.otp.deleteMany({
      where: {
        email: payload.email,
        type: payload.type, // "LOGIN" | "FORGOT_PASSWORD" | "VERIFY_EMAIL" | "RESET_PASSWORD" | "VERIFY_PHONE" | "VERIFY_USER"
      },
    });
  });

  return {
    message: `${payload.type.toLowerCase()} verified successfully`,
  };
};

const forgotPassword = async (payload: TForgotPasswordPayload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  // if (!user) {
  //   // "User not found" is usually not called for security reasons
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'If email exists, reset link will be sent');
  // }

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const { otp, expiresAt } = generateHelpers.generateOTP(6, 10); // 10 minutes

  await prisma.otp.create({
    data: {
      email: payload.email,
      code: otp,
      type: 'RESET_PASSWORD',
      expiresAt,
    },
  });

  // async email
  setImmediate(async () => {
    try {
      await sentEmailUtility(
        payload.email,
        'Reset Your Password',
        ForgotPasswordHtml('Reset Password', otp),
      );
    } catch (err) {
      console.error('Reset password email failed:', err);
    }
  });

  return {
    message: 'Reset password code has been sent to your email',
  };
};

const resetPassword = async (payload: TResetPasswordPayload) => {
  const otpRecord = await prisma.otp.findFirst({
    where: {
      code: payload.token,
      type: 'RESET_PASSWORD',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired token');
  }

  const hashedPassword = await authHelpers.hashPassword(payload.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { email: otpRecord.email },
      data: { password: hashedPassword },
    });

    // Delete all RESET_PASSWORD OTPs from this email
    await tx.otp.deleteMany({
      where: {
        email: otpRecord.email,
        type: 'RESET_PASSWORD',
      },
    });
  });

  return { message: 'Password reset successful' };
};

const changePassword = async (userId: string, payload: TChangePasswordPayload) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const isMatch = await compare(payload.oldPassword, user.password);

  if (!isMatch) throw new ApiError(httpStatus.BAD_REQUEST, 'Old password is incorrect');

  const newHashedPassword = await authHelpers.hashPassword(payload.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: newHashedPassword },
  });

  return { message: 'Password changed successfully' };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      image: true,
      isVerified: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  return user;
};

const refreshToken = async (payload: TRefreshTokenPayload) => {
  try {
    const decoded = verify(payload.refreshToken, config.auth.jwt.refresh_secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');

    const newAccessToken = authHelpers.createAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return { accessToken: newAccessToken };
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
  }
};

export const AuthsServices = {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  refreshToken,
};
