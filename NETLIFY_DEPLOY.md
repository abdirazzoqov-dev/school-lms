# 🚀 Netlify ga Deploy Qilish - To'liq Qo'llanma

Bu qo'llanma sizga GitHub orqali Netlify ga deploy qilishni o'rgatadi.

---

## 📋 TALABLAR

1. ✅ GitHub account
2. ✅ Netlify account (bepul)
3. ✅ PostgreSQL database (Supabase, Neon.tech, yoki boshqa)
4. ✅ Loyiha GitHub ga push qilingan

---

## BOSQICH 1: GITHUB GA PUSH QILISH (5 daqiqa)

### 1.1 - Git Repository Yaratish (agar yo'q bo'lsa)

```bash
# Git init (agar yo'q bo'lsa)
git init

# Barcha fayllarni qo'shish
git add .

# Birinchi commit
git commit -m "Initial commit - Ready for Netlify deployment"
```

### 1.2 - GitHub Repository Yaratish

1. [GitHub.com](https://github.com) ga kiring
2. **New repository** tugmasini bosing
3. Repository nomini kiriting (masalan: `school-lms`)
4. **Create repository** tugmasini bosing

### 1.3 - Code Push Qilish

```bash
# GitHub repository URL ni qo'shing
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Branch nomini main ga o'zgartiring (agar kerak bo'lsa)
git branch -M main

# Code push qiling
git push -u origin main
```

✅ **Natija:** Code GitHub da!

---

## BOSQICH 2: DATABASE TAYYORLASH (10 daqiqa)

### 2.1 - Supabase Database Yaratish (Tavsiya etiladi)

1. [Supabase.com](https://supabase.com) ga kiring
2. **Start your project** tugmasini bosing
3. Project yarating:
   - Organization: Yaratib oling
   - Project name: `school-lms-production`
   - Database password: Kuchli parol yarating
   - Region: Eng yaqin regionni tanlang
4. **Create new project** tugmasini bosing

⏳ **Kutish:** 2-3 daqiqa (database yaratilmoqda)

### 2.2 - Connection String Olish

1. Supabase dashboard da **Project Settings** → **Database** ga kiring
2. **Connection string** bo'limida **URI** ni tanlang
3. **Pooling mode** (Session mode) ni tanlang
4. Connection string ni **copy qiling** 📋

**Ko'rinishi:**
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 2.3 - Database Schema Yuklash

**Variant A: Prisma Migrations (Tavsiya etiladi)**

```bash
# Local .env faylga database URL ni qo'ying
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:5432/postgres"

# Schema yuklash
npx prisma db push

# Migration yaratish (production uchun)
npx prisma migrate dev --name init
```

**Variant B: SQL File Import**

Agar sizda `backup.sql` fayl bo'lsa:

1. Supabase dashboard → **SQL Editor**
2. **New query** tugmasini bosing
3. SQL fayl content ni paste qiling
4. **Run** tugmasini bosing (F5)

### 2.4 - Seed Data (Optional)

```bash
# Demo ma'lumotlar yuklash
npm run db:seed
```

✅ **Natija:** Database tayyor!

---

## BOSQICH 3: NETLIFY ACCOUNT (2 daqiqa)

### 3.1 - Account Yaratish

1. [Netlify.com](https://netlify.com) ga kiring
2. **Sign up** tugmasini bosing
3. **Continue with GitHub** tugmasini bosing
4. GitHub ga ruxsat bering

✅ **Natija:** Netlify account yaratildi!

---

## BOSQICH 4: NETLIFY GA PROJECT QO'SHISH (5 daqiqa)

### 4.1 - GitHub Repository ni Tanlash

1. Netlify dashboard da **Add new site** → **Import an existing project** tugmasini bosing
2. **GitHub** ni tanlang
3. GitHub ga ruxsat bering (agar kerak bo'lsa)
4. Repository ni tanlang (`school-lms` yoki o'z nomingiz)

### 4.2 - Build Settings

Netlify avtomatik detect qiladi:
- ✅ **Framework preset:** Next.js
- ✅ **Build command:** `npm run netlify-build` (netlify.toml dan)
- ✅ **Publish directory:** `.next` (netlify.toml dan)

**Hech narsa o'zgartirmaslik kerak!** ✅

### 4.3 - Deploy Qilish (Hozircha Environment Variables siz)

**Deploy** tugmasini bosing (pastda).

⏳ **Kutish:** 2-3 daqiqa (birinchi deploy)

⚠️ **Xatolik ko'rinadi** - Bu normal! Environment variables yo'q.

✅ **Natija:** Project Netlify ga qo'shildi!

---

## BOSQICH 5: ENVIRONMENT VARIABLES (10 daqiqa)

### 5.1 - Site Settings ga Kiring

1. Netlify dashboard → Sizning site → **Site settings**
2. **Environment variables** bo'limiga kiring
3. **Add a variable** tugmasini bosing

### 5.2 - Zaruriy Environment Variables Qo'shish

Quyidagi variables larni **barchasini** qo'shing:

#### 1. DATABASE_URL

```
Key: DATABASE_URL
Value: postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
Scopes: Production, Deploy Previews, Branch deploys (barchasi)
```

⚠️ **MUHIM:** `[PASSWORD]` o'rniga Supabase parolingizni qo'ying!

#### 2. DIRECT_URL (Migrations uchun)

```
Key: DIRECT_URL
Value: postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:5432/postgres
Scopes: Production, Deploy Previews, Branch deploys (barchasi)
```

#### 3. NEXTAUTH_URL

**Hozircha:**
```
Key: NEXTAUTH_URL
Value: https://YOUR-SITE-NAME.netlify.app
Scopes: Production
```

⚠️ **MUHIM:** `YOUR-SITE-NAME` o'rniga Netlify sizga bergan site nomini qo'ying!

**Masalan:**
```
https://school-lms-abc123.netlify.app
```

#### 4. NEXTAUTH_SECRET

**Yangi secret yaratish:**

PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Yoki online: [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

```
Key: NEXTAUTH_SECRET
Value: [32-xonali-random-string]
Scopes: Production, Deploy Previews, Branch deploys (barchasi)
```

#### 5. SUPER_ADMIN_EMAIL (Optional)

```
Key: SUPER_ADMIN_EMAIL
Value: admin@schoollms.uz
Scopes: Production, Deploy Previews, Branch deploys (barchasi)
```

#### 6. SUPER_ADMIN_PASSWORD (Optional)

```
Key: SUPER_ADMIN_PASSWORD
Value: SuperAdmin123!
Scopes: Production, Deploy Previews, Branch deploys (barchasi)
```

⚠️ **XAVFSIZLIK:** Production da kuchliroq parol ishlating!

#### 7. NODE_ENV

```
Key: NODE_ENV
Value: production
Scopes: Production, Deploy Previews, Branch deploys (barchasi)
```

### 5.3 - Variables ni Saqlash

Har bir variable ni qo'shgandan keyin **Save** tugmasini bosing.

✅ **Natija:** Barcha environment variables qo'shildi!

---

## BOSQICH 6: QAYTA DEPLOY (5 daqiqa)

### 6.1 - Trigger New Deploy

1. Netlify dashboard → Sizning site
2. **Deploys** tab ga kiring
3. **Trigger deploy** → **Deploy site** tugmasini bosing

⏳ **Kutish:** 3-5 daqiqa (build vaqt)

### 6.2 - Build Loglarni Tekshirish

**Deploys** bo'limida build loglarni ko'rishingiz mumkin.

**Kutilayotgan natija:**
```
✔ Prisma Client generated
✔ Database migrations applied
✔ Next.js build completed
✔ Site deployed successfully
```

### 6.3 - Site URL ni Olish

Build muvaffaqiyatli bo'lgandan keyin:

1. **Site overview** ga qayting
2. **Site URL** ni ko'rasiz:
   ```
   https://YOUR-SITE-NAME.netlify.app
   ```

Bu URL ni **copy qiling!** 📋

---

## BOSQICH 7: NEXTAUTH_URL NI TO'G'RILASH (2 daqiqa)

Agar NEXTAUTH_URL noto'g'ri bo'lsa:

1. **Site settings** → **Environment variables**
2. `NEXTAUTH_URL` ni toping
3. **Edit** (✏️) tugmasini bosing
4. To'g'ri URL ni kiriting:
   ```
   https://YOUR-ACTUAL-SITE-NAME.netlify.app
   ```
5. **Save** tugmasini bosing
6. **Trigger deploy** → **Deploy site** qayta deploy qiling

---

## BOSQICH 8: TEST QILISH (5 daqiqa)

### 8.1 - Site Ochish

1. Netlify site URL ni browser da oching
2. Site yuklanishini kuting

### 8.2 - Login Test

1. **Login** sahifasiga kiring
2. Super Admin credentials bilan login qiling:
   - **Email:** `admin@schoollms.uz`
   - **Password:** `SuperAdmin123!` (yoki o'z parolingiz)

✅ **Natija:** Login muvaffaqiyatli bo'lishi kerak!

### 8.3 - Xatoliklarni Tekshirish

Agar xatolik bo'lsa:

1. Netlify dashboard → **Functions** → **Function logs**
2. Yoki browser console da xatoliklarni ko'ring
3. Environment variables to'g'ri ekanligini tekshiring

---

## BOSQICH 9: CUSTOM DOMAIN (Optional - 10 daqiqa)

### 9.1 - Domain Qo'shish

1. Netlify dashboard → **Domain settings**
2. **Add custom domain** tugmasini bosing
3. Domain nomini kiriting (masalan: `schoollms.uz`)
4. **Verify** tugmasini bosing

### 9.2 - DNS Sozlash

DNS provider da (GoDaddy, Namecheap, va boshqalar):

**A Record:**
```
Type: A
Name: @
Value: 75.2.60.5
```

**CNAME Record:**
```
Type: CNAME
Name: www
Value: YOUR-SITE-NAME.netlify.app
```

⏳ **Kutish:** 24 soatgacha (odatda 1-2 soat)

### 9.3 - SSL Certificate

Netlify avtomatik SSL certificate yaratadi (Let's Encrypt).

✅ **Natija:** HTTPS ishlaydi!

---

## 📝 AVTOMATIK DEPLOYMENT

GitHub ga push qilganda Netlify avtomatik deploy qiladi!

### Workflow:

```bash
# 1. O'zgarish qilasiz
git add .
git commit -m "Yangi feature qo'shildi"
git push

# 2. Netlify AVTOMATIK:
# ✅ GitHub dan code pull qiladi
# ✅ Dependencies install qiladi
# ✅ Build qiladi
# ✅ Deploy qiladi
# ✅ 3-5 daqiqadan keyin LIVE!
```

**Netlify dashboard da:**
- **Deploys** bo'limida barcha deployment larni ko'rasiz
- **Production deploy** avtomatik yangilanadi
- **Branch deploys** har bir branch uchun alohida deploy yaratadi

---

## 🔧 MUAMMOLARNI HAL QILISH

### 1. Build Xatolik: "Prisma Client not found"

**Yechim:**
- `netlify.toml` da build command to'g'ri ekanligini tekshiring
- `package.json` da `netlify-build` script borligini tekshiring

### 2. Database Connection Error

**Yechim:**
- `DATABASE_URL` to'g'ri ekanligini tekshiring
- Supabase da database ishlayotganligini tekshiring
- Pooling mode ishlatayotganligingizni tekshiring

### 3. NEXTAUTH Error

**Yechim:**
- `NEXTAUTH_URL` to'g'ri ekanligini tekshiring (https:// bilan boshlanishi kerak)
- `NEXTAUTH_SECRET` yaratilganligini tekshiring (32 xonali)

### 4. 404 Error (Sahifalar topilmaydi)

**Yechim:**
- `netlify.toml` da Next.js plugin qo'shilganligini tekshiring
- Build log da xatoliklar bo'lishi mumkin

### 5. Environment Variables Ishlamayapti

**Yechim:**
- Netlify dashboard da variables qo'shilganligini tekshiring
- **Redeploy** qiling (environment variables deploy paytida yuklanadi)

---

## 📊 NETLIFY FUNCTIONS

Netlify Next.js plugin avtomatik Next.js API routes ni Netlify Functions ga aylantiradi.

**Hech narsa qo'shimcha qilish shart emas!** ✅

---

## 💰 NETLIFY NARXLARI

### Free Plan (Bepul):
- ✅ 100 GB bandwidth/oy
- ✅ 300 build minutes/oy
- ✅ Unlimited sites
- ✅ SSL certificates
- ✅ Custom domains
- ✅ Form handling (100 submissions/oy)

### Pro Plan ($19/oy):
- ✅ 1 TB bandwidth/oy
- ✅ 1000 build minutes/oy
- ✅ Advanced analytics
- ✅ Password protection
- ✅ Branch deploys

**Kichik va o'rta loyihalar uchun Free plan yetarli!** ✅

---

## ✅ CHECKLIST

Deploy dan oldin:

- [ ] GitHub ga push qilingan
- [ ] Database yaratilgan va schema yuklangan
- [ ] `netlify.toml` fayl mavjud
- [ ] `package.json` da `netlify-build` script mavjud
- [ ] Netlify account yaratilgan
- [ ] GitHub repository Netlify ga ulangan
- [ ] Barcha environment variables qo'shilgan
- [ ] Build muvaffaqiyatli
- [ ] Site ishlayapti
- [ ] Login test muvaffaqiyatli

---

## 🎉 TAYYOR!

Loyihangiz Netlify da ishlayapti!

**Keyingi qadamlar:**
1. Custom domain qo'shing (ixtiyoriy)
2. Production da kuchli parollar ishlating
3. Backup strategiyani sozlang
4. Monitoring qo'shing (Sentry, LogRocket)

---

## 📞 YORDAM

Muammo bo'lsa:
1. Netlify dashboard → **Support**
2. Build logs ni tekshiring
3. Environment variables ni tekshiring
4. GitHub Issues da savol bering

---

**Oxirgi yangilanish:** 2024-12-08
**Versiya:** 1.0.0

