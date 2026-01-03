# ⚡ HOZIRGI MUAMMONI HAL QILISH (2 daqiqa)

Rasmda ko'rinib turibdiki, Supabase ga ulanishga harakat qilmoqda va xato berayapti.

**Muammo:** `.env` faylda hali ham Supabase connection string bor.

---

# ✅ TEZKOR YECHIM

## 1️⃣ .env Faylni Yangilash (30 soniya)

`.env` faylni oching va `DATABASE_URL` ni quyidagicha o'zgartiring:

**ESKI (Supabase - xato):**
```env
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@db.pgkzjfacqntzsgcoqvhk.supabase.co:5432/postgres"
```

**YANGI (Lokal Docker - to'g'ri):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"
```

**Yoki butun .env fayl:**

```env
# ============================================
# DATABASE CONFIGURATION (LOCAL DOCKER)
# ============================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"

# ============================================
# AUTHENTICATION
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"

# ============================================
# SUPER ADMIN
# ============================================
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV="development"
```

**MUHIM:** Port `5433` (docker-compose.yml da 5433:5432)

---

## 2️⃣ Prisma Client Generate (30 soniya)

```powershell
npm run db:generate
```

---

## 3️⃣ Schema Push (30 soniya)

```powershell
npx prisma db push
```

---

## 4️⃣ Dev Server Qayta Ishga Tushirish (30 soniya)

1. **Hozirgi server ni to'xtating** (`Ctrl+C`)
2. **Qayta ishga tushiring:**

```powershell
npm run dev
```

---

## 5️⃣ Brauzerda Tekshirish

http://localhost:3000/login

- Login qiling
- Xato yo'qolishi kerak
- Dashboard ochilishi kerak

✅ **Tayyor!**

---

# 🔄 AVVALGI O'ZGARISHLARNI SAQLASH

Agar Supabase da ma'lumotlar bo'lsa va ularni saqlab qolmoqchi bo'lsangiz:

1. **Supabase Dashboard** → **SQL Editor**
2. Quyidagi SQL ni run qiling (har bir jadval uchun):

```sql
-- Tenant jadvalini ko'rish
SELECT * FROM "Tenant";

-- User jadvalini ko'rish
SELECT * FROM "User";

-- Va hokazo...
```

3. **Yoki** Supabase Dashboard → **Database** → **Backups** dan backup oling.

---

**Batafsil:** `LOCAL_SETUP_COMPLETE.md` ga qarang.

