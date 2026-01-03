# 🎯 SUPABASE GA YUKLASH - To'liq Yechim

## 📊 MUAMMOLAR TAHLILI:

1. ❌ `.env` fayl format noto'g'ri
2. ❌ `DATABASE_URL` `https://` formatida (noto'g'ri)
3. ❌ `DIRECT_URL` port 5432 (IPv4 muammosi)
4. ❌ Connection string format noto'g'ri

---

# ✅ TO'LIQ YECHIM (Qadam-ba-Qadam)

## BOSQICH 1: SUPABASE DAN CONNECTION STRINGS OLISH (5 daqiqa)

### 1.1 - Supabase Dashboard

1. https://supabase.com/dashboard ga kiring
2. Project ni tanlang

### 1.2 - Settings → Database

1. **Settings** (⚙️) → **Database**
2. **Connection string** bo'limiga kiring

### 1.3 - Pooling Connection (DATABASE_URL)

1. **Connection pooling** ni tanlang
2. **URI** ni tanlang
3. **Copy** tugmasini bosing

**Format:**
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

📋 **Nusxalab oling!**

### 1.4 - Session Mode Connection (DIRECT_URL)

1. **Session mode** ni tanlang (pooling emas!)
2. **URI** ni tanlang
3. **Copy** tugmasini bosing

**Format:**
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres
```

📋 **Nusxalab oling!**

⚠️ **MUHIM:** `[PASSWORD]` o'rniga Supabase parolingizni qo'ying!

---

## BOSQICH 2: .ENV FAYLNI TO'LIQ YANGILASH (2 daqiqa)

### 2.1 - .env Faylini Ochish

`.env` faylni VS Code da oching.

### 2.2 - To'liq Content (Copy-Paste Ready)

`.env` faylning **BARCHA CONTENT** ni o'chirib, quyidagini qo'ying:

```env
# Supabase Connection (Pooling - Production uchun)
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Migrations uchun)
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"

# Super Admin
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**MUHIM:**
- `pgkzjfacqntzsgcoqvhk` o'rniga sizning project ID ingiz
- `Just2003` o'rniga Supabase parolingiz
- `aws-0-singapore` o'rniga sizning region ingiz

### 2.3 - Saqlash

`Ctrl+S` bosing.

---

## BOSQICH 3: PRISMA SCHEMA TEKSHIRISH (1 daqiqa)

### 3.1 - prisma/schema.prisma Faylini Tekshirish

Fayl quyidagicha bo'lishi kerak:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Connection pooling
  directUrl = env("DIRECT_URL")        // Direct connection
}
```

Agar `directUrl` yo'q bo'lsa, qo'shing!

---

## BOSQICH 4: DATABASE SCHEMA PUSH (5 daqiqa)

### 4.1 - Terminal Ochish

VS Code da yangi terminal oching (`Ctrl+``).

### 4.2 - Prisma Client Generate

```powershell
npm run db:generate
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
```

### 4.3 - Schema Push

```powershell
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ The database is now in sync with your schema.
```

✅ **Tayyor!** Schema Supabase ga yuklandi.

---

## BOSQICH 5: MA'LUMOTLARNI IMPORT QILISH (10 daqiqa)

### 5.1 - Supabase SQL Editor

1. Supabase dashboard da:
   - **SQL Editor** ni bosing (chap sidebar)
   - **New query** tugmasini bosing

### 5.2 - backup.sql Faylini Copy Qilish

1. `backup.sql` faylini VS Code da oching
2. **BARCHA CONTENT** ni select qiling (`Ctrl+A`)
3. **Copy** qiling (`Ctrl+C`)

### 5.3 - SQL Editor ga Paste Qilish

1. Supabase SQL Editor ga **Paste** qiling (`Ctrl+V`)
2. **Run** tugmasini bosing (yoki `F5`)

⏳ 2-5 daqiqa kutish...

**Kutilayotgan natija:**
```
Success. No rows returned
```

✅ **Tayyor!** Ma'lumotlar import qilindi.

---

## BOSQICH 6: TEKSHIRISH (3 daqiqa)

### 6.1 - Prisma Studio

```powershell
npm run db:studio
```

Brauzerda: http://localhost:5555

- **Tenant** jadvalini oching
- Ma'lumotlar borligini tekshiring

### 6.2 - Local Test

```powershell
npm run dev
```

Brauzerda: http://localhost:3000

- Login qiling
- Ma'lumotlar ko'rinishini tekshiring

✅ **Tayyor!** Hammasi ishlayapti!

---

# 🔧 AGAR MUAMMO BO'LSA

## Muammo 1: Port 5432 Connection Error

**Xato:**
```
Can't reach database server at port 5432
```

**Yechim:**
`DIRECT_URL` da ham pooler port ishlatish:

```env
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

## Muammo 2: DIRECT_URL Topilmayapti

**Xato:**
```
Environment variable not found: DIRECT_URL
```

**Yechim:**
1. `.env` fayl saqlanganligini tekshiring
2. Terminal ni yoping va yangi oching
3. `.env` fayl UTF-8 encoding da ekanligini tekshiring

---

## Muammo 3: Prisma Client EPERM Error

**Xato:**
```
EPERM: operation not permitted
```

**Yechim:**
```powershell
# Barcha node processlarni to'xtatish
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# .prisma papkasini o'chirish
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue

# Generate qilish
npm run db:generate
```

---

# ✅ FINAL CHECKLIST

## Pre-Import:
- [ ] Supabase project yaratildi
- [ ] Connection strings olindi (Pooling + Session)
- [ ] .env fayl to'g'ri format
- [ ] Prisma schema da directUrl bor
- [ ] Schema push qilindi

## Import:
- [ ] backup.sql yaratildi
- [ ] SQL Editor ga copy qilindi
- [ ] Import muvaffaqiyatli

## Post-Import:
- [ ] Prisma Studio da ma'lumotlar ko'rinayapti
- [ ] Local test ishlayapti
- [ ] Login ishlayapti

---

# 🚀 KEYINGI QADAM: VERCEL DEPLOY

Endi Vercel ga deploy qilish vaqti!

**Batafsil:** `DOCKER_TO_VERCEL_DEPLOY.md` faylning **BOSQICH 4 va 5** qismlariga qarang.

---

# 📝 QISQA BUYRUQLAR

```powershell
# 1. Prisma generate
npm run db:generate

# 2. Schema push
npx prisma db push

# 3. Test
npm run db:studio
```

---

**Barcha qadamlar bajarildi! Endi Supabase ga muvaffaqiyatli yuklandi!** 🎉

