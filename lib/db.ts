import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Cap connection pool in production to avoid Railway free-tier "too many clients" errors.
// Railway PostgreSQL free tier allows ~25 connections total.
function buildDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) return url
  // Only add limit in production (dev uses local DB with higher limits)
  if (process.env.NODE_ENV !== 'production') return url
  // Strip existing connection_limit if already set, then add ours
  const stripped = url.replace(/[?&]connection_limit=[^&]*/g, '').replace(/[?&]pool_timeout=[^&]*/g, '')
  const sep = stripped.includes('?') ? '&' : '?'
  return `${stripped}${sep}connection_limit=10&pool_timeout=20`
}

export const db = globalForPrisma.prisma || (process.env.DATABASE_URL ? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: { url: buildDatabaseUrl() },
  },
}) : null as any)

// Warm up connection pool on first import in development
if (process.env.NODE_ENV !== 'production') {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = db
    // Warm up connection (non-blocking)
    db.$connect().catch(() => {
      // Ignore errors during warm-up
    })
  }
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!db) {
      return false
    }
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

