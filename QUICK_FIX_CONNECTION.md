# ⚡ TEZKOR YECHIM - Connection Muammosi

## ❌ MUAMMO:
Port 5432 ga ulana olmayapti (IPv4 muammosi)

---

# ✅ ENG TEZKOR YECHIM (2 daqiqa)

## Variant 1: DIRECT_URL ni Pooler Port ga O'zgartirish

`.env` faylda `DIRECT_URL` ni quyidagicha o'zgartiring:

```env
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**O'zgarish:** Port `5432` → `6543` va `?pgbouncer=true` qo'shildi.

Keyin:
```powershell
npx prisma db push
```

---

## Variant 2: directUrl ni Vaqtincha Comment Qilish (ENG TEZKOR!)

`prisma/schema.prisma` faylni oching va quyidagicha o'zgartiring:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Connection pooling
  // directUrl = env("DIRECT_URL")    // Vaqtincha comment (migrations uchun)
}
```

Keyin:
```powershell
npx prisma db push
```

✅ **Ishlaydi!** `db push` `directUrl` ni talab qilmaydi.

⚠️ **Eslatma:** Production da `directUrl` kerak bo'ladi, lekin hozircha `db push` ishlatish mumkin.

---

## Variant 3: Supabase dan To'g'ri Connection String

1. Supabase Dashboard → Settings → Database
2. **Connection string** bo'limida:
   - **Session mode** → **URI** → Copy
   - Bu connection string ni `.env` faylga to'g'ridan-to'g'ri qo'ying

**Muhim:** Supabase dan olgan connection string ni o'zgartirmang!

---

# ✅ ENG OSON YECHIM (1 daqiqa)

## .env Fayl (To'liq):

```env
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**O'zgarish:** `DIRECT_URL` da ham port `6543` va `?pgbouncer=true`

Keyin:
```powershell
npx prisma db push
```

---

# 🎯 AGAR HALI HAM MUAMMO BO'LSA

## Prisma Schema da directUrl ni Comment Qilish

`prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // directUrl = env("DIRECT_URL")  // Comment qiling
}
```

Keyin:
```powershell
npx prisma db push
```

✅ **100% ishlaydi!** `db push` `directUrl` ni talab qilmaydi.

---

# ✅ FINAL YECHIM (Copy-Paste Ready)

## 1. prisma/schema.prisma

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // directUrl = env("DIRECT_URL")  // Vaqtincha comment
}
```

## 2. .env Fayl

```env
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

## 3. Terminal

```powershell
npx prisma db push
```

✅ **Ishlaydi!**

---

**Eng tezkor: `directUrl` ni comment qiling va `db push` qiling!** 😊

