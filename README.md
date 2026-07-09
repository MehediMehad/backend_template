# 🚀 Production-Ready Node.js, Express & TypeScript Backend Template

A feature-rich, highly structured, and scalable backend template built with **Express**, **TypeScript**, **Prisma ORM**, and **MongoDB**. Designed to serve as a robust starting point for modern web and mobile applications.

---

## 🛠️ Tech Stack & Integrations

- **Core Runtime & Framework:** Node.js, Express, TypeScript
- **Database & ORM:** Prisma Client, MongoDB
- **Authentication & Security:** JWT (Access, Refresh & Reset Passwords), OTP Verification, bcrypt, Express Rate Limiters
- **Storage:** AWS S3 integration with Multer-S3 for file uploads
- **Payments:** Stripe integration with built-in Webhook handler
- **Notifications:** Firebase Cloud Messaging (FCM) support for cross-platform push notifications
- **SMTP/Emails:** Nodemailer integration with Brevo (formerly Sendinblue) pre-configured HTML templates
- **Third-Party Services:** Twilio (SMS), Zoom API (Meetings), Google Translate API
- **Task Scheduling:** Node-cron for background jobs/tasks
- **Linting & Formatting:** ESLint, Prettier

---

## ✨ Features

- 👤 **Complete Auth System:** Register, Email OTP Verification, Login, JWT-based Access & Refresh tokens, Forgot Password, Reset Password, and Profile endpoints.
- 🏗️ **Clean Modular Architecture:** Structured code separation into modules (`routes`, `controllers`, `services`, `validations`, `interfaces`, `constants`).
- 🛡️ **Security Out-of-the-box:** Preconfigured rate limiters (`express-rate-limit`) for sensitive routes, environment variable validation, and secure cookie parsing.
- 📂 **AWS S3 File Uploads:** Upload media files directly to Amazon S3 securely with custom validation using Multer-S3.
- 💳 **Stripe Payment Gateway:** Example endpoints to handle checkout/purchase along with a robust Stripe Webhook receiver.
- 🛎️ **FCM Push Notifications:** Easy multi-device notification mechanism mapping FCM tokens to MongoDB users.
- ⏰ **Background Cron Jobs:** Pre-configured scheduler for recurring tasks (e.g. reminders, status updates, expiring subscriptions).
- 🔍 **Advanced Query Builder:** Built-in helper to build dynamic queries (filters, searches, sorting, pagination) efficiently.
- ⚙️ **Strict TypeScript:** Strictly typed configurations and helper wrappers.

---

## 📁 Directory Structure

```text
backend_template/
├── prisma/
│   └── schema.prisma             # Prisma Database schema (MongoDB provider)
├── public/                       # Static public assets
├── src/
│   ├── app/
│   │   ├── errors/               # Global error handler and custom exception classes
│   │   ├── helpers/              # Auth, JWT, pagination, translation, and db seed helpers
│   │   ├── interface/            # Global TypeScript interfaces
│   │   ├── libs/                 # Initialized library clients (Prisma, Stripe, S3, Firebase)
│   │   ├── middlewares/          # Auth guards, rate limiters, validation, and file upload middlewares
│   │   ├── modules/              # Core business modules (Auths, Notifications, Product)
│   │   │   └── auths/
│   │   │       ├── auths.route.ts
│   │   │       ├── auths.controller.ts
│   │   │       ├── auths.service.ts
│   │   │       ├── auths.validation.ts
│   │   │       ├── auths.interface.ts
│   │   │       └── auths.constant.ts
│   │   └── utils/                # Utility functions (QueryBuilder, response formatters, email templates)
│   ├── configs/                  # Environment configurations loader
│   ├── routes/                   # Application router mappings
│   ├── app.ts                    # Express application instance configurations
│   └── server.ts                 # Server entry point (starts server, Socket.IO, uncaught errors handler)
├── .env                          # App environment variables (git-ignored)
├── .example.env                  # Environment variables template
├── tsconfig.json                 # TypeScript compiler configuration
└── package.json                  # Scripts and dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) Database (Atlas URI or local instance)
- [Redis](https://redis.io/) (Required for background jobs and caching)
- npm or yarn

#### 🐳 How to Run Redis Locally

To run Redis locally, you can choose one of the following methods:

- **Using Docker (Recommended):**
  ```bash
  docker run -d --name local-redis -p 6379:6379 redis:alpine
  ```
- **Windows (Without Docker):**
  - **Method A (via WSL - Recommended):**
    Open your WSL terminal (e.g. Ubuntu) and run:
    ```bash
    sudo apt update
    sudo apt install redis-server
    sudo service redis-server start
    redis-cli ping
    ```
  - **Method B (Native Windows Port):**
    1. Download the pre-compiled zip/msi installer from [tporadowski/redis GitHub Releases](https://github.com/tporadowski/redis/releases).
    2. Install/extract it, and run `redis-server.exe` to start the Redis server.
- **macOS (via Homebrew):**
  ```bash
  brew install redis
  brew services start redis
  ```
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt update
  sudo apt install redis-server
  sudo systemctl start redis-server
  ```

