# 🎯 Supabase Connection - Aniq Qadamlar

## 📍 Hozirgi Holat:
- ✅ Supabase dashboard dasiz
- ✅ Project active (green dot)
- ✅ "Connect" tugmasi ko'rinayapti

---

# ✅ ANIQ QADAMLAR

## BOSQICH 1: CONNECTION STRINGS OLISH (3 daqiqa)

### 1.1 - "Connect" Tugmasini Bosing

Dashboard da **yuqori o'ng tarafda** "Connect" tugmasini bosing.

Yoki:
- **Settings** (⚙️) → **Database** → **Connection string** bo'limiga kiring

### 1.2 - Connection Modal Ochiladi

Modal da quyidagilar ko'rinadi:
- **Connection String** tab (tanlangan)
- **Method** dropdown
- **Type** dropdown
- Connection string ko'rsatiladi

### 1.3 - Pooling Connection (DATABASE_URL)

1. **Method** dropdown da:
   - **"Connection pooling"** ni tanlang
2. **Type** dropdown da:
   - **"URI"** ni tanlang
3. Connection string ko'rinadi:
   ```
   postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
4. **Copy** tugmasini bosing

📋 **Bu `DATABASE_URL` bo'ladi!**

⚠️ **MUHIM:** `[YOUR-PASSWORD]` o'rniga Supabase da yaratgan parolingizni qo'ying!

### 1.4 - Session Mode Connection (DIRECT_URL)

1. **Method** dropdown da:
   - **"Session mode"** ni tanlang
2. **Type** dropdown da:
   - **"URI"** ni tanlang
3. Connection string ko'rinadi:
   ```
   postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres
   ```
4. **Copy** tugmasini bosing

📋 **Bu `DIRECT_URL` bo'ladi!**

⚠️ **MUHIM:** `[YOUR-PASSWORD]` o'rniga Supabase da yaratgan parolingizni qo'ying!

---

## BOSQICH 2: .ENV FAYLNI YANGILASH (2 daqiqa)

### 2.1 - .env Faylini Ochish

VS Code da `.env` faylni oching.

### 2.2 - To'liq Content (Copy-Paste)

`.env` faylning **BARCHA CONTENT** ni o'chirib, quyidagini qo'ying:

```env
# Supabase Connection (Pooling)
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Session Mode)
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"

# Super Admin
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**MUHIM:**
- `pgkzjfacqntzsgcoqvhk` → Sizning project ID (Supabase dan)
- `Just2003` → Supabase parolingiz (Supabase da yaratgan)
- `aws-0-singapore` → Sizning region (Supabase dan)

### 2.3 - Saqlash

`Ctrl+S` bosing.

---

## BOSQICH 3: PRISMA DB PUSH (5 daqiqa)

### 3.1 - Terminal Ochish

VS Code da yangi terminal oching (`Ctrl+``).

### 3.2 - Prisma db push

```powershell
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
✔ The database is now in sync with your schema.
```

✅ **Tayyor!** Schema Supabase ga yuklandi.

---

## BOSQICH 4: MA'LUMOTLARNI IMPORT (10 daqiqa)

### 4.1 - SQL Editor ga Kiring

Supabase dashboard da:
- **Chap sidebar da** **SQL Editor** ikonkasini bosing
- Yoki **SQL Editor** ni qidiring

### 4.2 - backup.sql Faylini Copy Qilish

1. VS Code da `backup.sql` faylni oching
2. **BARCHA CONTENT** ni select qiling (`Ctrl+A`)
3. **Copy** qiling (`Ctrl+C`)

### 4.3 - SQL Editor ga Paste Qilish

1. Supabase SQL Editor da:
   - **New query** tugmasini bosing
   - **Paste** qiling (`Ctrl+V`)
2. **Run** tugmasini bosing (yoki `F5`)

⏳ 2-5 daqiqa kutish...

**Kutilayotgan natija:**
```
Success. No rows returned
```

✅ **Tayyor!** Ma'lumotlar import qilindi.

---

## BOSQICH 5: TEKSHIRISH (3 daqiqa)

### 5.1 - Prisma Studio

```powershell
npm run db:studio
```

Brauzerda: http://localhost:5555

- **Tenant** jadvalini oching
- Ma'lumotlar borligini tekshiring

### 5.2 - Local Test

```powershell
npm run dev
```

Brauzerda: http://localhost:3000

- Login qiling
- Ma'lumotlar ko'rinishini tekshiring

✅ **Tayyor!** Hammasi ishlayapti!

---

# 🔧 AGAR CONNECTION ERROR BO'LSA

## Muammo: Port 5432 Connection Error

**Yechim:**
`DIRECT_URL` da ham pooler port ishlatish:

```env
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

## Muammo: Can't Reach Database Server

**Yechimlar:**

1. **Supabase project active ekanligini tekshiring**
   - Dashboard da green dot ko'rinishi kerak
   - Pause qilinmagan bo'lishi kerak

2. **Connection string format tekshirish**
   - `postgresql://` bilan boshlanadi
   - Parol to'g'ri
   - Project ID to'g'ri

3. **Internet connection tekshirish**
   ```powershell
   ping aws-0-singapore.pooler.supabase.com
   ```

---

# ✅ FINAL CHECKLIST

- [ ] Supabase dan connection strings olindi (Pooling + Session)
- [ ] .env fayl to'g'ri format
- [ ] Parol to'g'ri (Supabase dan)
- [ ] Schema push qilindi
- [ ] Ma'lumotlar import qilindi
- [ ] Test qilindi

---

# 🚀 KEYINGI QADAM: VERCEL DEPLOY

Endi Vercel ga deploy qilish vaqti!

**Batafsil:** `DOCKER_TO_VERCEL_DEPLOY.md` faylning **BOSQICH 4 va 5** qismlariga qarang.

---

**Eng muhimi: Supabase dan connection string larni to'g'ridan-to'g'ri copy qiling va parolni to'g'ri qo'ying!** 😊

