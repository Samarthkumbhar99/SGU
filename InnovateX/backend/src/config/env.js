import dotenv from 'dotenv'
import { z } from 'zod'

// Load environment variables before validation
dotenv.config()

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
      message: 'PORT must be a valid port number between 1 and 65535',
    }),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z
    .string()
    .refine(
      (val) => !val || val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
      {
        message: 'MONGODB_URI must be a valid connection string starting with mongodb:// or mongodb+srv://',
      }
    )
    .optional(),
  ALLOW_MEMORY_FALLBACK: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true
      if (val === 'false') return false
      return process.env.NODE_ENV === 'test'
    }),
  DATASET_PATH: z
    .string()
    .default('e:/Hackathons/Triwizathon/data/supply_chain_dataset1.csv'),
  JWT_SECRET: z
    .string()
    .default(
      process.env.NODE_ENV === 'production'
        ? ''
        : 'dev_supplyshield_jwt_secret_must_be_overridden_in_production_at_least_32_chars'
    ),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ML_SERVICE_URL: z.string().url().default('http://localhost:8001'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  REQUEST_TIMEOUT_MS: z
    .string()
    .default('10000')
    .transform((val) => parseInt(val, 10)),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
})

let env

try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:')
    error.issues.forEach((issue) => {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`)
    })
  } else {
    console.error('❌ Unexpected error during environment validation:', error)
  }
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  } else {
    console.warn('⚠️  Falling back to development environment defaults.')
    env = envSchema.parse({
      ...process.env,
      PORT: process.env.PORT || '5000',
      NODE_ENV: process.env.NODE_ENV || 'development',
      ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
    })
  }
}

export default env
