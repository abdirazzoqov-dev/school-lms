/**
 * Environment Variables Configuration
 * Type-safe access to environment variables
 */

/**
 * Server-side environment variables
 */
export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  DIRECT_URL: process.env.DIRECT_URL,

  // NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,

  // App
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  APP_NAME: process.env.APP_NAME || 'School LMS',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',

  // Rate Limiting
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED === 'true',
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),

  // File Upload
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10'),
  UPLOAD_DIR: process.env.UPLOAD_DIR || './public/uploads',
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'pdf'],

  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM,

  // Payment Gateways
  CLICK_MERCHANT_ID: process.env.CLICK_MERCHANT_ID,
  CLICK_SERVICE_ID: process.env.CLICK_SERVICE_ID,
  CLICK_SECRET_KEY: process.env.CLICK_SECRET_KEY,

  PAYME_MERCHANT_ID: process.env.PAYME_MERCHANT_ID,
  PAYME_SECRET_KEY: process.env.PAYME_SECRET_KEY,

  UZUM_MERCHANT_ID: process.env.UZUM_MERCHANT_ID,
  UZUM_API_KEY: process.env.UZUM_API_KEY,

  // Logging
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_ENV: process.env.SENTRY_ENV,
  LOGROCKET_APP_ID: process.env.LOGROCKET_APP_ID,

  // Redis
  REDIS_URL: process.env.REDIS_URL,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  // Security
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || '2592000'),

  // Feature Flags
  FEATURE_ONLINE_PAYMENTS: process.env.FEATURE_ONLINE_PAYMENTS === 'true',
  FEATURE_SMS_NOTIFICATIONS: process.env.FEATURE_SMS_NOTIFICATIONS === 'true',
  FEATURE_EMAIL_NOTIFICATIONS: process.env.FEATURE_EMAIL_NOTIFICATIONS === 'true',
  FEATURE_MOBILE_APP: process.env.FEATURE_MOBILE_APP === 'true',
} as const

/**
 * Public environment variables (safe to expose to client)
 */
export const publicEnv = {
  APP_NAME: env.APP_NAME,
  APP_URL: env.APP_URL,
  NODE_ENV: env.NODE_ENV,
  FEATURE_ONLINE_PAYMENTS: env.FEATURE_ONLINE_PAYMENTS,
  FEATURE_MOBILE_APP: env.FEATURE_MOBILE_APP,
} as const

/**
 * Validate required environment variables
 */
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    )
  }
}

/**
 * Check if in production
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Check if in development
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Check if in test
 */
export const isTest = env.NODE_ENV === 'test'

