import type Stripe from 'stripe';

import { stripe } from '../../libs/stripe';

consty

const createAppointment = async () => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: `${Date.now()}@gmail.com`,
    line_items: [
      {
        price_data: {
          currency: 'bdt',
          product_data: {
            name: `Programming Hero Book`,
          },
          unit_amount: 300 * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookId: `${Date.now()}`,
      paymentId: `${Date.now()}`,
    },
    success_url: `https://www.programming-hero.com/`,
    cancel_url: `https://next.programming-hero.com/`,
  });

  return { paymentUrl: session.url };
};

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  console.log('😍😍😍😍', event.type);
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;

      const bookId = session.metadata?.bookId;
      const paymentId = session.metadata?.paymentId;

      break;
    }

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }
};

export const ProductServices = {
  createAppointment,
  handleStripeWebhookEvent,
};
