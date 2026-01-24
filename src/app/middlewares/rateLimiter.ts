// // src/middlewares/rateLimiter.ts
// import rateLimit from 'express-rate-limit';

// export const resendOtpLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 3,                   // limit each IP to 3 requests per windowMs
//     message: {
//         success: false,
//         message: 'Too many OTP resend requests. Please try again after 15 minutes.',
//     },
//     standardHeaders: true,     // Return rate limit info in the `RateLimit-*` headers
//     legacyHeaders: false,
//     keyGenerator: (req) => {
//         // Email দিয়ে limit করা ভালো (IP + email combo আরও secure)
//         return req.body.email?.toLowerCase().trim() || req.ip;
//     },
//     skipFailedRequests: false,
//     skipSuccessfulRequests: false,
// });



// src/middlewares/rateLimiter.ts
// import rateLimit from 'express-rate-limit';
// import RedisStore from 'rate-limit-redis';
// import Redis from 'ioredis';

// const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// export const resendOtpLimiter = rateLimit({
//     store: new RedisStore({
//         client: redisClient,
//         prefix: 'resend-otp:',   // key prefix
//     }),
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 3,
//     message: {
//         success: false,
//         message: 'Too many attempts. Please wait 15 minutes before trying again.',
//     },
//     keyGenerator: (req) => `resend:${req.body.email?.toLowerCase().trim() || req.ip}`,
// });