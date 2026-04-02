import Stripe from 'stripe';
import config from '../../configs';


export const stripe = new Stripe(config.stripe.secret_key);
