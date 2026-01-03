# 🚀 Production ga Deploy Qilish (Bepul)

## Eng Yaxshi Variant: Vercel + Supabase

### ⏱️ Vaqt: ~30 daqiqa
### 💰 Narx: **BEPUL** (5-10 maktab uchun)

---

## 1️⃣ TAYYORGARLIK (10 daqiqa)

### A. Database Indexlar Qo'shish

1. `prisma/schema.prisma` fayliga o'ting
2. Har bir modelga `@@index` qo'shing (DATABASE_OPTIMIZATION.md da batafsil)

**Minimal (tezkor):**
```prisma
model User {
  // ... mavjud kodlar ...
  
  @@index([email])
  @@index([tenantId])
  @@index([role])
}

model Student {
  // ... mavjud kodlar ...
  
  @@index([tenantId])
  @@index([studentCode])
  @@index([status])
}

model Payment {
  // ... mavjud kodlar ...
  
  @@index([tenantId])
  @@index([status])
  @@index([dueDate])
}

// Boshqa modellar uchun ham shunga o'xshash
```

3. Saqlang va push qiling:
```bash
npm run db:push
```

### B. Production Build Test

```bash
npm run build
```

Agar xatolik bo'lsa - tuzating!

---

## 2️⃣ SUPABASE SETUP (5 daqiqa)

### A. Account Ochish
1. https://supabase.com ga kiring
2. "Start your project" bosing
3. GitHub orqali kirish (tavsiya)

