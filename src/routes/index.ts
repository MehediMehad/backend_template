import express from 'express';

import { AuthsRoutes } from '../app/modules/auths/auths.route';
import { ProductRoutes } from '../app/modules/product/product.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthsRoutes,
  },
  {
    path: '/product',
    route: ProductRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
