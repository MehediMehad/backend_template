import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import { ProductServices } from './product.service';
import catchAsync from '../../helpers/catchAsync';
import { getEnvVar } from '../../helpers/getEnvVar';
import { stripe } from '../../libs/stripe';
import sendResponse from '../../utils/sendResponse';

const createAppointment = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.createAppointment();
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Product created successfully',
    data: result,
  });
});

// purchase product
const handleStripeWebhookEvent = catchAsync(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = getEnvVar('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  const result = await ProductServices.handleStripeWebhookEvent(event);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Webhook req send successfully',
    data: result,
  });
});

export const ProductControllers = {
  createAppointment,
  handleStripeWebhookEvent,
};
