# 🐳 Docker Container → Vercel Deploy - Qadam-ba-Qadam

## 📋 KERAKLI NARSALAR

- ✅ Docker container ishlayapti (local PostgreSQL)
- ✅ GitHub account
- ✅ Vercel account (bepul)
- ✅ Supabase account (bepul) - Database uchun
- ✅ 1 soat vaqt

---

# BOSQICH 1: DOCKER CONTAINER DAN MA'LUMOTLARNI EXPORT QILISH (10 daqiqa)

## 1.1 - Container Status Tekshirish

Terminal da:

```bash
docker ps
```

**Kutilayotgan natija:**
```
CONTAINER ID   IMAGE                STATUS
abc123def456   postgres:16-alpine   Up 2 hours
```

Agar container ishlamayapti:
```bash
docker-compose up -d
```

---

## 1.2 - Database Backup (Export)

Docker container dan barcha ma'lumotlarni export qilish:

```bash
# Windows PowerShell
docker exec school_lms_db pg_dump -U postgres school_lms > backup.sql

# macOS/Linux
docker exec school_lms_db pg_dump -U postgres school_lms > backup.sql
```

**Kutilayotgan natija:**
```
✅ backup.sql fayl yaratildi
```

**Tekshirish:**
```bash
# Fayl hajmini ko'rish
ls -lh backup.sql

# Yoki Windows da:
dir backup.sql
```

---

## 1.3 - Backup Tekshirish

Backup fayl to'g'ri yaratilganini tekshirish:

```bash
# Fayl ichida "CREATE TABLE" borligini tekshirish
grep "CREATE TABLE" backup.sql

# Yoki Windows PowerShell:
Select-String "CREATE TABLE" backup.sql
```

**Kutilayotgan natija:**
```
CREATE TABLE "Tenant" ...
CREATE TABLE "User" ...
CREATE TABLE "Student" ...
...
```

✅ **Tayyor!** Ma'lumotlar export qilindi.

---

# BOSQICH 2: SUPABASE DATABASE YARATISH (15 daqiqa)

## 2.1 - Supabase Account Ochish

1. https://supabase.com ga kiring
2. **Start your project** tugmasini bosing
3. **Continue with GitHub** tugmasini bosing
4. GitHub ga ruxsat bering

## 2.2 - Yangi Project Yaratish

1. **New Project** tugmasini bosing
2. **Organization**: Personal (yoki yangi yarating)
3. **Name**: `school-lms-production`
4. **Database Password**: Qiyin parol yarating va **SAQLANG!** 📝

   **Misol parol:**
   ```
   SchoolLMS2025!SecurePass
   ```
   ⚠️ Bu parolni **albatta saqlang** - keyin kerak bo'ladi!

5. **Region**: Singapore (O'zbekistonga yaqin)
6. **Pricing Plan**: Free
7. **Create new project** tugmasini bosing

⏳ 2-3 daqiqa kutish kerak (database yaratilmoqda...)

---

## 2.3 - Database Connection String Olish

Project tayyor bo'lgach:

1. Chap tarafdagi **Settings** (⚙️) tugmasini bosing
2. **Database** bo'limini tanlang
3. **Connection string** bo'limida:
   - **Connection pooling** ni tanlang (muhim!)
   - **URI** ni tanlang
   - **Copy** tugmasini bosing

**Connection string ko'rinishi:**
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

📋 **Nusxalab oling!**

---

## 2.4 - Direct Connection String (Migrations uchun)

**Yana bir connection string kerak** (migrations uchun):

1. **Connection string** bo'limida:
   - **Session mode** ni tanlang (pooling emas!)
   - **URI** ni tanlang
   - **Copy** tugmasini bosing

**Direct connection string:**
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres
```

📋 **Bu ham nusxalab oling!**

---

# BOSQICH 3: MA'LUMOTLARNI SUPABASE GA IMPORT QILISH (15 daqiqa)

## 3.1 - Local .env Fayl Yangilash

`.env` faylini oching va yangilang:

```env
# Supabase Connection (Pooling - Production uchun)
DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Migrations uchun)
DIRECT_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres"
```

**MUHIM:** `[YOUR-PASSWORD]` o'rniga Supabase da yaratgan parolingizni qo'ying!

---

## 3.2 - Prisma Schema Yangilash

`prisma/schema.prisma` faylini oching va yangilang:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Connection pooling
  directUrl = env("DIRECT_URL")        // Direct connection (migrations)
}
```

Agar `directUrl` yo'q bo'lsa, qo'shing!

---

## 3.3 - Database Schema Push Qilish

Supabase ga schema yuklash:

```bash
# 1. Prisma Client generate
npm run db:generate

# 2. Schema push (Supabase ga)
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
✔ The database is now in sync with your schema.
```

---

## 3.4 - Ma'lumotlarni Import Qilish

Docker dan export qilgan ma'lumotlarni Supabase ga import qilish:

