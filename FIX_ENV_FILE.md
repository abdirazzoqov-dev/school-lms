# 🔧 .env Fayl Muammolari - Yechim

## ❌ MUAMMOLAR:

1. **DATABASE_URL noto'g'ri format** - `https://` emas, `postgresql://` bo'lishi kerak
2. **DIRECT_URL Prisma tomonidan topilmayapti** - Format yoki cache muammosi

---

# YECHIM: .env Faylni To'g'rilash

## 1. .env Fayl Content (To'g'ri Format)

`.env` faylni quyidagicha to'g'rilang:

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

---

## 2. MUHIM O'ZGARISHLAR:

### ❌ Noto'g'ri:
```env
DATABASE_URL="https://pgkzjfacqntzsgcoqvhk.supabase.co"
```

### ✅ To'g'ri:
```env
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Sabab:**
- `https://` emas, `postgresql://` bo'lishi kerak
- Pooling connection kerak (`?pgbouncer=true`)
- Port `6543` (pooling) yoki `5432` (direct)
- Parol qo'shilishi kerak

---

## 3. DIRECT_URL Format

### ❌ Noto'g'ri:
```env
DIRECT_URL="postgresql://postgres:$Just2003@db.pgkzjfacqntzsgcoqvhk.supabase.co:5432/postgres"
```

**Muammo:** `$` belgisi parol ichida muammo yaratishi mumkin.

### ✅ To'g'ri:
```env
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:5432/postgres"
```

**Yoki agar IPv4 muammo bo'lsa:**
```env
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

# QADAM-BA-QADAM YECHIM

## 1. .env Faylni To'liq Yangilash

`.env` faylni oching va **BARCHA CONTENT** ni quyidagi bilan almashtiring:

```env
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

## 2. .env Faylni Saqlash

- `Ctrl+S` bosing (Save)

## 3. Terminal ni Qayta Ishga Tushirish

1. **Joriy terminal ni yoping**
2. **Yangi terminal oching** (VS Code da `Ctrl+`` yoki Terminal → New Terminal)

## 4. Prisma db push

```powershell
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ The database is now in sync with your schema.
```

---

# AGAR HALI HAM DIRECT_URL TOPILMASA

## Variant 1: .env Fayl Formatini Tekshirish

1. `.env` fayl **UTF-8** encoding da bo'lishi kerak
2. **BOM (Byte Order Mark)** bo'lmasligi kerak
3. **Windows line endings** (CRLF) bo'lishi mumkin

**Yechim:**
- VS Code da **File → Save with Encoding → UTF-8** tanlang

## Variant 2: .env.local Yaratish

Ba'zida `.env` o'qilmaydi. `.env.local` yaratib sinab ko'ring:

```powershell
# .env content ni .env.local ga copy qilish
Copy-Item .env .env.local
```

Keyin:
```powershell
npx prisma db push
```

## Variant 3: Environment Variable ni To'g'ridan-To'g'ri Set Qilish

PowerShell da:

```powershell
$env:DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
$env:DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:5432/postgres"
npx prisma db push
```

---

# SUPABASE DAN TO'G'RI CONNECTION STRING OLISH

Agar connection string noto'g'ri bo'lsa:

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Connection string** bo'limida:
   - **Connection pooling** → **URI** → Copy
   - Bu `DATABASE_URL` bo'ladi
3. **Session mode** → **URI** → Copy
   - Bu `DIRECT_URL` bo'ladi

---

# ✅ TEKSHIRISH

Connection to'g'ri bo'lsa:

```powershell
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
✔ The database is now in sync with your schema.
```

---

# 📋 CHECKLIST

- [ ] DATABASE_URL `postgresql://` formatida
- [ ] DATABASE_URL da parol bor
- [ ] DIRECT_URL to'g'ri format
- [ ] .env fayl saqlandi
- [ ] Terminal qayta ishga tushirildi
- [ ] db:push ishlayapti

---

**Eng muhimi: `DATABASE_URL` ni `https://` dan `postgresql://` ga o'zgartiring!** 😊

