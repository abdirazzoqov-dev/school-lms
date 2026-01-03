# 🔧 Database Connection Port Muammosi - Yechim

## ❌ XATOLIK:
```
Can't reach database server at `aws-0-singapore.pooler.supabase.com:5432`
```

## SABAB:
- Port 5432 (direct connection) IPv4 da ishlamaydi
- Pooler port (6543) ishlatish kerak

---

# YECHIM: DIRECT_URL ni Pooler Port ga O'zgartirish

## .env Faylni Yangilang

`.env` faylda `DIRECT_URL` ni quyidagicha o'zgartiring:

### ❌ Noto'g'ri (Port 5432):
```env
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:5432/postgres"
```

### ✅ To'g'ri (Port 6543 - Pooler):
```env
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

# TO'LIQ .ENV FAYL (To'g'ri Format)

`.env` faylni quyidagicha to'liq yangilang:

```env
# Supabase Connection (Pooling - Production uchun)
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Migrations uchun - Pooler port ishlatish)
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"

# Super Admin
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**MUHIM:** 
- Ikkala connection ham **port 6543** (pooler) ishlatadi
- `?pgbouncer=true` parametri qo'shilgan

---

# QADAM-BA-QADAM

## 1. .env Faylni Yangilang

Yuqoridagi to'liq `.env` content ni `.env` faylga qo'ying.

## 2. Faylni Saqlang

`Ctrl+S` bosing.

## 3. Terminal da Test Qiling

```powershell
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ The database is now in sync with your schema.
```

---

# AGAR HALI HAM MUAMMO BO'LSA

## Variant 1: Supabase dan To'g'ri Connection String

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Connection string** bo'limida:
   - **Connection pooling** → **URI** → Copy
   - Bu `DATABASE_URL` bo'ladi
3. **Session mode** → **URI** → Copy
   - Bu `DIRECT_URL` bo'ladi (lekin pooler port bilan)

**MUHIM:** Supabase dan olgan connection string larni to'g'ridan-to'g'ri `.env` ga qo'ying!

---

## Variant 2: Prisma Schema da directUrl ni Optional Qilish

Agar `DIRECT_URL` muammo bo'lsa, `prisma/schema.prisma` da optional qilish:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Optional - agar yo'q bo'lsa, url ishlatiladi
}
```

Lekin bu tavsiya qilinmaydi - migrations uchun `directUrl` kerak.

---

## Variant 3: Migration O'rniga db push Ishlatish

Agar `directUrl` muammo bo'lsa, migration o'rniga `db push` ishlatish:

```powershell
# Migration o'rniga
npx prisma db push
```

Bu `directUrl` ni talab qilmaydi, lekin production da migration tavsiya qilinadi.

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

- [ ] DIRECT_URL port 6543 (pooler)
- [ ] DIRECT_URL da `?pgbouncer=true` parametri
- [ ] .env fayl saqlandi
- [ ] Terminal qayta ishga tushirildi
- [ ] db:push ishlayapti

---

**Eng muhimi: `DIRECT_URL` da port 5432 emas, 6543 (pooler) ishlatish!** 😊