### 2. Installation

Clone this repository and install the dependencies:

```bash
# Using npm
npm install

# Using yarn
yarn install
```

### 3. Environment Setup

Create a copy of `.example.env` as `.env` and fill in your details:

```bash
cp .example.env .env
```

Make sure to configure:

- `DATABASE_URL`: Your MongoDB connection string.
- `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Default super-admin credentials to seed on startup.
- `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: Secure secret keys (e.g. generated via `openssl rand -hex 64`).
- Integrations (S3, Stripe, SMTP, Twilio, Firebase) if you plan to use them.

### 4. Prisma Setup & Sync

Generate the Prisma Client to sync schemas:

```bash
# Generate Prisma Client
npx prisma generate

# Open Prisma Studio to manage your database visually
npx prisma studio
```

### 5. Running the Application

#### Development Mode (auto-reload with `tsx`)

```bash
# Start API server
npm run dev

# Start worker process (optional)
npm run worker
```

#### Production Mode

```bash
# Build TypeScript to Javascript
npm run build

# Start the compiled server
npm run start

# Start the compiled worker
npm run worker:start
```

---

## ⚡ Available NPM Scripts

| Script                    | Command                   | Description                                                               |
| :------------------------ | :------------------------ | :------------------------------------------------------------------------ |
| `npm run dev`             | `tsx watch src/server.ts` | Runs the API server in hot-reload development mode.                       |
| `npm run worker`          | `tsx watch src/worker.ts` | Runs the background worker module in development mode.                    |
| `npm run build`           | `tsc`                     | Compiles the TypeScript code into production-ready JavaScript in `/dist`. |
| `npm run start`           | `node ./dist/server.js`   | Starts the production server from compiled JavaScript.                    |
| `npm run worker:start`    | `node ./dist/worker.js`   | Starts the production worker process.                                     |
| `npm run prisma:generate` | `prisma generate`         | Generates the Prisma Client.                                              |
| `npm run prisma:studio`   | `prisma studio`           | Launches Prisma database browser console.                                 |
| `npm run lint`            | `eslint .`                | Runs lint checks on the codebase.                                         |
| `npm run lint:fix`        | `eslint . --fix`          | Automatically fixes simple linting issues.                                |
| `npm run format`          | `prettier --write .`      | Formats all code files using Prettier.                                    |

---

## 🔑 Authentication Endpoints

For a detailed view of registration, OTP verification, login, forgot password, and reset password flows, please check the [Authentication Endpoints Documentation](file:///d:/Projects/Mehedi/backend_template/README_AUTH.md).

---

## 📝 Module Development Standard

To add a new module (e.g., `Book`), create a folder under `src/app/modules/book` containing:

1. `book.interface.ts`: Defines TypeScript interfaces.
2. `book.validation.ts`: Zod validation schemas for requests.
3. `book.constant.ts`: Constants such as lists or search/filter properties.
4. `book.service.ts`: Database query queries, business actions.
5. `book.controller.ts`: Endpoint controllers mapping requests to services.
6. `book.route.ts`: Router mapping endpoints to controllers.

Don't forget to register your route in [src/routes/index.ts](file:///d:/Projects/Mehedi/backend_template/src/routes/index.ts).

---

## 🔒 Security Practices Built-in

1. **Request Verification:** All incoming requests are validated against strict Zod schemas inside `validateRequest` middleware before reaching controllers.
2. **Authentication Guards:** `auth.ts` middleware ensures request headers contain valid JWTs and handles role authorization.
3. **Database Transactions:** Crucial actions (like registration and OTP checks) execute in transaction blocks to guarantee data consistency.
4. **Rate Limiting:** Critical routes (like login, OTP resend, forgot-password) are protected from brute force attacks using custom route limiters.
