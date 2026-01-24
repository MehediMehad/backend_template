import type { UserRoleEnum } from '@prisma/client';
import { UserStatusEnum } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import type { JwtPayload, Secret } from 'jsonwebtoken';

import authConfig from '../configs/auth.config';
import ApiError from '../errors/ApiError';
import type { TAuthPayload } from '../helpers/jwtHelpers';
import { jwtHelpers } from '../helpers/jwtHelpers';
import prisma from '../libs/prisma';

const auth =
  (...roles: UserRoleEnum[]) =>
  async (req: Request & { user?: TAuthPayload }, _res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }

      const verifiedUser = jwtHelpers.verifyToken(token, authConfig.jwt.access_secret as Secret);

      if (!verifiedUser?.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }
      const { id } = verifiedUser;

      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found!');
      }

      if (user.status === UserStatusEnum.BLOCKED) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account is blocked!');
      }

      if (user.status === UserStatusEnum.DEACTIVATE) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account is not Activate!');
      }

      if (user.isDeleted) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account is deleted!');
      }

      req.user = verifiedUser as JwtPayload & TAuthPayload;

      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden!');
      }
      next();
    } catch (err) {
      next(err);
    }
  };

export default auth;