### B. Yangi Project Yaratish
1. "New Project" bosing
2. **Name**: `school-lms-db`
3. **Database Password**: Qiyin parol (saqlang!) 
4. **Region**: Singapore (O'zbekistonga yaqin)
5. "Create new project" bosing (2-3 daqiqa kutish)

### C. Database URL Olish
1. Project Settings > Database
2. **Connection string** dan `URI` ni ko'chirib oling
3. Parolingizni qo'ying `[YOUR-PASSWORD]` o'rniga

Natija:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

### D. Database Yaratish

Terminal da:
```bash
# .env fayliga Supabase URL ni qo'ying
DATABASE_URL="postgresql://postgres:parol@db.xxx.supabase.co:5432/postgres"

# Database structure yaratish
npm run db:push

# Test ma'lumotlar (ixtiyoriy)
npm run db:seed
```

✅ Database tayyor!

---

## 3️⃣ VERCEL SETUP (5 daqiqa)

### A. Account Ochish
1. https://vercel.com ga kiring
2. GitHub orqali kirish

### B. Git Repository
Agar GitHub da yo'q bo'lsa:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/school-lms.git
git push -u origin main
```

### C. Vercel da Import
1. Vercel dashboard > "Add New" > "Project"
2. GitHub repository ni tanlang
3. "Import" bosing

### D. Environment Variables
**Framework Preset**: Next.js ✅

**Environment Variables** qo'shish:

```env
# Database
DATABASE_URL="postgresql://postgres:parol@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:parol@db.xxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="32-xonali-random-string-bu-yerda"

# Optional
NODE_ENV="production"
```

### E. NEXTAUTH_SECRET Yaratish

Terminal da:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy qiling va `NEXTAUTH_SECRET` ga qo'ying.

### F. Deploy!
"Deploy" bosing (3-5 daqiqa)

✅ Tayyor! URL: `https://your-app.vercel.app`

---

## 4️⃣ ILOVA SOZLAMALAR (5 daqiqa)

### A. Super Admin Yaratish

1. Supabase Dashboard > SQL Editor
2. Quyidagi SQL ni ishga tushiring:

```sql
-- Super Admin user yaratish
INSERT INTO "User" (id, email, "passwordHash", "fullName", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'superadmin123',
  'admin@schoollms.uz',
  -- parol: Admin123! (bcrypt hash)
  '$2a$10$rQYY5Y5Y5Y5Y5Y5Y5Y5Y5OzGZWn8qN0F0F0F0F0F0F0F0F',
  'Super Admin',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
);
```

**YOKI** terminalda:

```bash
# bcryptjs orqali parol hash qilish
node -e "console.log(require('bcryptjs').hashSync('Admin123!', 10))"
```

### B. Birinchi Kirish
1. https://your-app.vercel.app/login
2. Email: `admin@schoollms.uz`
3. Parol: `Admin123!`

### C. Parolni O'zgartirish
Kirganingizdan keyin darhol parolni o'zgartiring!

---

## 5️⃣ MONITORING SETUP (5 daqiqa)

### A. Vercel Analytics (Bepul)
1. Vercel Dashboard > your-project > Analytics
2. "Enable" bosing
3. Tayyor! ✅

### B. Uptime Monitoring (UptimeRobot)
1. https://uptimerobot.com ga kiring
2. "Add New Monitor" bosing
3. **URL**: `https://your-app.vercel.app`
4. **Type**: HTTP(s)
5. **Interval**: 5 daqiqa
6. "Create Monitor" bosing

Email ga alert keladi agar website ishlamasa.

### C. Error Tracking (Sentry - Ixtiyoriy)
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

## ✅ DEPLOYMENT CHECKLIST

### Asosiy
- [ ] Database indexlari qo'shildi
- [ ] `npm run build` ishladi (xatosiz)
- [ ] Supabase project yaratildi
- [ ] Database migrate qilindi
- [ ] Vercel ga deploy qilindi
- [ ] Environment variables to'ldirildi
- [ ] Super admin yaratildi
- [ ] Login qilindi va test qilindi

### Xavfsizlik
- [ ] `.env` faylni `.gitignore` da tekshirildi
- [ ] NEXTAUTH_SECRET random string
- [ ] Super admin paroli kuchli
- [ ] Database parol kuchli

### Monitoring
- [ ] Vercel Analytics yoqildi
- [ ] UptimeRobot sozlandi
- [ ] Test deployment qilindi

---

## 🎯 TEST QILISH

### 1. Asosiy Funksiyalar
- [ ] Login ishlaydi
- [ ] Dashboard yuklanadi
- [ ] Tenant qo'shish ishlaydi
- [ ] Student qo'shish ishlaydi
- [ ] Payments ko'rinadi

### 2. Performance
- [ ] Sahifalar 2 soniyadan tez yuklanadi
- [ ] Search ishlaydi
- [ ] Filter ishlaydi
- [ ] Pagination ishlaydi

### 3. Xavfsizlik
- [ ] Login qilmagan user dashboardga kira olmaydi
- [ ] Admin student rolini ko'ra olmaydi
- [ ] Tenant data ajratilgan

---

## 🚨 MUAMMOLAR VA YECHIMLAR

### Build Xatosi
```bash
# Cache tozalash
rm -rf .next
npm run build
```

### Database Connection Xatosi
```bash
# Connection string to'g'riligini tekshiring
# Supabase parolni tekshiring
# Firewall ochiqligini tekshiring
```

### Vercel 404 Xatosi
1. Vercel dashboard > Settings > General
2. **Output Directory** bo'sh ekanligini tekshiring
3. **Build Command**: `npm run build`
4. **Install Command**: `npm install`

### Sekin Ishlash
1. Database indexlar borligini tekshiring
2. Vercel Analytics da bottleneck topish
3. `revalidate` vaqtini kamaytirishni sinang

---

## 📊 LIMITS (Bepul Plan)

### Vercel
- ✅ 100GB Bandwidth/oy
- ✅ 1000 build minutes/oy
- ⚠️ 10 soniyalik serverless function timeout
- ⚠️ 250MB deployment size limit

**Yetadimi?**
- 5-10 maktab: **Yetadi** ✅
- 50 maktab: **Qiyin** ⚠️
- 100+ maktab: **Yetmaydi** ❌

### Supabase
- ✅ 500MB Database
- ✅ 2GB File Storage
- ✅ 50,000 Monthly Active Users
- ⚠️ 7 kunlik backup
- ⚠️ 2 million row reads/oy

**Yetadimi?**
- 10 maktab × 500 o'quvchi = **Yetadi** ✅
- 50 maktab: **Qiyin** ⚠️

---

## 💰 UPGRADE QACHON KERAK?

### Upgradelar:
- **Vercel Pro**: $20/oy → 1TB bandwidth, 6000 build minutes
- **Supabase Pro**: $25/oy → 8GB database, 100GB storage
- **Jami**: ~$50/oy (50-100 maktab uchun)

### Belgilar:
- ⚠️ Bandwidth 80% dan oshsa
- ⚠️ Database 400MB dan oshsa
- ⚠️ Tez-tez timeout xatolari
- ⚠️ Sekinlashish

---

## 🎊 TAYYOR!

Endi loyihangiz production da!

**Keyingi qadamlar:**
1. Domen ulash (Ixtiyoriy): Vercel > Domains
2. SSL avtomatik (Vercel) ✅
3. Backup strategiya (haftalik manual)
4. User feedback yig'ish
5. Performance monitoring

**Yordam kerakmi?**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

Muvaffaqiyat! 🚀

