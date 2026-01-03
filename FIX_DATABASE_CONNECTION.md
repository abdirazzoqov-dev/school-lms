# 🔧 Database Connection Muammolari - Yechim

## ❌ XATOLIKLAR:

1. **EPERM Error** - Prisma client file lock muammosi
2. **P1001 Error** - Database connection muammosi

---

# YECHIM 1: EPERM ERROR (Prisma Client)

## Muammo:
```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node'
```

## Yechim:

### Variant 1: VS Code yoki boshqa editorlarni yoping

1. **VS Code ni yoping** (agar ochiq bo'lsa)
2. **Boshqa editorlarni ham yoping**
3. Terminal da qayta urinib ko'ring:

```powershell
npm run db:generate
```

### Variant 2: node_modules/.prisma ni o'chirish

```powershell
# .prisma papkasini o'chirish
Remove-Item -Recurse -Force node_modules\.prisma

# Keyin generate qilish
npm run db:generate
```

### Variant 3: Prisma Client ni qayta o'rnatish

```powershell
# Prisma Client ni o'chirish
npm uninstall @prisma/client

# Qayta o'rnatish
npm install @prisma/client

# Generate
npm run db:generate
```

---

# YECHIM 2: DATABASE CONNECTION ERROR (P1001)

## Muammo:
```
Can't reach database server at `db.pgkzjfacqntzsgcoqvhk.supabase.co:5432`
```

## Sabab:
- `DIRECT_URL` noto'g'ri
- IPv4 muammosi (Supabase direct connection IPv6)
- Parol noto'g'ri

---

## YECHIM: .env Faylni Tekshirish va Tuzatish

### 1. .env Faylni Ochish

`.env` faylni oching va quyidagilarni tekshiring:

### 2. DIRECT_URL ni To'g'rilash

**Noto'g'ri:**
```env
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.pgkzjfacqntzsgcoqvhk.supabase.co:5432/postgres"
```

**To'g'ri (IPv4 compatible):**
```env
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:[PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres"
```

**Yoki Session Pooler ishlatish:**
```env
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:[PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 3. To'liq .env Misol

```env
# Supabase Connection (Pooling - Production uchun)
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Migrations uchun - Pooler ishlatish)
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres"

# Yoki agar IPv4 muammo bo'lsa, pooler port ishlatish:
# DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

⚠️ **MUHIM:** 
- `[YOUR-PASSWORD]` o'rniga Supabase parolingizni qo'ying
- `pgkzjfacqntzsgcoqvhk` o'rniga sizning project ID ingiz bo'ladi

---

# ALTERNATIV YECHIM: Supabase dan To'g'ri Connection String

## 1. Supabase Dashboard ga Kiring

1. https://supabase.com/dashboard
2. Project ni tanlang

## 2. Settings → Database

1. **Settings** (⚙️) → **Database**
2. **Connection string** bo'limiga kiring

## 3. Session Mode Connection String Olish

1. **Method** dropdown da:
   - **"Session mode"** ni tanlang (Direct connection emas!)
   - **URI** ni tanlang

2. Connection string ko'rinadi:
```
postgresql://postgres.pgkzjfacqntzsgcoqvhk:[PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres
```

📋 **Bu connection string ni copy qiling va `DIRECT_URL` ga qo'ying!**

---

# QADAM-BA-QADAM YECHIM

## 1. VS Code ni Yoping

VS Code va boshqa editorlarni yoping.

## 2. .env Faylni Yangilang

`.env` faylga quyidagilarni qo'ying (to'g'ri format bilan):

```env
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:[PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:[PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres"
```

## 3. Prisma Client ni Tozalash

```powershell
# .prisma papkasini o'chirish
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue

# Generate qilish
npm run db:generate
```

## 4. Schema Push

```powershell
npx prisma db push
```

---

# AGAR HALI HAM MUAMMO BO'LSA

## Variant 1: Pooler Port Ishlatish

`DIRECT_URL` da ham pooler port ishlatish:

```env
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:[PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Variant 2: Connection String Format Tekshirish

Supabase dashboard dan connection string ni to'g'ridan-to'g'ri copy qiling va `.env` ga qo'ying (parolni o'zgartirib).

## Variant 3: Supabase Project Status

1. Supabase dashboard ga kiring
2. Project active ekanligini tekshiring
3. Database Settings da connection string ni qayta ko'rib chiqing

---

# ✅ TEKSHIRISH

Connection to'g'ri bo'lsa:

```powershell
# Test connection
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ The database is now in sync with your schema.
```

---

# 📋 CHECKLIST

- [ ] VS Code yopildi
- [ ] .env fayl to'g'ri format
- [ ] DIRECT_URL pooler formatida
- [ ] Parol to'g'ri
- [ ] Prisma Client tozalandi
- [ ] db:generate ishlayapti
- [ ] db:push ishlayapti

---

**Agar hali ham muammo bo'lsa, .env fayl content ni ko'rsating (parolni yashirib)!** 😊

