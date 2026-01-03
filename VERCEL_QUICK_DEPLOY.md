# ⚡ VERCEL GA TEZKOR DEPLOY (15 daqiqa)

Loyihani Vercel ga tezkor deploy qilish uchun qisqa qo'llanma.

---

## ✅ KERAKLI NARSALAR

1. GitHub account
2. Vercel account (https://vercel.com)
3. Supabase account (https://supabase.com)

---

# 🚀 5 QADAMDA DEPLOY

## 1️⃣ GitHub ga Push (2 daqiqa)

```powershell
git init
git add .
git commit -m "Production ready"
git remote add origin https://github.com/YOUR-USERNAME/school-lms.git
git push -u origin main
```

---

## 2️⃣ Supabase Database (5 daqiqa)

1. https://supabase.com → **New Project**
2. **Name:** `school-lms-production`
3. **Password:** Saqlang! 📝
4. **Region:** Singapore
5. **Create**

**Connection String:**
- Settings → Database → "Connect to your project"
- **Method:** Connection pooling
- **Type:** URI
- Copy qiling!

---

## 3️⃣ Schema Push (2 daqiqa)

Lokal `.env` faylni Supabase connection string bilan yangilang:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

```powershell
npx prisma db push
```

---

## 4️⃣ Vercel Deploy (5 daqiqa)

1. https://vercel.com → **Add New Project**
2. GitHub repository ni tanlang
3. **Environment Variables** qo'shing:

```
DATABASE_URL = [Supabase connection string]
NEXTAUTH_URL = https://your-project.vercel.app (keyinroq yangilash)
NEXTAUTH_SECRET = [your-secret]
SUPER_ADMIN_EMAIL = admin@schoollms.uz
SUPER_ADMIN_PASSWORD = SuperAdmin123!
```

4. **Deploy** tugmasini bosing!

---

## 5️⃣ NEXTAUTH_URL Yangilash (1 daqiqa)

Deploy bo'lgach:
1. Vercel URL ni oling
2. Settings → Environment Variables
3. `NEXTAUTH_URL` ni yangilang
4. Redeploy qiling

---

✅ **Tayyor!** Loyiha Vercel da ishlayapti!

**Batafsil:** `VERCEL_DEPLOY_COMPLETE.md` ga qarang.













