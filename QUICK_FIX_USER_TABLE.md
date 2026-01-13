# ⚡ TEZKOR YECHIM: "Table User does not exist"

## 🎯 Muammo
```
Invalid `prisma.user.findUnique()` invocation:
The table `public.User` does not exist in the current database.
```

## ✅ TEZKOR YECHIM (5 daqiqa)

### QADAM 1: Prisma Schema Fix (✅ Bajarildi)

Schema'ga `@@map` qo'shildi:
- `User` → `users` (PostgreSQL standard)
- `Tenant` → `tenants`

### QADAM 2: Localda Migration Yaratish

```bash
# Terminal'da
npx prisma migrate dev --name init
```

**Natija:**
- `prisma/migrations/` papkasi yaratiladi
- Database'ga schema yuklanadi

### QADAM 3: Git Commit

```bash
git add prisma/schema.prisma prisma/migrations scripts/vercel-build.js package.json
git commit -m "fix: add Prisma migrations and schema mapping for Supabase"
git push origin main
```

### QADAM 4: Vercel Environment Variables

Vercel Dashboard → Settings → Environment Variables:

**Qo'shish kerak:**
- `DATABASE_URL` = (Supabase pooling connection)
- `DIRECT_URL` = (Supabase direct connection) - **Optional, lekin tavsiya etiladi**

**Format:**
```env
DATABASE_URL="postgresql://postgres.qlivnpgozivqzigkcixc:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.qlivnpgozivqzigkcixc:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

### QADAM 5: Vercel Redeploy

Vercel avtomatik yangi deploy boshlaydi yoki qo'lda:
- Dashboard → Deployments → Latest → "Redeploy"

---

## 🔍 TEKSHIRUV

### Supabase SQL Editor'da:

```sql
-- 1. Jadvallar borligini tekshirish
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. users jadvali borligini tekshirish
SELECT * FROM users LIMIT 1;

-- 3. Migrations holati
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;
```

### Vercel Runtime Logs'da:

- `✅ Migrations deployed successfully!` ko'rinishi kerak
- Xatolar yo'q bo'lishi kerak

### Production'da:

- Login qilish ishlashi kerak
- `prisma.user.findUnique()` xatosi yo'qolishi kerak

---

## ⚠️ AGAR HALI HAM MUAMMO BO'LSA

### Variant A: db push ishlatish (Tezkor)

```bash
# Localda
npx prisma db push --accept-data-loss

# Keyin Vercel'da redeploy
```

### Variant B: Supabase'da manual yaratish

Supabase SQL Editor'da:

```sql
-- User jadvalini yaratish (migrate dev natijasidan)
-- Prisma migration SQL'ni copy-paste qiling
```

---

## 📋 CHECKLIST

- [ ] Prisma schema'da `@@map("users")` qo'shilgan
- [ ] Localda `npx prisma migrate dev --name init` ishlatilgan
- [ ] `prisma/migrations/` papkasi git'ga commit qilingan
- [ ] Vercel env'da `DATABASE_URL` va `DIRECT_URL` qo'shilgan
- [ ] Vercel'da redeploy qilingan
- [ ] Supabase'da jadvallar ko'rinadi
- [ ] Production'da login ishlaydi

---

## 🎉 TAYYOR!

Agar barcha qadamlarni bajargansangiz, muammo hal bo'lishi kerak! 🚀

