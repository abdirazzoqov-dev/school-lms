# ✅ PRE-DEPLOYMENT CHECKLIST

> Deploy qilishdan oldin tekshirish kerak bo'lgan narsalar ro'yxati

---

## 📋 BOSHLASH OLDIDAN

### 1. Accounts Tayyorlash
- [ ] GitHub account mavjud va tasdiqlangan
- [ ] Vercel account yaratilgan (GitHub orqali)
- [ ] Supabase account yaratilgan (GitHub orqali)

### 2. Lokal Muhit Ishlayapti
- [ ] `npm run dev` ishlayapti
- [ ] Login qilish mumkin
- [ ] Dashboard ochilayapti
- [ ] CRUD operations ishlayapti
- [ ] Ma'lumotlar to'g'ri ko'rinmoqda

---

## 🔧 KOD TAYYORLASH

### 1. Git Repository
- [ ] Git initialized: `git init`
- [ ] GitHub repository yaratilgan
- [ ] Remote qo'shilgan: `git remote add origin <url>`
- [ ] Barcha o'zgarishlar commit qilindi
- [ ] Main branch'ga push qilindi

### 2. Environment Files
- [ ] `env.example` fayl mavjud
- [ ] `.env` fayl `.gitignore` da
- [ ] `.gitignore` to'g'ri sozlangan
- [ ] Hech qanday secret Git'da yo'q

### 3. Dependencies
- [ ] `package.json` to'liq
- [ ] `package-lock.json` mavjud
- [ ] Barcha dependencies install qilingan
- [ ] `npm run build` ishlayapti (lokal test)

### 4. Prisma Schema
- [ ] `prisma/schema.prisma` to'liq
- [ ] `datasource db` da `directUrl` mavjud
- [ ] Barcha modellar to'g'ri
- [ ] Indexes qo'shilgan

### 5. Next.js Configuration
- [ ] `next.config.js` to'g'ri
- [ ] `vercel.json` mavjud va to'g'ri
- [ ] `middleware.ts` ishlayapti
- [ ] API routes to'g'ri

### 6. Build Scripts
- [ ] `scripts/vercel-build.js` mavjud
- [ ] `package.json` da `vercel-build` script bor
- [ ] `postinstall` script to'g'ri

---

## 🗄️ DATABASE TAYYORLASH

### 1. Supabase Project
- [ ] Supabase project yaratilgan
- [ ] Database password saqlangan
- [ ] Region tanlangan (Singapore)
- [ ] Project aktiv (paused emas)

### 2. Connection Strings
- [ ] Connection pooling URL olingan (port 6543)
- [ ] Direct connection URL olingan (port 5432)
- [ ] Parol to'g'ri qo'yilgan
- [ ] `pgbouncer=true` qo'shilgan

### 3. Schema Migration
- [ ] Lokal .env vaqtincha Supabase ga o'zgartirilgan
- [ ] `npx prisma generate` ishlatilgan
- [ ] `npx prisma db push` muvaffaqiyatli
- [ ] Schema Supabase'da ko'rinmoqda

### 4. Data Import (Optional)
- [ ] `backup.sql` fayl tayyorlangan
- [ ] SQL Editor orqali import qilindi
- [ ] Yoki `npm run db:seed` ishlatilgan
- [ ] Ma'lumotlar Supabase'da ko'rinmoqda

### 5. Lokal .env Qaytarish
- [ ] Lokal .env qaytarilgan
- [ ] Lokal database qayta ishlayapti
- [ ] Hech qanday muammo yo'q

---

## 🔐 ENVIRONMENT VARIABLES

### 1. Production Variables Tayyorlash

