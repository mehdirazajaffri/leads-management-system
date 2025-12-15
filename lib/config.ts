import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  MAX_FILE_SIZE: z.string().optional().default('10485760'), // 10MB in bytes
  RATE_LIMIT_ENABLED: z.string().optional().default('true'),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e) => e.path.join('.')).join(', ')
      throw new Error(`Missing or invalid environment variables: ${missingVars}`)
    }
    throw error
  }
}

let envCache: Env | null = null

function getEnv(): Env {
  if (!envCache) {
    envCache = validateEnv()
  }
  return envCache
}

export const config = {
  get database() {
    return {
      url: getEnv().DATABASE_URL,
    }
  },
  get auth() {
    return {
      secret: getEnv().NEXTAUTH_SECRET,
      url: getEnv().NEXTAUTH_URL || 'http://localhost:3000',
    }
  },
  get admin() {
    return {
      email: getEnv().ADMIN_EMAIL || 'admin@example.com',
      password: getEnv().ADMIN_PASSWORD || 'admin123',
    }
  },
  get upload() {
    return {
      maxFileSize: parseInt(getEnv().MAX_FILE_SIZE, 10),
    }
  },
  get rateLimit() {
    return {
      enabled: getEnv().RATE_LIMIT_ENABLED === 'true',
    }
  },
} as const

