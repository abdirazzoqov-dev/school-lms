# Rate Limiting Ishlatish Qo'llanmasi

## Nima Uchun Kerak?

Rate limiting sizning serveringizni quyidagilardan himoya qiladi:
- DDoS hujumlari
- Brute force login urinishlari
- API abuse
- Bot hujumlari

## Qanday Ishlaydi?

Har bir IP address uchun 1 daqiqada **100 ta so'rov** ruxsat etiladi.

---

## Middleware da Ishlatish (Barcha routelar uchun)

`middleware.ts` faylini yangilang:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getRateLimitKey, checkRateLimit } from './lib/rate-limit'

export async function middleware(request: NextRequest) {
  // Rate limit tekshirish
  const key = getRateLimitKey(request)
  const rateLimit = checkRateLimit(key)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      }
    )
  }

  // ... qolgan middleware kodi ...

  return NextResponse.next()
}
```

---

## API Route da Ishlatish

### Misol 1: Login API

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    // Login logic...
    const body = await request.json()
    
    // Authentication...
    
    return NextResponse.json({ success: true })
  })
}
```

### Misol 2: Custom Rate Limit

```typescript
// app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter } from '@/lib/rate-limit'

// Payment API uchun qattiqroq limit: 20 so'rov / 1 daqiqa
const paymentLimiter = createRateLimiter(20, 60 * 1000)

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = paymentLimiter.check(ip)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many payment requests' },
      { status: 429 }
    )
  }

  // Payment logic...
  return NextResponse.json({ success: true })
}
```

---

## Turli Limitlar

### Login API (Qattiq limit)
```typescript
const loginLimiter = createRateLimiter(5, 60 * 1000) // 5 urinish / 1 daqiqa
```

### Search API (O'rtacha limit)
```typescript
const searchLimiter = createRateLimiter(30, 60 * 1000) // 30 so'rov / 1 daqiqa
```

### Read API (Yumshoq limit)
```typescript
const readLimiter = createRateLimiter(100, 60 * 1000) // 100 so'rov / 1 daqiqa
```

---

## Production: Redis bilan

Memory-based rate limiting **faqat development** uchun yaxshi. Production da **Redis** ishlatish kerak.

### Redis o'rnatish:

```bash
npm install ioredis
# yoki Vercel KV
npm install @vercel/kv
```

### Redis Rate Limiter:

```typescript
// lib/rate-limit-redis.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

export async function checkRateLimitRedis(key: string, max: number = 100, window: number = 60) {
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, window)
  }

  const remaining = Math.max(0, max - current)
  const success = current <= max

  return { success, remaining, limit: max }
}
```

---

## Testing

### Terminal da test:

```bash
# 101 marta so'rov yuborish (100-dan keyin 429 qaytishi kerak)
for i in {1..101}; do
  curl http://localhost:3001/api/test
  echo "Request $i"
done
```

---

## Monitoring

Rate limit headerlarni tekshirish:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 2025-11-27T12:34:56.789Z
```

---

## FAQ

### Q: Barcha API larga qo'yishim kerakmi?
**A:** Ha, ayniqsa public API va authentication endpointlariga.

### Q: Vercel serverless da ishlaydi mi?
**A:** Ha, lekin Redis ishlatish tavsiya etiladi (Upstash Redis bepul).

### Q: User uchun farq qiladimi?
**A:** Yo'q, normal foydalanish uchun 100 so'rov/daqiqa ko'p.

### Q: Bot hujumini to'xtata oladimi?
**A:** Ha, lekin kuchli DDoS uchun Cloudflare kerak.

---

✅ Rate limiting tayyor!

