# 🚀 Vercel ga Deploy - Qadam-ba-Qadam (100% Tayyor)

## 📋 Kerakli Narsalar

- ✅ GitHub account
- ✅ Vercel account (bepul)
- ✅ Supabase account (bepul)
- ✅ Internet (5G yoki Wi-Fi)
- ✅ 45 daqiqa vaqt

---

# BOSQICH 1: GITHUB GA YUKLASH (5 daqiqa)

## 1.1 - .gitignore Tekshirish

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
```

Agar yo'q bo'lsa, qo'shing!

## 1.2 - Git Initialize (Agar qilmagan bo'lsangiz)

```bash
git init
git add .
git commit -m "Initial commit - Production ready"
```

## 1.3 - GitHub Repository Yaratish

1. https://github.com ga kiring
2. **New repository** tugmasini bosing (yashil +)
3. **Repository name**: `school-lms` (yoki boshqa nom)
4. **Private** yoki **Public** tanlang (Private tavsiya)
5. ❌ "Add README" ni BELMANG (bizda bor)
6. **Create repository** bosing

## 1.4 - GitHub ga Push Qilish

GitHub sizga commandlar ko'rsatadi. Copy qiling va terminal da ishga tushiring:

```bash
git remote add origin https://github.com/YOUR-USERNAME/school-lms.git
git branch -M main
git push -u origin main
```

✅ **Tayyor!** Kodingiz GitHub da.

---

# BOSQICH 2: SUPABASE DATABASE (15 daqiqa)

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

   Misol parol:
   ```
   SchoolLMS2025!SecurePass
   ```
   ⚠️ Bu parolni **albatta saqlang** - keyin kerak bo'ladi!

5. **Region**: Singapore (O'zbekistonga yaqin)
6. **Pricing Plan**: Free
7. **Create new project** tugmasini bosing

⏳ 2-3 daqiqa kutish kerak (database yaratilmoqda...)

## 2.3 - Database Connection String Olish

Project tayyor bo'lgach:

1. Chap tarafdagi **Settings** (⚙️) tugmasini bosing
2. **Database** bo'limini tanlang
3. **Connection string** bo'limida:
   - **Connection pooling** ni tanlang (muhim!)
   - **URI** ni tanlang
   - **Copy** qiling

Natija shunga o'xshash bo'ladi:
```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

4. `[YOUR-PASSWORD]` ni o'z parolingiz bilan almashtiring
5. Bu stringni **saqlang!** 📝

## 2.4 - DIRECT_URL Olish

1. Xuddi shu joyda **Session pooling** ni tanlang
2. **URI** ni copy qiling
3. Bu ham kerak bo'ladi

---

# BOSQICH 3: NEXTAUTH_SECRET YARATISH (1 daqiqa)

Terminal da:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Natija (misol):
```
a3f8d9c2b5e7f1a4c6d8e9f2b3c5d7e8f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5
```

Bu stringni **copy qiling va saqlang!** 📝

---

# BOSQICH 4: VERCEL ACCOUNT VA IMPORT (5 daqiqa)

## 4.1 - Vercel Account

1. https://vercel.com ga kiring
2. **Sign Up** tugmasini bosing
3. **Continue with GitHub** tugmasini bosing
4. GitHub ga ruxsat bering

## 4.2 - Repository Import

1. Vercel dashboard da **Add New...** > **Project** ni bosing
2. **Import Git Repository** bo'limida GitHub repository ni toping
3. `school-lms` ni tanlang
4. **Import** tugmasini bosing

---

# BOSQICH 5: ENVIRONMENT VARIABLES (5 daqiqa)

**Configure Project** sahifasida:

## 5.1 - Environment Variables Qo'shish

**Environment Variables** bo'limida quyidagilarni qo'shing:

### Variable 1: DATABASE_URL
```
Name: DATABASE_URL
Value: postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```
⚠️ O'z Supabase connection stringingizni qo'ying!
⚠️ Oxiriga `?pgbouncer=true&connection_limit=1` ni qo'shishni unutmang!

### Variable 2: DIRECT_URL
```
Name: DIRECT_URL
Value: postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```
⚠️ Bu session pooling URL (yuqorida olgan)

### Variable 3: NEXTAUTH_URL
```
Name: NEXTAUTH_URL
Value: https://YOUR-PROJECT-NAME.vercel.app
```
⚠️ Hozircha bu noto'g'ri, deploy bo'lgandan keyin to'g'rilaymiz!

### Variable 4: NEXTAUTH_SECRET
```
Name: NEXTAUTH_SECRET
Value: a3f8d9c2b5e7f1a4c6d8e9f2b3c5d7e8f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5
```
⚠️ O'zingiz yaratgan 32 xonali stringni qo'ying!

### Variable 5: NODE_ENV
```
Name: NODE_ENV
Value: production
```

## 5.2 - Environment Type

Har bir variable uchun:
- ✅ **Production** - check
- ✅ **Preview** - check
- ✅ **Development** - check

---

# BOSQICH 6: DEPLOY! (10 daqiqa)

## 6.1 - Deploy Qilish

