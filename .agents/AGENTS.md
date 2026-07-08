# Project-Specific AI Coding Rules

This document defines the coding standards, architectural patterns, and project rules to be followed by AI Agents working on this project.

---

## 🛠️ Tech Stack & Constraints
- **Runtime & Language:** Node.js, TypeScript. Use strict typing (`any` is discouraged, define interfaces/types instead).
- **Web Framework:** Express.js.
- **Database & ORM:** MongoDB using Prisma client.
- **Background Tasks:** BullMQ & Redis (`ioredis`) for asynchronous workers (Emails, notifications, etc.).
- **Scheduler:** Node-cron for recurring jobs.
- **HTTP client:** Axios.
- **Validation:** Zod schemas.

---

## 🏗️ Architectural Patterns

### 1. Prisma Modular Schema Structure
- Database schemas are split into individual `.prisma` files located inside [prisma/schema/](file:///d:/Projects/Mehedi/backend_template/prisma/schema).
- Never modify or create a top-level `schema.prisma` inside `prisma/` containing models. Use the config [prisma.config.ts](file:///d:/Projects/Mehedi/backend_template/prisma.config.ts) for path routing.
- When creating a new domain model, create a new file named `<model>.prisma` under the `prisma/schema/` directory, and run `npx prisma generate` to rebuild the Prisma client.

### 2. Clean Modular Architecture (Backend)
New features must follow the modular structure under `src/app/modules/<module_name>/`. A complete module consists of:
1. `name.interface.ts`: Defines TypeScript interfaces.
2. `name.validation.ts`: Zod schema validation for requests.
3. `name.constant.ts`: Static arrays, pagination configurations, search/filter properties.
4. `name.service.ts`: Business logic and database operations using Prisma.
5. `name.controller.ts`: Endpoint handler executing services and returning standardized responses.
6. `name.route.ts`: Express router mapping paths to controllers, validated with Zod, and protected with auth guards.

Register all routes in the main router: [src/routes/index.ts](file:///d:/Projects/Mehedi/backend_template/src/routes/index.ts).

### 3. Background Job Execution (BullMQ)
- Long-running, blocking, or failure-prone network tasks (e.g., email dispatch, FCM notifications) must NOT block HTTP responses.
- Queue these jobs via helper functions in [src/app/queues/](file:///d:/Projects/Mehedi/backend_template/src/app/queues/).
- Processes run separately in background workers defined inside [src/app/workers/](file:///d:/Projects/Mehedi/backend_template/src/app/workers/).
- The worker process is launched using `npm run worker` which executes [src/worker.ts](file:///d:/Projects/Mehedi/backend_template/src/worker.ts).

### 4. Redis Caching & Blacklisting
- **OTPs:** Do not save OTP verification records in the database. Always cache them in Redis using TTL (Time-To-Live) set to 600 seconds (10 minutes). Key format: `otp:<email>:<type>`.
- **JWT Revocation/Logout:** Tokens revoked during logout must be added to the Redis blacklist with a 24-hour expiration (`blacklist:<token>`). Check the blacklist inside the `auth` middleware.
- Always use the global Redis client exported from [src/app/libs/redis.ts](file:///d:/Projects/Mehedi/backend_template/src/app/libs/redis.ts).

---

## 🔒 Security & Code Quality Standards
- **Input Validation:** Every incoming API request body, query, or parameter must be validated against a Zod schema using the `validateRequest` middleware.
- **Global Error Handling:** Throw custom errors utilizing the `ApiError` class. Let the `globalErrorHandler` handle exception formatting.
- **Response Format:** Standardize responses using the `sendResponse` utility.
- **Code Hygiene:** Running `npm run build` and `npm run lint:fix` must always succeed before committing any changes. Do not introduce formatting or eslint warnings.