Quyidagi variables'larni tayyorlab qo'ying (text file'da):

```
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

NEXTAUTH_URL=https://your-project.vercel.app

NEXTAUTH_SECRET=[generate-new-one]

SUPER_ADMIN_EMAIL=admin@schoollms.uz

SUPER_ADMIN_PASSWORD=SuperAdmin123!
```

- [ ] `DATABASE_URL` to'g'ri (pooling)
- [ ] `DIRECT_URL` to'g'ri (direct)
- [ ] `NEXTAUTH_SECRET` yangi yaratilgan
- [ ] `NEXTAUTH_URL` placeholder (keyinroq yangilanadi)

### 2. NEXTAUTH_SECRET Yaratish

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] Yangi secret yaratildi
- [ ] Saqlandi (text file'da)
- [ ] Lokal secret bilan farq qiladi

---

## 🚀 VERCEL TAYYORLASH

### 1. Vercel Account
- [ ] Vercel account yaratilgan
- [ ] GitHub bilan bog'langan
- [ ] Dashboard ochiladi

### 2. Project Import
- [ ] GitHub repository ko'rinmoqda
- [ ] Repository tanlash mumkin
- [ ] Import qilish tayyor

### 3. Build Settings (Avtomatik)
- [ ] Framework: Next.js
- [ ] Build Command: `npm run vercel-build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm install`

---

## 📝 DOCUMENTATION

### 1. README
- [ ] `README.md` yangilangan
- [ ] Installation steps to'g'ri
- [ ] Default credentials ko'rsatilgan
- [ ] Tech stack ro'yxati to'liq

### 2. Deployment Guides
- [ ] `VERCEL_DEPLOY_FULL_GUIDE_UZ.md` mavjud
- [ ] `PRE_DEPLOYMENT_CHECKLIST.md` mavjud
- [ ] `env.example` mavjud
- [ ] Barcha qo'llanmalar yangilangan

---

## 🧪 FINAL TESTING (Lokal)

### 1. Build Test
```powershell
npm run build
```
- [ ] Build muvaffaqiyatli
- [ ] Hech qanday error yo'q
- [ ] Warnings minimal

### 2. Production Mode Test
```powershell
npm run start
```
- [ ] Production mode ishga tushdi
- [ ] Login ishlayapti
- [ ] Dashboard ochilayapti
- [ ] Barcha features ishlayapti

### 3. Linting
```powershell
npm run lint
```
- [ ] Hech qanday critical error yo'q
- [ ] Warnings acceptable

---

## 🔒 XAVFSIZLIK TEKSHIRUVI

### 1. Sensitive Data
- [ ] `.env` fayl `.gitignore` da
- [ ] Hech qanday parol kodda yo'q
- [ ] Hech qanday API key kodda yo'q
- [ ] `backup.sql` `.gitignore` da (agar sensitive data bor bo'lsa)

### 2. Git History
```powershell
git log --all --full-history --source -- .env
```
- [ ] `.env` hech qachon commit qilinmagan
- [ ] Hech qanday secret commit qilinmagan

### 3. Public Files
- [ ] `public/` faqat public assets
- [ ] Hech qanday sensitive file yo'q
- [ ] `uploads/` `.gitignore` da

---

## 📊 BACKUP

### 1. Lokal Backup
- [ ] Database backup olingan: `backup.sql`
- [ ] Kod backup qilingan (Git)
- [ ] `.env` fayl xavfsiz joyda saqlangan

### 2. Documentation Backup
- [ ] Barcha qo'llanmalar saqlangan
- [ ] Environment variables ro'yxati saqlangan
- [ ] Parollar xavfsiz joyda

---

## ✅ DEPLOY TAYYOR!

Agar barcha checkboxlar belgilangan bo'lsa:

### Keyingi Qadamlar:

1. **Vercel'ga o'ting**
   - https://vercel.com

2. **Project Import qiling**
   - GitHub repository'ni tanlang

3. **Environment Variables qo'shing**
   - Tayyorlagan variables'larni copy-paste qiling

4. **Deploy bosing!**
   - 3-5 daqiqa kutish

5. **NEXTAUTH_URL yangilang**
   - Production URL oling
   - Environment variable'ni yangilang
   - Redeploy qiling

6. **Test qiling!**
   - Login qiling
   - Barcha features'ni tekshiring

---

## 🚨 AGAR BIROR NARSA NOTO'G'RI BO'LSA

### Deploy qilmang agar:

- [ ] Lokal build ishlamayapti
- [ ] Environment variables to'liq emas
- [ ] Database connection test qilinmagan
- [ ] Git'da sensitive data bor
- [ ] Backup olinmagan

### Avval tuzating, keyin deploy qiling!

---

## 📞 YORDAM

Agar savollar bo'lsa:

1. `VERCEL_DEPLOY_FULL_GUIDE_UZ.md` ni o'qing
2. Vercel documentation: https://vercel.com/docs
3. Supabase documentation: https://supabase.com/docs

---

**Omad tilaymiz! 🚀**

Deploy muvaffaqiyatli bo'lsin!

