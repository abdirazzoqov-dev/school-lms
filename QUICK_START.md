# 🚀 Tezkor Boshlash - Online Database bilan

PostgreSQL o'rnatmasdan tezda ishga tushirish uchun.

## 1️⃣ Neon.tech'da bepul database yarating

### Qadamlar:

1. **Neon.tech'ga kiring:**
   - [https://neon.tech](https://neon.tech)
   - "Sign Up" → GitHub/Google bilan

2. **Yangi project yarating:**
   - "Create Project" tugmasini bosing
   - Project nomi: `school-lms`
   - Region: tanlang (eng yaqinini)
   - PostgreSQL version: 16 (default)

3. **Connection string oling:**
   - Dashboard'da connection string ko'rinadi
   - Ko'rinishi:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
   - **Nusxalab oling!** 📋

---

## 2️⃣ .env faylni sozlang

1. **`.env` fayl yarating:**

Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

2. **`.env` faylni oching va to'ldiring:**

```env
# Database (Neon.tech connection string)
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Super Admin
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**NEXTAUTH_SECRET yaratish:**

PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 3️⃣ Database schema yuklang

```bash
npm run db:push
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
✔ Schema is in sync with the database
```

---

## 4️⃣ Demo ma'lumotlar kiriting

```bash
npm run db:seed
```

**Natija:**
```
🌱 Starting seed...
✅ Super Admin created
✅ Demo Tenant created
🎉 Seed completed!
```

---

## 5️⃣ Server ishga tushiring

```bash
npm run dev
```

**Server:** [http://localhost:3000](http://localhost:3000)

---

## 6️⃣ Login qiling

### Super Admin:
- **Email:** `admin@schoollms.uz`
- **Parol:** `SuperAdmin123!`

---

## ✅ Tayyor!

Loyiha ishga tushdi! 🎉

**Keyingi qadamlar:**
- Super Admin dashboard'ni ko'ring
- Yangi maktab qo'shing
- Features qo'shishni boshlang

---

## 🔧 Muammolar?

### Database connection error

**Xato:**
```
Can't reach database server
```

**Tekshiring:**
1. DATABASE_URL to'g'ri nusxalangan
2. Internet ulanishi bor
3. Neon.tech project active

### Prisma Client error

```bash
npm run db:generate
```

---

## 📊 Database ko'rish

**Prisma Studio:**
```bash
npm run db:studio
```

Brauzerda: [http://localhost:5555](http://localhost:5555)

---

## 🎯 Production'ga deploy

### Vercel (Frontend)
1. GitHub'ga push qiling
2. Vercel.com'da import qiling
3. Environment variables qo'shing

### Database
- Neon.tech bepul plan yetarli
- Scale up kerak bo'lsa - paid plan

---

**Savollar bo'lsa, SETUP_GUIDE.md'ga qarang!**

