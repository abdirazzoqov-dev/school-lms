/**
 * Professional Logger System
 * Centralized logging with different levels and contexts
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

interface LogContext {
  userId?: string
  tenantId?: string
  action?: string
  resourceType?: string
  resourceId?: string
  duration?: number
  metadata?: Record<string, any>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: unknown
  ): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? JSON.stringify(context) : ''
    const errorStr = error instanceof Error ? error.message : String(error)

    return `[${timestamp}] [${level}] ${message} ${contextStr} ${
      error ? `| Error: ${errorStr}` : ''
    }`
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log WARN and above
    if (this.isProduction) {
      return [LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL].includes(level)
    }
    return true // Log everything in development
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context))
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, context))
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context))
    }
  }

  error(message: string, error?: unknown, context?: LogContext) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context, error))
      
      // In production, could send to error tracking service (Sentry, LogRocket, etc.)
      if (this.isProduction) {
        // Example: Sentry.captureException(error, { contexts: { custom: context } })
      }
    }
  }

  fatal(message: string, error?: unknown, context?: LogContext) {
    if (this.shouldLog(LogLevel.FATAL)) {
      console.error(this.formatMessage(LogLevel.FATAL, message, context, error))
      
      // In production, definitely send to error tracking
      if (this.isProduction) {
        // Example: Sentry.captureException(error, { level: 'fatal', contexts: { custom: context } })
      }
    }
  }

  /**
   * Log API request with timing
   */
  apiRequest(
    method: string,
    path: string,
    userId?: string,
    tenantId?: string,
    duration?: number
  ) {
    this.info(`API ${method} ${path}`, {
      userId,
      tenantId,
      duration,
      action: 'API_REQUEST',
    })
  }

  /**
   * Log database query with timing
   */
  dbQuery(
    query: string,
    duration: number,
    tenantId?: string,
    recordCount?: number
  ) {
    const context: LogContext = {
      tenantId,
      duration,
      action: 'DB_QUERY',
      metadata: { recordCount },
    }

    // Warn on slow queries (>1s)
    if (duration > 1000) {
      this.warn(`Slow DB query: ${query}`, context)
    } else {
      this.debug(`DB query: ${query}`, context)
    }
  }

  /**
   * Log user action
   */
  userAction(
    action: string,
    userId: string,
    tenantId: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ) {
    this.info(`User action: ${action}`, {
      userId,
      tenantId,
      action,
      resourceType,
      resourceId,
      metadata,
    })
  }

  /**
   * Log security event
   */
  security(
    event: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    this.warn(`Security event: ${event}`, {
      userId,
      action: 'SECURITY',
      metadata,
    })
  }

  /**
   * Log performance metric
   */
  performance(
    metric: string,
    value: number,
    tenantId?: string,
    metadata?: Record<string, any>
  ) {
    this.debug(`Performance: ${metric} = ${value}ms`, {
      tenantId,
      duration: value,
      metadata,
    })
  }
}

// Singleton instance
export const logger = new Logger()

/**
 * Performance tracker decorator
 */
export function trackPerformance<T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T {
  return ((...args: any[]) => {
    const start = Date.now()
    const result = fn(...args)
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = Date.now() - start
        logger.performance(label, duration)
      })
    }
    
    const duration = Date.now() - start
    logger.performance(label, duration)
    return result
  }) as T
}

/**
 * Async performance tracker
 */
export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    logger.performance(label, duration)
    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error(`${label} failed after ${duration}ms`, error)
    throw error
  }
}

