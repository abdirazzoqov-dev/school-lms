# ✅ Netlify Deploy Checklist

Tezkor tekshiruv ro'yxati.

---

## 📦 PRE-DEPLOYMENT

- [ ] `netlify.toml` fayl mavjud va to'g'ri sozlangan
- [ ] `package.json` da `netlify-build` script mavjud
- [ ] `.gitignore` da `.env` fayl bor (xavfsizlik uchun)
- [ ] Code GitHub ga push qilingan
- [ ] Database (Supabase/Neon) yaratilgan
- [ ] Database schema yuklangan (`npx prisma db push`)

---

## 🌐 NETLIFY SETUP

- [ ] Netlify account yaratilgan
- [ ] GitHub repository Netlify ga ulangan
- [ ] Build settings to'g'ri:
  - Build command: `npm run netlify-build`
  - Publish directory: `.next`

---

## 🔐 ENVIRONMENT VARIABLES

Quyidagi variables larni **BARCHASINI** Netlify dashboard da qo'shing:

- [ ] `DATABASE_URL` (Supabase connection string - pooling mode)
- [ ] `DIRECT_URL` (Supabase connection string - direct mode)
- [ ] `NEXTAUTH_URL` (Netlify site URL: https://YOUR-SITE.netlify.app)
- [ ] `NEXTAUTH_SECRET` (32-xonali random string)
- [ ] `SUPER_ADMIN_EMAIL` (ixtiyoriy, default: admin@schoollms.uz)
- [ ] `SUPER_ADMIN_PASSWORD` (ixtiyoriy, default: SuperAdmin123!)
- [ ] `NODE_ENV` (production)

⚠️ **MUHIM:** Barcha variables uchun **Production, Preview, Branch deploys** scopes tanlang!

---

## 🚀 DEPLOYMENT

- [ ] Birinchi deploy muvaffaqiyatli
- [ ] Build log da xatoliklar yo'q
- [ ] Site URL olingan
- [ ] `NEXTAUTH_URL` to'g'ri sozlangan (agar kerak bo'lsa, qayta deploy)

---

## ✅ POST-DEPLOYMENT TEST

- [ ] Site yuklanadi (Netlify URL da)
- [ ] Login sahifasi ochiladi
- [ ] Super Admin bilan login muvaffaqiyatli
- [ ] Dashboard ishlayapti
- [ ] Database connection ishlayapti

---

## 🎯 OPTIONAL (Keyinroq)

- [ ] Custom domain qo'shildi
- [ ] SSL certificate aktiv (avtomatik)
- [ ] Production parollar o'zgartirildi (xavfsizlik uchun)
- [ ] Monitoring sozlandi (Sentry, LogRocket)

---

## 📚 QO'SHIMCHA MA'LUMOT

- To'liq qo'llanma: `NETLIFY_DEPLOY.md`
- Muammolar bo'lsa: Netlify dashboard → Support
- Build logs: Netlify dashboard → Deploys → [Deploy] → Build log

---

**Oxirgi yangilanish:** 2024-12-08