1. Barcha environment variables kiritilganini tekshiring (5 ta)
2. **Deploy** tugmasini bosing (pastda)

⏳ **Kutish:** 3-5 daqiqa (birinchi deploy sekinroq)

Progress bar ko'rinadi:
- Building...
- Deploying...

## 6.2 - Deploy Muvaffaqiyatli Bo'lganda

🎉 **Congratulations!** xabari chiqadi

**Domain URL** ni ko'rasiz:
```
https://school-lms-xxxx.vercel.app
```

Bu URLni **copy qiling!** 📝

## 6.3 - NEXTAUTH_URL ni To'g'rilash

1. Vercel dashboard > your project > **Settings**
2. **Environment Variables** ni bosing
3. `NEXTAUTH_URL` ni toping
4. **Edit** (✏️) ni bosing
5. Yangi qiymat:
   ```
   https://school-lms-xxxx.vercel.app
   ```
   (O'z domeningizni qo'ying!)
6. **Save** bosing
7. **Redeploy** kerak bo'ladi - "Redeploy" tugmasini bosing

---

# BOSQICH 7: DATABASE MIGRATION (5 daqiqa)

Database yaratildi, lekin bo'sh. Endi table-larni yaratish kerak.

## 7.1 - Supabase SQL Editor

1. Supabase dashboard ga qaytamiz
2. Chap tarafda **SQL Editor** ni bosing
3. **New query** tugmasini bosing

## 7.2 - Prisma Schema SQL Export

**Local terminalda** (kompyuteringizda):

```bash
# Database connection string ni local ga set qilish
# .env fayliga yozing (vaqtinchalik):
DATABASE_URL="postgresql://postgres.xxxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Migration yaratish
npx prisma migrate dev --name init

# Yoki to'g'ridan-to'g'ri push
npx prisma db push
```

Terminal so'raydi: 
```
Are you sure you want to create and apply this migration? (y/N)
```
`y` bosing va Enter.

⏳ Kutish: 1-2 daqiqa

✅ Agar "Migration completed" desa - tayyor!

---

# BOSQICH 8: SUPER ADMIN YARATISH (2 daqiqa)

Database tayyor, lekin user yo'q. Birinchi Super Admin yaratish kerak.

## 8.1 - Parol Hash Yaratish

Terminal da:

```bash
node -e "console.log(require('bcryptjs').hashSync('Admin123!', 10))"
```

Natija (misol):
```
$2a$10$xjxRV9eWW4VXJzv8YQvJ7.yKGZsJ8mFJ8K2Q9mY9qZGVJ8K2Q9mY9
```

Bu hash ni **copy qiling!**

## 8.2 - Supabase SQL Editor

1. Supabase dashboard > SQL Editor
2. **New query**
3. Quyidagi SQL ni yozing:

```sql
-- Super Admin user yaratish
INSERT INTO "User" (
  id, 
  email, 
  "passwordHash", 
  "fullName", 
  role, 
  "isActive", 
  "createdAt", 
  "updatedAt"
)
VALUES (
  'super-admin-001',
  'admin@schoollms.uz',
  '$2a$10$xjxRV9eWW4VXJzv8YQvJ7.yKGZsJ8mFJ8K2Q9mY9qZGVJ8K2Q9mY9',
  'Super Admin',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
);
```

⚠️ `passwordHash` qatoriga **o'zingiz yaratgan hash**ni qo'ying!

4. **Run** tugmasini bosing (pastda)
5. ✅ "Success" xabari chiqishi kerak

---

# BOSQICH 9: TEST QILISH! (5 daqiqa)

## 9.1 - Website ga Kirish

1. Browser da Vercel URL ni oching:
   ```
   https://school-lms-xxxx.vercel.app
   ```

2. Avtomatik `/login` sahifasiga redirect bo'ladi

## 9.2 - Login Qilish

**Email:** `admin@schoollms.uz`
**Parol:** `Admin123!`

**Sign In** tugmasini bosing

## 9.3 - Dashboard

