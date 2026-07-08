import path from 'path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default defineConfig({
  schema: 'prisma/schema',
});