**Variant 1: psql orqali (Tavsiya)**

```bash
# Supabase connection string bilan
psql "postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres" < backup.sql
```

**Agar psql o'rnatilmagan bo'lsa:**

**Variant 2: Supabase SQL Editor orqali**

1. Supabase dashboard da:
   - **SQL Editor** bo'limini oching
   - **New query** tugmasini bosing

2. `backup.sql` faylini oching va **barcha content** ni copy qiling

3. SQL Editor ga paste qiling va **Run** tugmasini bosing

⏳ 2-5 daqiqa kutish kerak (ma'lumotlar import qilinmoqda...)

---

## 3.5 - Ma'lumotlarni Tekshirish

Supabase da ma'lumotlar to'g'ri import qilinganini tekshirish:

1. Supabase dashboard da:
   - **Table Editor** bo'limini oching
   - **Tenant** jadvalini oching
   - Ma'lumotlar borligini tekshiring

Yoki Prisma Studio orqali:

```bash
npm run db:studio
```

Brauzerda: http://localhost:5555

✅ **Tayyor!** Ma'lumotlar Supabase ga ko'chirildi.

---

# BOSQICH 4: GITHUB GA YUKLASH (5 daqiqa)

## 4.1 - .gitignore Tekshirish

Terminal da:

```bash
cat .gitignore
```

Quyidagilar borligini tekshiring:
```
.env
.env.local
.env.production
node_modules/
.next/
backup.sql
```

Agar `backup.sql` yo'q bo'lsa, qo'shing! (Xavfsizlik uchun)

---

## 4.2 - Git Status Tekshirish

```bash
git status
```

Agar `.env` yoki `backup.sql` ko'rsatilsa, `.gitignore` ni tekshiring!

---

## 4.3 - GitHub ga Push

```bash
# 1. Barcha o'zgarishlarni qo'shish
git add .

# 2. Commit
git commit -m "Ready for Vercel deployment with Supabase"

# 3. Push
git push origin main
```

✅ **Tayyor!** Kodingiz GitHub da.

---

# BOSQICH 5: VERCEL GA DEPLOY (20 daqiqa)

## 5.1 - Vercel Account Ochish

1. https://vercel.com ga kiring
2. **Sign Up** tugmasini bosing
3. **Continue with GitHub** tugmasini bosing
4. GitHub ga ruxsat bering

## 5.2 - Project Import Qilish

1. **Add New...** → **Project** tugmasini bosing
2. **Import Git Repository** bo'limida:
   - GitHub repository ni tanlang (`school-lms`)
   - **Import** tugmasini bosing

## 5.3 - Project Settings

Vercel avtomatik sozlamalarni aniqlaydi:

- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` ✅
- **Build Command**: `npm run vercel-build` ✅
- **Output Directory**: `.next` ✅

**O'zgartirish shart emas!** Keyingi qadamga o'ting.

---

## 5.4 - Environment Variables Qo'shish

**MUHIM!** Environment variables qo'shishdan oldin:

1. **Environment Variables** bo'limini oching
2. Quyidagi o'zgaruvchilarni qo'shing:

### Database:

```
Name: DATABASE_URL
Value: postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
Environment: Production, Preview, Development (hammasini tanlang)
```

```
Name: DIRECT_URL
Value: postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres
Environment: Production, Preview, Development (hammasini tanlang)
```

### NextAuth:

```
Name: NEXTAUTH_URL
Value: https://your-project.vercel.app
Environment: Production
```

```
Name: NEXTAUTH_URL
Value: https://your-project-git-main-your-username.vercel.app
Environment: Preview
```

```
Name: NEXTAUTH_URL
Value: http://localhost:3000
Environment: Development
```

```
Name: NEXTAUTH_SECRET
Value: [Local .env dan oling yoki yangi generate qiling]
Environment: Production, Preview, Development (hammasini tanlang)
```

**NEXTAUTH_SECRET generate qilish:**

PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

macOS/Linux:
```bash
openssl rand -base64 32
```

### Super Admin (Optional):

```
Name: SUPER_ADMIN_EMAIL
Value: admin@schoollms.uz
Environment: Production, Preview, Development
```

```
Name: SUPER_ADMIN_PASSWORD
Value: SuperAdmin123!
Environment: Production, Preview, Development
```

⚠️ **MUHIM:** Production da parollarni o'zgartiring!

---

## 5.5 - Deploy!

1. **Deploy** tugmasini bosing

⏳ 3-5 daqiqa kutish kerak (build va deploy...)

**Build jarayoni:**
```
✓ Installing dependencies
✓ Running "prisma generate"
✓ Running "prisma migrate deploy"
✓ Running "next build"
✓ Deploying...
```

✅ **Tayyor!** Loyiha deploy qilindi!

---

## 5.6 - Deploy Natijasini Tekshirish

1. Vercel dashboard da:
   - **Visit** tugmasini bosing
   - Brauzerda loyiha ochiladi

2. Login qiling:
   - **Email:** `admin@schoollms.uz` (yoki Supabase dan import qilingan)
   - **Parol:** Docker dan import qilingan parol

✅ **Ishlayapti!** 🎉

---

# BOSQICH 6: POST-DEPLOYMENT (10 daqiqa)

## 6.1 - Domain Sozlash (Optional)

Agar custom domain kerak bo'lsa:

1. Vercel dashboard da:
   - **Settings** → **Domains**
   - **Add Domain** tugmasini bosing
   - Domain nomini kiriting
   - DNS sozlamalarini qo'shing

---

## 6.2 - Environment Variables Yangilash

Agar custom domain qo'shgan bo'lsangiz:

1. **Environment Variables** bo'limida:
   - `NEXTAUTH_URL` ni yangilang:
   ```
   https://yourdomain.com
   ```

---

## 6.3 - Database Connection Tekshirish

Vercel da loyiha ishlayotganini tekshirish:

1. Brauzerda loyihani oching
2. Login qiling
3. Dashboard ochilishini tekshiring
4. Ma'lumotlar ko'rinishini tekshiring

Agar xatolik bo'lsa:
- Vercel dashboard da **Logs** bo'limini tekshiring
- Database connection xatolarini qidiring

---

# ✅ TAYYOR!

## Nima qildik:

1. ✅ Docker container dan ma'lumotlarni export qildik
2. ✅ Supabase database yaratdik
3. ✅ Ma'lumotlarni Supabase ga import qildik
4. ✅ GitHub ga push qildik
5. ✅ Vercel ga deploy qildik
6. ✅ Environment variables sozladik

---

# 🔧 MUAMMOLAR VA YECHIMLAR

## 1. Database Connection Error

**Xato:**
```
Can't reach database server
```

**Yechim:**
1. Supabase dashboard da project active ekanligini tekshiring
2. `DATABASE_URL` to'g'ri nusxalanganligini tekshiring
3. Parol to'g'ri ekanligini tekshiring
4. Connection pooling enabled ekanligini tekshiring

---

## 2. Prisma Migrate Error

**Xato:**
```
Migration failed
```

**Yechim:**
1. `DIRECT_URL` environment variable qo'shilganligini tekshiring
2. `prisma/schema.prisma` da `directUrl` borligini tekshiring
3. Supabase da database bo'sh emasligini tekshiring (ma'lumotlar bor)

**Agar muammo bo'lsa:**
```bash
# Local da tekshirish
npx prisma migrate status
```

---

## 3. Build Error

**Xato:**
```
Build failed
```

**Yechim:**
1. Vercel dashboard da **Logs** bo'limini oching
2. Xatolikni toping
3. Ko'pincha `NEXTAUTH_SECRET` yo'q bo'lishi mumkin

---

## 4. Ma'lumotlar Ko'rinmayapti

**Yechim:**
1. Supabase dashboard da **Table Editor** da ma'lumotlar borligini tekshiring
2. Vercel da `DATABASE_URL` to'g'ri ekanligini tekshiring
3. Browser console da xatoliklar bor-yo'qligini tekshiring

---

# 📊 DEPLOYMENT CHECKLIST

## Pre-Deployment:
- [ ] Docker container ishlayapti
- [ ] Backup.sql yaratildi
- [ ] Supabase project yaratildi
- [ ] Ma'lumotlar import qilindi
- [ ] Prisma schema yangilandi (directUrl qo'shildi)
- [ ] GitHub ga push qilindi

## Deployment:
- [ ] Vercel account ochildi
- [ ] Project import qilindi
- [ ] Environment variables qo'shildi:
  - [ ] DATABASE_URL
  - [ ] DIRECT_URL
  - [ ] NEXTAUTH_URL (Production, Preview, Development)
  - [ ] NEXTAUTH_SECRET
- [ ] Deploy qilindi

## Post-Deployment:
- [ ] Login ishlayapti
- [ ] Ma'lumotlar ko'rinayapti
- [ ] Database connection ishlayapti
- [ ] Custom domain sozlandi (optional)

---

# 🎯 KEYINGI QADAMLAR

## 1. Monitoring

Vercel dashboard da:
- **Analytics** - Traffic monitoring
- **Logs** - Error tracking
- **Deployments** - Build history

## 2. Backup Strategy

Supabase da:
- **Database Backups** - Automatic backups
- **Manual backup** - pg_dump orqali

## 3. Scaling

Agar ko'p foydalanuvchi bo'lsa:
- Supabase Pro plan (paid)
- Vercel Pro plan (paid)
- Connection pooling optimization

---

# 📝 XULOSA

**Loyiha muvaffaqiyatli deploy qilindi!** 🚀

**URL:** https://your-project.vercel.app

**Database:** Supabase (Cloud)

**Status:** Production-ready ✅

---

**Savollar bo'lsa, so'rang!** 😊
