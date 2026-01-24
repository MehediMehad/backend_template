import type { Prisma } from '@prisma/client';
import httpStatus from 'http-status';

import type { TRegisterPayload } from './auths.interface';
import ApiError from '../../errors/ApiError';
import { authHelpers } from '../../helpers/authHelpers';
import { generateHelpers } from '../../helpers/generateHelpers';
import prisma from '../../libs/prisma';
import { sentEmailUtility } from '../../utils/email/sendEmail.util';
import { SignUpVerificationHtml } from '../../utils/email/SignUpVerificationHtml';

const createUserIntoDB = async (payload: TRegisterPayload) => {
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

      const { password, ...userResponse } = user;

      return userResponse;
    },
    {
      timeout: 10000, // 10 seconds
    },
  );

  return result;
};

export const AuthsServices = {
  createUserIntoDB,
};
