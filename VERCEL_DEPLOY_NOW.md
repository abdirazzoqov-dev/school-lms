# 🚀 Vercel ga Deploy - HOZIR (GitHub ga Push Qilingan)

Siz GitHub ga push qilganingizdan keyin, endi Vercel ga deploy qilishingiz kerak.

---

## ✅ TAYYOR HOLAT

- ✅ Code GitHub da
- ✅ `vercel.json` fayl mavjud
- ✅ `vercel-build` script mavjud
- ✅ Prisma migrations tayyor

---

## 📋 KEYINGI QADAMLAR

### BOSQICH 1: VERCEL ACCOUNT (2 daqiqa)

1. [https://vercel.com](https://vercel.com) ga kiring
2. **Sign Up** tugmasini bosing
3. **Continue with GitHub** tugmasini bosing
4. GitHub ga ruxsat bering

✅ **Natija:** Vercel account yaratildi!

---

### BOSQICH 2: PROJECT IMPORT (3 daqiqa)

1. Vercel dashboard da **Add New...** → **Project** tugmasini bosing
2. **Import Git Repository** bo'limida GitHub repository ni tanlang
3. **Import** tugmasini bosing

**Vercel avtomatik aniqlaydi:**
- ✅ Framework: Next.js
- ✅ Build Command: `npm run vercel-build` (vercel.json dan)
- ✅ Output Directory: `.next`

**Hech narsa o'zgartirmaslik kerak!** Keyingi qadamga o'ting.

---

### BOSQICH 3: ENVIRONMENT VARIABLES (10 daqiqa) ⚠️ MUHIM!

**Deploy qilishdan OLDIN** Environment Variables qo'shishingiz kerak!

**Environment Variables** bo'limida quyidagilarni qo'shing:

#### 1. DATABASE_URL

```
Key: DATABASE_URL
Value: postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
Environment: Production, Preview, Development (barchasini tanlang)
```

⚠️ **MUHIM:** Supabase connection string (pooling mode)
⚠️ `[PASSWORD]` o'rniga Supabase parolingizni qo'ying!

#### 2. DIRECT_URL (Migrations uchun)

```
Key: DIRECT_URL
Value: postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:5432/postgres
Environment: Production, Preview, Development (barchasini tanlang)
```

#### 3. NEXTAUTH_URL

**Hozircha (keyin yangilaymiz):**
```
Key: NEXTAUTH_URL
Value: https://YOUR-PROJECT-NAME.vercel.app
Environment: Production
```

⚠️ Hozircha noto'g'ri URL, deploy bo'lgandan keyin to'g'rilaymiz!

#### 4. NEXTAUTH_SECRET

**Yangi secret yaratish:**

PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Yoki: [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)

```
Key: NEXTAUTH_SECRET
Value: [32-xonali-random-string]
Environment: Production, Preview, Development (barchasini tanlang)
```

#### 5. SUPER_ADMIN_EMAIL (Optional)

```
Key: SUPER_ADMIN_EMAIL
Value: admin@schoollms.uz
Environment: Production, Preview, Development (barchasini tanlang)
```

#### 6. SUPER_ADMIN_PASSWORD (Optional)

```
Key: SUPER_ADMIN_PASSWORD
Value: SuperAdmin123!
Environment: Production, Preview, Development (barchasini tanlang)
```

⚠️ **XAVFSIZLIK:** Production da kuchliroq parol ishlating!

#### 7. NODE_ENV (Optional)

```
Key: NODE_ENV
Value: production
Environment: Production, Preview, Development (barchasini tanlang)
```

---

### BOSQICH 4: DEPLOY! (5 daqiqa)

1. Barcha environment variables qo'shilganini tekshiring
2. **Deploy** tugmasini bosing (pastda)

⏳ **Kutish:** 3-5 daqiqa (birinchi deploy)

**Progress:**
- Installing dependencies...
- Building...
- Deploying...

---

### BOSQICH 5: NEXTAUTH_URL TO'G'RILASH (2 daqiqa)

Deploy muvaffaqiyatli bo'lgandan keyin:

1. Vercel dashboard da **Settings** → **Environment Variables** ga kiring
2. `NEXTAUTH_URL` ni toping
3. **Edit** (✏️) tugmasini bosing
4. To'g'ri URL ni kiriting (Vercel sizga bergan URL):
   ```
   https://your-actual-project-name.vercel.app
   ```
5. **Save** tugmasini bosing
6. **Deployments** tab ga qayting
7. Eng so'nggi deploy ni toping
8. **...** → **Redeploy** tugmasini bosing

---

### BOSQICH 6: TEST QILISH (3 daqiqa)

1. Vercel URL ni browser da oching
2. Login sahifasiga kiring
3. Super Admin credentials bilan login qiling:
   - **Email:** `admin@schoollms.uz`
   - **Password:** `SuperAdmin123!` (yoki o'z parolingiz)

✅ **Natija:** Login muvaffaqiyatli bo'lishi kerak!

---

## 🎉 TAYYOR!

Loyihangiz Vercel da ishlayapti!

**Site URL:** `https://your-project-name.vercel.app`

---

## 🔄 KEYINGI O'ZGARISHLAR

Har safar GitHub ga push qilsangiz, Vercel **avtomatik** deploy qiladi!

```bash
git add .
git commit -m "Yangi feature"
git push

# Vercel avtomatik deploy qiladi! ✅
```

---

## 🆘 MUAMMOLAR BO'LSA

### Build Xatolik

1. Vercel dashboard → **Deployments** → Eng so'nggi deploy
2. **Build Logs** ni ko'ring
3. Xatolikni toping va tuzating
4. GitHub ga push qiling (avtomatik redeploy)

### Database Connection Error

- `DATABASE_URL` to'g'ri ekanligini tekshiring
- Supabase da database ishlayotganligini tekshiring
- Pooling mode ishlatayotganligingizni tekshiring

### NEXTAUTH Error

- `NEXTAUTH_URL` to'g'ri ekanligini tekshiring (https:// bilan)
- `NEXTAUTH_SECRET` 32 xonali ekanligini tekshiring

---

## 📚 QO'SHIMCHA MA'LUMOT

- To'liq qo'llanma: `VERCEL_DEPLOY_COMPLETE.md`
- Tezkor qo'llanma: `VERCEL_QUICK_DEPLOY.md`
- Qadam-ba-qadam: `VERCEL_DEPLOY_STEP_BY_STEP.md`

---

**Oxirgi yangilanish:** 2024-12-08

