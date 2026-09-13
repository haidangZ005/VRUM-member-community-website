const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:password@localhost:5432/member_community_db'),
  DATABASE_SSL: z.string().default('false').transform((value) => value === 'true'),
  JWT_ACCESS_SECRET: z.string().min(16).default('development-access-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16).default('development-refresh-secret-change-me'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECURE: z.string().optional().transform((value) => value === undefined ? undefined : value === 'true'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('VRUM <no-reply@vrum.local>'),
  CLIENT_URL: z.url().default('http://localhost:5173'),
  ADMIN_EMAIL: z.preprocess((value) => value === '' ? undefined : value, z.email().optional()),
  ADMIN_USERNAME: z.preprocess((value) => value === '' ? undefined : value, z.string().min(3).max(50).optional()),
  ADMIN_PASSWORD: z.preprocess((value) => value === '' ? undefined : value, z.string().min(8).optional()),
  DEMO_PASSWORD: z.preprocess((value) => value === '' ? undefined : value, z.string().min(8).optional()),
  GROQ_API_KEY: z.preprocess((value) => value === '' ? undefined : value, z.string().min(1).optional()),
  LLM_BASE_URL: z.url().default('https://api.groq.com/openai/v1'),
  LLM_MODEL: z.string().min(1).default('openai/gpt-oss-20b'),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(25000),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Cấu hình môi trường không hợp lệ: ${parsed.error.message}`);
}

module.exports = {
  ...parsed.data,
  COOKIE_SECURE: parsed.data.COOKIE_SECURE ?? parsed.data.NODE_ENV === 'production',
};
