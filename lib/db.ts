import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Optimized Prisma Client with connection pooling for faster queries
export const db = globalForPrisma.prisma || (process.env.DATABASE_URL ? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'], // Reduced logging for better performance
  // Connection pool settings for better performance
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
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

