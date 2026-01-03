# ⚡ Supabase Connection - Tezkor Qadamlar

## 📍 Hozirgi Holat:
- ✅ Connection modal ochildi
- ✅ Direct connection string ko'rinayapti

---

# ⚠️ MUHIM: IPv4 WARNING

Modal da **"Not IPv4 compatible"** warning ko'rinayapti. Bu Vercel uchun muammo bo'lishi mumkin!

**Yechim:** **Pooling connection** ishlatish kerak (Vercel serverless uchun).

---

# BOSQICH 1: POOLING CONNECTION OLISH (2 daqiqa)

## 1.1 - Method Dropdown ni O'zgartirish

Modal da:
1. **Method** dropdown ni bosing
2. **"Connection pooling"** ni tanlang (Direct connection emas!)

## 1.2 - Connection String Copy Qilish

Pooling connection string ko'rinadi:

```
postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

📋 **Copy qiling!** Bu `DATABASE_URL` bo'ladi.

---

# BOSQICH 2: DIRECT CONNECTION OLISH (Migrations uchun)

## 2.1 - Method ni Direct ga O'zgartirish

1. **Method** dropdown ni bosing
2. **"Direct connection"** ni tanlang

## 2.2 - Connection String Copy Qilish

Direct connection string ko'rinadi:

```
postgresql://postgres:[YOUR-PASSWORD]@db.pgkzjfacqntzsgcoqvhk.supabase.co:5432/postgres
```

📋 **Copy qiling!** Bu `DIRECT_URL` bo'ladi.

⚠️ **MUHIM:** `[YOUR-PASSWORD]` o'rniga Supabase da yaratgan parolingizni qo'ying!

---

# BOSQICH 3: .ENV FAYLNI YANGILASH (2 daqiqa)

## 3.1 - .env Faylini Ochish

Loyiha papkasida `.env` faylini oching.

## 3.2 - Connection Strings Qo'shish

`.env` faylga quyidagilarni qo'shing:

```env
# Supabase Connection (Pooling - Vercel uchun)
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Migrations uchun)
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.pgkzjfacqntzsgcoqvhk.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**MUHIM:**
- `[YOUR-PASSWORD]` o'rniga Supabase parolingizni qo'ying
- Pooling connection Vercel uchun kerak (IPv4 compatible)

---

# BOSQICH 4: SCHEMA PUSH (5 daqiqa)

Terminal da:

```bash
# 1. Prisma generate
npm run db:generate

# 2. Schema push
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
✔ The database is now in sync with your schema.
```

---

# BOSQICH 5: MA'LUMOTLARNI IMPORT (10 daqiqa)

## Variant 1: SQL Editor (Tavsiya)

1. Supabase dashboard da:
   - **SQL Editor** ni bosing (chap sidebar)
   - **New query** tugmasini bosing

2. `backup.sql` faylini oching va **BARCHA CONTENT** ni copy qiling

3. SQL Editor ga paste qiling va **Run** tugmasini bosing

⏳ 2-5 daqiqa kutish...

---

## Variant 2: psql (Agar o'rnatilgan bo'lsa)

```bash
psql "DIRECT_URL" < backup.sql
```

---

# BOSQICH 6: TEKSHIRISH (3 daqiqa)

```bash
# Prisma Studio
npm run db:studio
```

Brauzerda: http://localhost:5555

Tenant jadvalida ma'lumotlar borligini tekshiring.

---

# ✅ TAYYOR!

## Keyingi Qadam: Vercel Deploy

Endi Vercel ga deploy qilish vaqti!

**Batafsil:** `DOCKER_TO_VERCEL_DEPLOY.md` faylning **BOSQICH 4 va 5** qismlariga qarang.

---

**Savollar bo'lsa, so'rang!** 😊

