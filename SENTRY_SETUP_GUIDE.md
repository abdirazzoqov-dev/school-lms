# Sentry Setup - Error Tracking

## Nima Uchun Kerak?

Sentry sizga:
- Xatolarni real-time kuzatish
- Qaysi userlarda xato chiqqanini bilish
- Stack trace va debugging info
- Performance monitoring
- **Bepul**: 5,000 event/oy

---

## 1. Account Yaratish

1. https://sentry.io ga kiring
2. "Sign Up" bosing (GitHub orqali tavsiya)
3. Bepul "Developer" plan ni tanlang

---

## 2. Project Yaratish

1. "Create Project" bosing
2. **Platform**: Next.js
3. **Alert frequency**: Default
4. **Project name**: school-lms
5. "Create Project" bosing

---

## 3. Next.js da O'rnatish

### A. Paketni o'rnatish:

```bash
npx @sentry/wizard@latest -i nextjs
```

Bu avtomatik:
- Paketlarni o'rnatadi
- Konfiguratsiya fayllarini yaratadi
- .env ga DSN qo'shadi

### B. Yoki qo'lda o'rnatish:

```bash
npm install @sentry/nextjs
```

**sentry.client.config.ts** yaratish:

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // 100% transaction sample
  
  // Set sampling rate for profiling
  profilesSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
})
```

**sentry.server.config.ts** yaratish:

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  
  environment: process.env.NODE_ENV,
})
```

**sentry.edge.config.ts** yaratish:

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

---

## 4. Environment Variables

`.env.local` ga qo'shing:

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxx.ingest.sentry.io/xxxxx"
SENTRY_DSN="https://xxxxx@xxx.ingest.sentry.io/xxxxx"

# Optional: Auth Token (releases uchun)
SENTRY_AUTH_TOKEN="your-auth-token"
```

DSN ni Sentry dashboard dan ko'chirib oling.

---

## 5. Error Capturing

### Avtomatik (Hech narsa qilmasangiz ham ishlaydi!)

Sentry avtomatik barcha xatolarni tutadi:
- Unhandled exceptions
- Promise rejections
- Console errors

### Manual Error Reporting

```typescript
import * as Sentry from "@sentry/nextjs"

try {
  // Xato chiqishi mumkin bo'lgan kod
  await riskyOperation()
} catch (error) {
  // Sentry ga yuborish
  Sentry.captureException(error, {
    tags: {
      section: "payment",
      tenantId: user.tenantId,
    },
    user: {
      id: user.id,
      email: user.email,
    },
  })
  
  // User ga xabar
  toast.error("Xatolik yuz berdi")
}
```

### Custom Messages

```typescript
Sentry.captureMessage("To'lov muvaffaqiyatsiz", {
  level: "warning",
  tags: {
    payment_method: "card",
    amount: "100000",
  },
})
```

---

## 6. User Context

Login qilgandan keyin:

```typescript
// lib/auth.ts yoki layout.tsx
import { useSession } from "next-auth/react"
import * as Sentry from "@sentry/nextjs"

const { data: session } = useSession()

if (session?.user) {
  Sentry.setUser({
    id: session.user.id,
    email: session.user.email,
    username: session.user.fullName,
    tenantId: session.user.tenantId,
  })
}
```

---

## 7. Performance Monitoring

### API Route

```typescript
import * as Sentry from "@sentry/nextjs"

export async function GET(request: NextRequest) {
  const transaction = Sentry.startTransaction({
    op: "api",
    name: "GET /api/students",
  })

  try {
    // Your code...
    const students = await db.student.findMany()
    
    transaction.setStatus("ok")
    return NextResponse.json(students)
  } catch (error) {
    transaction.setStatus("internal_error")
    Sentry.captureException(error)
    throw error
  } finally {
    transaction.finish()
  }
}
```

---

## 8. Source Maps (Production)

**next.config.js** da:

```javascript
const { withSentryConfig } = require("@sentry/nextjs")

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... your config
}

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry options
    silent: true,
    org: "your-org",
    project: "school-lms",
  },
  {
    // Upload options
    widenClientFileUpload: true,
    transpileClientSDK: true,
    hideSourceMaps: true,
    disableLogger: true,
  }
)
```

---

## 9. Testing

### Test Error:

```bash
# Terminal da
curl http://localhost:3001/api/test-sentry
```

**app/api/test-sentry/route.ts** yaratish:

```typescript
import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"

export async function GET() {
  try {
    throw new Error("Sentry test error!")
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ 
      message: "Error sent to Sentry!" 
    })
  }
}
```

---

## 10. Monitoring Dashboard

Sentry dashboard da ko'ring:
- **Issues**: Barcha xatolar
- **Performance**: API tezligi
- **Releases**: Qaysi versiyada xato
- **Alerts**: Email/Slack xabarnomalar

---

## 11. Alert Sozlamalar

1. Project Settings > Alerts
2. "Create Alert" bosing
3. **Condition**: New issue
4. **Action**: Send email
5. "Save Rule"

---

## Best Practices

### ✅ Qilish Kerak:
- User context qo'shish
- Tags ishlatish (tenantId, section, etc.)
- Production da source maps yuklash
- Error message lo'nda tushunarli qilish

### ❌ Qilmaslik Kerak:
- Parollar va sensitive data yubormaslik
- Har bir console.log ni Sentry ga yubormaslik
- Development da ko'p event yubormaslik

---

## Bepul Plan Limitleri

- ✅ 5,000 error events/oy
- ✅ 10,000 performance transactions/oy
- ✅ 1 project
- ✅ 30 kunlik history

**Yetadimi?** 
- 10 maktab: **Yetadi** ✅
- 50+ maktab: **Upgrade kerak** ($26/oy)

---

## FAQ

### Q: Development da ishlaydi mi?
**A:** Ha, lekin NODE_ENV="production" bo'lganda ko'proq ma'lumot yuboriladi.

### Q: Xatolar userga ko'rinadimi?
**A:** Yo'q, faqat siz Sentry dashboard da ko'rasiz.

### Q: Performance ta'sir qiladimi?
**A:** Juda oz (~1-2ms), user sezmaydi.

---

✅ **Sentry setup tayyor!**

Error tracking endi ishlaydi. Har qanday xato avtomatik Sentry ga yuboriladi va siz email orqali xabardor bo'lasiz.

