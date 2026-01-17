# ⚡ TEZKOR BOSHLASH - Vercel Deploy (5 Daqiqa)

> Eng muhim qadamlar - tez va oson

---

## 🎯 3 TA ASOSIY QADAM

### 1️⃣ SUPABASE DATABASE (10 daqiqa)

#### A. Account va Project
1. https://supabase.com → **Sign up with GitHub**
2. **New Project**:
   - Name: `school-lms-production`
   - Password: `SchoolLMS2026!Secure#123` (yoki o'zingizniki)
   - Region: **Singapore**
   - **Create project**

#### B. Connection Strings
1. **Settings** → **Database** → **Connection string**
2. **Connection pooling** tab → Copy URL:
   ```
   postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
3. **Session pooling** tab → Copy URL:
   ```
   postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

#### C. Schema Yuklash
```powershell
# .env faylni vaqtincha yangilang
DATABASE_URL="[yuqoridagi pooling URL]"
DIRECT_URL="[yuqoridagi session URL]"

# Schema push
npx prisma generate
npx prisma db push

# Ma'lumotlarni yuklash (optional)
npm run db:seed
```

---

### 2️⃣ VERCEL DEPLOY (5 daqiqa)

#### A. Account va Import
1. https://vercel.com → **Sign up with GitHub**
2. **Add New Project**
3. **Import** `school-lms` repository

#### B. Environment Variables
**Settings → Environment Variables → Add:**

| Name | Value | Env |
|------|-------|-----|
| `DATABASE_URL` | [Supabase pooling URL] | All |
| `DIRECT_URL` | [Supabase session URL] | All |
| `NEXTAUTH_URL` | `https://temp.vercel.app` | Production |
| `NEXTAUTH_SECRET` | [yangi secret] | All |
| `SUPER_ADMIN_EMAIL` | `admin@schoollms.uz` | All |
| `SUPER_ADMIN_PASSWORD` | `SuperAdmin123!` | All |

**NEXTAUTH_SECRET yaratish:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### C. Deploy
**Deploy** tugmasini bosing → 3-5 daqiqa kutish

---

### 3️⃣ FINALIZE (2 daqiqa)

#### A. URL Olish
Deploy tugagach URL ko'rinadi:
```
https://school-lms-abc123.vercel.app
```

#### B. NEXTAUTH_URL Yangilash
1. **Settings → Environment Variables**
2. `NEXTAUTH_URL` ni edit qiling
3. Value: `https://school-lms-abc123.vercel.app`
4. **Save**

#### C. Redeploy
**Deployments** → **...** → **Redeploy**

---

## ✅ TAYYOR!

**Login:**
- URL: `https://school-lms-abc123.vercel.app`
- Email: `admin@schoollms.uz`
- Parol: `SuperAdmin123!`

---

## 🚨 MUAMMOLAR

### Build Error
- Vercel → **Deployments** → **View logs**
- Environment variables to'g'riligini tekshiring

### Database Error
- Supabase project **Paused** bo'lmaganligini tekshiring
- Connection string'da parol to'g'riligini tekshiring

### Login Error
- `npm run db:seed` ishlatib Super Admin yarating
- Yoki Supabase SQL Editor'da qo'lda yarating

---

## 📚 TO'LIQ QO'LLANMA

Batafsil ma'lumot uchun:
- `VERCEL_DEPLOY_FULL_GUIDE_UZ.md` - To'liq qo'llanma
- `PRE_DEPLOYMENT_CHECKLIST.md` - Tekshirish ro'yxati
- `DEPLOYMENT_SUMMARY.md` - Umumiy ma'lumot

---

**Muvaffaqiyat! 🚀**

