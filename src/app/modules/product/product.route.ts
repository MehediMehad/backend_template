import { Router } from 'express';

import { ProductControllers } from './product.controller';
import auth from '../../middlewares/auth';

const router = Router();

router.post('/purchase-product', ProductControllers.createAppointment);

export const ProductRoutes = router;