Agar muvaffaqiyatli bo'lsa:
- ✅ Super Admin Dashboard ko'rinadi
- ✅ "Salom, Super Admin!" xabari
- ✅ Statistika (0 maktab, 0 o'quvchi)

🎉 **ISHLAMOQDA!**

## 9.4 - Birinchi Maktab Qo'shish

1. **Maktablar** > **Yangi Maktab** tugmasini bosing
2. Ma'lumotlarni to'ldiring:
   ```
   Nomi: Test Maktab #1
   Slug: test-maktab-1
   Email: test@maktab.uz
   Telefon: +998901234567
   ```
3. **Saqlash** tugmasini bosing

✅ Birinchi maktab yaratildi!

---

# BOSQICH 10: XAVFSIZLIK (2 daqiqa)

## 10.1 - .env Faylni GitHub dan O'chirish

⚠️ **JUDA MUHIM!**

Local terminalda:

```bash
# .gitignore tekshirish
cat .gitignore | grep .env
```

Agar `.env` yo'q bo'lsa, qo'shing:

```bash
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
git push
```

## 10.2 - Super Admin Parolini O'zgartirish

1. Dashboard > Settings (yoki profile)
2. **Parolni o'zgartirish**
3. Yangi, kuchli parol qo'ying
4. **Saqlash**

---

# ✅ TAYYOR! DEPLOY MUVAFFAQIYATLI!

## 🎉 Nima qildik?

✅ GitHub ga kod yuklandi
✅ Supabase database yaratildi
✅ Vercel ga deploy qilindi
✅ Environment variables sozlandi
✅ Database migration qilindi
✅ Super Admin yaratildi
✅ Login test qilindi
✅ Birinchi maktab qo'shildi

---

# 📊 SIZNING LINKLAR

**Website URL:**
```
https://school-lms-xxxx.vercel.app
```

**Super Admin Login:**
```
Email: admin@schoollms.uz
Parol: Admin123! (o'zgartirildi)
```

**Vercel Dashboard:**
```
https://vercel.com/dashboard
```

**Supabase Dashboard:**
```
https://supabase.com/dashboard/project/xxxxx
```

---

# 🔧 MUAMMOLAR VA YECHIMLAR

## Muammo 1: Build Failed (Vercel)

**Error:** "Module not found" yoki "Type error"

**Yechim:**
```bash
# Local da test qiling
npm run build

# Agar xato bo'lsa, tuzating va push qiling
git add .
git commit -m "Fix build error"
git push
```
Vercel avtomatik qayta deploy qiladi.

## Muammo 2: Database Connection Error

**Error:** "Can't reach database"

**Yechim:**
1. Vercel > Settings > Environment Variables
2. `DATABASE_URL` to'g'riligini tekshiring
3. Parol to'g'rimi?
4. `?pgbouncer=true&connection_limit=1` bormi?
5. Redeploy qiling

## Muammo 3: Login ishlamaydi

**Error:** "Invalid credentials"

**Yechim:**
1. Supabase SQL Editor ga kiring
2. User mavjudligini tekshiring:
   ```sql
   SELECT * FROM "User" WHERE email = 'admin@schoollms.uz';
   ```
3. Agar yo'q bo'lsa, qaytadan yarating (Bosqich 8)

## Muammo 4: "Application error: a client-side exception"

**Error:** White screen yoki error page

**Yechim:**
1. Vercel > Deployments > Latest > Runtime Logs
2. Error xabarini o'qing
3. Ko'pincha `NEXTAUTH_SECRET` yoki `DATABASE_URL` muammosi
4. Environment variables ni qayta tekshiring
5. Redeploy qiling

## Muammo 5: Sekin ishlaydi

**Yechim:**
1. Database indexlar mavjudligini tekshiring:
   ```bash
   # Local da
   npx prisma studio
   ```
2. Agar indexlar yo'q bo'lsa:
   ```bash
   npm run db:push
   ```

---

# 📈 KEYINGI QADAMLAR

## 1. Custom Domain (Ixtiyoriy)

Agar o'z domeningiz bo'lsa (schoollms.uz):

1. Vercel > Settings > Domains
2. **Add** tugmasini bosing
3. Domeningizni kiriting
4. DNS recordlarni qo'shing (Vercel ko'rsatadi)
5. 24 soat ichida faollashadi

## 2. Monitoring Sozlash

**Vercel Analytics:**
1. Vercel > your project > Analytics
2. **Enable** tugmasini bosing
3. Bepul! ✅

**Uptime Monitoring:**
1. https://uptimerobot.com
2. Monitor qo'shing
3. Email alerts sozlang

## 3. Backup Sozlash

**Supabase Automatic Backup:**
1. Supabase > Database > Backups
2. Allaqachon yoqilgan ✅
3. 7 kunlik backup (bepul)

**Manual Backup (Haftalik):**
```bash
# Local da
PGPASSWORD=your-password pg_dump \
  -h aws-0-ap-southeast-1.pooler.supabase.com \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f backup-$(date +%Y-%m-%d).sql
```

---

# 🎯 CHECKLIST

Deploy to'liq bo'lishi uchun tekshiring:

- [ ] Website ochiladi
- [ ] Login ishlaydi
- [ ] Dashboard ko'rinadi
- [ ] Maktab qo'shish ishlaydi
- [ ] O'quvchi qo'shish ishlaydi
- [ ] Search ishlaydi
- [ ] File upload ishlaydi
- [ ] Logout ishlaydi
- [ ] Parol o'zgartirildi
- [ ] .env GitHub da yo'q

---

# 🎊 MUVAFFAQIYAT!

Loyihangiz endi **100% live** va **production-ready**!

**URL**: https://school-lms-xxxx.vercel.app

Maktablarga bering va foydalanishni boshlasalar bo'ladi! 🚀

---

# 📞 YORDAM

**Vercel Support:**
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord

**Supabase Support:**
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

**Muammo bo'lsa:**
1. Logs ni tekshiring (Vercel > Runtime Logs)
2. Database ni tekshiring (Supabase > SQL Editor)
3. Environment variables ni tekshiring

---

**Barakalla! Juda zo'r ish qildingiz! 🎉**

