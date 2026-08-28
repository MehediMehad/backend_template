import type { UserRoleEnum } from '@prisma/client';
import { UserStatusEnum } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';

import config from '../../configs';
import ApiError from '../errors/ApiError';
import type { TAccessTokenPayload } from '../interface';
import prisma from '../libs/prisma';
import { redis } from '../libs/redis';
import { verifyToken } from '../utils/token';

const auth =
  (...roles: UserRoleEnum[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }

      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Token has been revoked!');
      }

      const verifiedUser = verifyToken<JwtPayload & TAccessTokenPayload>(
        token,
        config.jwt.access_secret,
      );

      if (!verifiedUser || !verifiedUser.userId || !verifiedUser.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }
      const { userId } = verifiedUser;

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found!');
      }

      if (user.status === UserStatusEnum.BLOCKED) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account is blocked!');
      }

      if (user.status === UserStatusEnum.DEACTIVATE) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account is not active!');
      }

      req.user = verifiedUser;

      if (roles.length && !roles.includes(user.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: Insufficient permissions');
      }

      next();
    } catch (err) {
      next(err);
    }
  };

export default auth;
