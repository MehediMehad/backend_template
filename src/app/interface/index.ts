/* eslint-disable @typescript-eslint/no-namespace */
import type { JwtPayload } from 'jsonwebtoken';

import type { TAuthPayload } from '../helpers/jwtHelpers';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload & TAuthPayload;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */
