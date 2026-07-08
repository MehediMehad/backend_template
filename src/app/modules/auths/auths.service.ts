import type { User } from '@prisma/client';
import { UserStatusEnum, type Prisma } from '@prisma/client';
import { compare } from 'bcrypt';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';
import { verify } from 'jsonwebtoken';

import type {
  TRegisterPayload,
  TLoginPayload,
  TChangePasswordPayload,
  TForgotPasswordPayload,
  TResetPasswordPayload,
  TVerifyPayload,
  TResendOtpPayload,
} from './auths.interface';
import config from '../../../configs';
import ApiError from '../../errors/ApiError';
import { authHelpers } from '../../helpers/authHelpers';
import { generateHelpers } from '../../helpers/generateHelpers';
import prisma from '../../libs/prisma';
import { redis } from '../../libs/redis';
import { queueEmail } from '../../queues/email.queue';
import { ForgotPasswordHtml } from '../../utils/email/ForgotPasswordHtml';
import { SignUpVerificationHtml } from '../../utils/email/SignUpVerificationHtml';

type TResponse = {
  data: Partial<User>;
  message: string;
};

const registerUser = async (payload: TRegisterPayload): Promise<TResponse> => {
  // if user already exists
  const isUserExists = await prisma.user.findFirst({
    where: {
      email: payload.email,
    },
    select: {
      id: true,
      email: true,
      isVerified: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (isUserExists && isUserExists.isVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already exists');
  }

  if (isUserExists && !isUserExists.isVerified) {
    const { otp } = generateHelpers.generateOTP(10);

    // Save to Redis (TTL: 10 minutes = 600 seconds)
    await redis.setex(`otp:${isUserExists.email}:VERIFY_EMAIL`, 600, otp);

    // Send email via BullMQ queue
    void queueEmail({
      emailTo: isUserExists.email,
      EmailSubject: 'Verify Your Email',
      EmailHTML: SignUpVerificationHtml('Verify Your Email', otp),
    });

    return {
      data: isUserExists,
      message: 'Please verify your email.',
    };
  }

  const hashedPassword: string = await authHelpers.hashPassword(payload.password);

  const fcmTokens: string[] = [];

  if (payload.fcmToken) {
    fcmTokens.push(payload.fcmToken);
  }

  // Create user data
  const CreateUserdata: Prisma.UserCreateInput = {
    name: payload.name,
    image: payload.image,
    email: payload.email,
    password: hashedPassword,
    role: payload.role,
    phone: payload.phone,
    isVerified: false,
    fcmTokens,
    status: 'DEACTIVATE',
  };

  // transaction (only User creation since OTP is in Redis now)
  const result = await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: CreateUserdata,
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
          updatedAt: true,
        },
      });

      const { otp } = generateHelpers.generateOTP(10);

      // Save to Redis (TTL: 10 minutes = 600 seconds)
      await redis.setex(`otp:${user.email}:VERIFY_EMAIL`, 600, otp);

      // Send email via BullMQ queue
      void queueEmail({
        emailTo: user.email,
        EmailSubject: 'Verify Your Email',
        EmailHTML: SignUpVerificationHtml('Verify Your Email', otp),
      });

      return user;
    },
    {
      timeout: 10000, // 10 seconds
    },
  );

  return {
    data: result,
    message: 'User registered successfully. Please check your email to verify.',
  };
};

const loginUser = async (payload: TLoginPayload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  if (!user.isVerified) throw new ApiError(httpStatus.FORBIDDEN, 'Please verify your email first');

  if (user.status !== 'ACTIVE')
    throw new ApiError(httpStatus.FORBIDDEN, `Account is ${user.status.toLowerCase()}`);

  const isPasswordMatch = await compare(payload.password, user.password);

  if (!isPasswordMatch) throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid password');

  await prisma.user.update({
    where: { id: user.id },
    data: { fcmTokens: { push: payload.fcmToken }, lastLoginAt: new Date() },
  });

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
    ...userData,
  };
};

const verifyEmail = async (payload: TVerifyPayload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true, name: true, email: true, role: true, isVerified: true },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  // Verify code from Redis
  const savedOtp = await redis.get(`otp:${payload.email}:${payload.type}`);

  if (!savedOtp || savedOtp !== payload.code) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired verification code');
  }

  const accessToken = authHelpers.createAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  const refreshToken = authHelpers.createRefreshToken({
    userId: user.id,
  });

  // Transaction usage
  const updatedUser = await prisma.$transaction(
    async (tx) => {
      // 1. Verify email
      const user = await tx.user.update({
        where: { email: payload.email },
        data: { isVerified: true, status: UserStatusEnum.ACTIVE },
        select: { id: true, name: true, email: true, role: true, isVerified: true },
      });

      // 2. Delete OTP from Redis (security + cleanup)
      await redis.del(`otp:${payload.email}:${payload.type}`);

      // 3. Create RESET_PASSWORD reset token in Redis
      if (payload.type === 'RESET_PASSWORD') {
        // Map reset_token -> email for 10 minutes (600 seconds)
        await redis.setex(`reset_token:${accessToken}`, 600, payload.email);
      }

      return user;
    },
    {
      timeout: 10000, // 10 seconds
    },
  );

  return {
    message: `${payload.type.toLowerCase()} verified successfully`,
    result: {
      ...updatedUser,
      accessToken,
      refreshToken,
    },
  };
};

const forgotPassword = async (payload: TForgotPasswordPayload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const { otp } = generateHelpers.generateOTP(10); // 10 minutes

  // Save OTP in Redis (TTL: 10 minutes = 600 seconds)
  await redis.setex(`otp:${payload.email}:RESET_PASSWORD`, 600, otp);

  // Send email via BullMQ queue
  void queueEmail({
    emailTo: payload.email,
    EmailSubject: 'Reset Your Password',
    EmailHTML: ForgotPasswordHtml('Reset Password', otp),
  });

  return {
    message: 'Reset password code has been sent to your email',
  };
};

const resetPassword = async (payload: TResetPasswordPayload) => {
  // Retrieve email mapped to the reset token from Redis
  const email = await redis.get(`reset_token:${payload.token}`);

  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired token');
  }

  const hashedPassword = await authHelpers.hashPassword(payload.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Delete the reset token from Redis
    await redis.del(`reset_token:${payload.token}`);
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

const refreshToken = async (refreshToken: string) => {
  // Verify
  const decoded = verify(refreshToken, config.jwt.refresh_secret) as JwtPayload;

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
};

const resendOtp = async (payload: TResendOtpPayload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const { otp } = generateHelpers.generateOTP(10);

  // Save OTP in Redis (TTL: 10 minutes = 600 seconds)
  await redis.setex(`otp:${payload.email}:${payload.type}`, 600, otp);

  // Send email via BullMQ queue
  const html =
    payload.type === 'VERIFY_EMAIL'
      ? SignUpVerificationHtml('Verify Your Email', otp)
      : ForgotPasswordHtml('Reset Your Password', otp);

  void queueEmail({
    emailTo: payload.email,
    EmailSubject: 'Your Verification Code',
    EmailHTML: html,
  });

  return { message: 'A new OTP has been sent to your email.' };
};

const logout = async (token: string) => {
  // Blacklist the token in Redis for 24 hours (86400 seconds)
  await redis.setex(`blacklist:${token}`, 86400, 'true');
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
  resendOtp,
  logout,
};
