# Environment Variables Setup

## NEXTAUTH_SECRET yaratish

Terminal da bajaring:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Bu sizga 32 xonali random string beradi, masalan:
```
7f8a9b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0
```

## .env faylini to'ldiring

`.env` faylini oching va quyidagilarni to'ldiring:

```env
# Database (Hozircha local)
DATABASE_URL="postgresql://postgres:password@localhost:5432/school_lms"

# NextAuth - MUHIM!
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="yuqoridagi-random-stringni-bu-yerga-qo'ying"

# Node Environment
NODE_ENV="development"
```

## Production uchun (.env.production)

Production ga deploy qilganingizda yangi fayl yarating: `.env.production`

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:parol@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:parol@db.xxx.supabase.co:5432/postgres"

# NextAuth - YANGI SECRET YARATISH!
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="production-uchun-boshqa-random-string"

# Node Environment
NODE_ENV="production"
```

## ⚠️ MUHIM XAVFSIZLIK

1. **.env faylni HECH QACHON git ga yuklamang!**
2. `.gitignore` da `.env` borligini tekshiring
3. Production uchun yangi NEXTAUTH_SECRET yarating (development bilan bir xil bo'lmasin!)
4. Database parollarni kuchli qiling

## Tekshirish

`.gitignore` faylida quyidagilar borligini tekshiring:

```
# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production
.env.production.local

# Database
*.db
*.db-journal
```

## Vercel ga deploy qilganda

Environment Variables ni Vercel dashboard orqali qo'shing:
1. Project Settings > Environment Variables
2. Har birini qo'shing (DATABASE_URL, NEXTAUTH_SECRET, va boshqalar)
3. Production, Preview, Development uchun alohida qiymatlar berish mumkin

