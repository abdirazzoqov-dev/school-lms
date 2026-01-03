// Rate Limiting - DDoS himoyasi
// Har bir IP address uchun so'rovlar sonini cheklaydi

import { NextRequest, NextResponse } from 'next/server'

// Memory-based rate limiter (production da Redis ishlatish kerak)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

// Config
const WINDOW_MS = 60 * 1000 // 1 daqiqa
const MAX_REQUESTS = 100 // 1 daqiqada maksimal so'rovlar

// Tozalash (eski yozuvlarni o'chirish)
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimit.entries()) {
    if (now > value.resetTime) {
      rateLimit.delete(key)
    }
  }
}, WINDOW_MS)

export function getRateLimitKey(request: NextRequest): string {
  // IP address yoki user ID
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return ip
}

export function checkRateLimit(key: string): {
  success: boolean
  limit: number
  remaining: number
  reset: number
} {
  const now = Date.now()
  const record = rateLimit.get(key)

  if (!record || now > record.resetTime) {
    // Yangi yoki tugagan record
    rateLimit.set(key, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return {
      success: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      reset: now + WINDOW_MS,
    }
  }

  if (record.count >= MAX_REQUESTS) {
    // Limit oshib ketdi
    return {
      success: false,
      limit: MAX_REQUESTS,
      remaining: 0,
      reset: record.resetTime,
    }
  }

  // Count oshirish
  record.count++
  return {
    success: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - record.count,
    reset: record.resetTime,
  }
}

// Middleware uchun
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const key = getRateLimitKey(request)
  const rateLimit = checkRateLimit(key)

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Juda ko\'p so\'rov yuborildi. Iltimos, biroz kutib turing.',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  const response = await handler()

  // Rate limit headersni qo'shish
  response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(rateLimit.reset).toISOString())

  return response
}

// API route uchun helper
export function createRateLimiter(maxRequests: number = MAX_REQUESTS, windowMs: number = WINDOW_MS) {
  const limiter = new Map<string, { count: number; resetTime: number }>()

  return {
    check: (key: string) => {
      const now = Date.now()
      const record = limiter.get(key)

      if (!record || now > record.resetTime) {
        limiter.set(key, { count: 1, resetTime: now + windowMs })
        return { success: true, remaining: maxRequests - 1 }
      }

      if (record.count >= maxRequests) {
        return { success: false, remaining: 0 }
      }

      record.count++
      return { success: true, remaining: maxRequests - record.count }
    },
  }
}

