# 🚀 SCHOOL LMS - ISHGA TUSHIRISH QO'LLANMASI

## ✅ Hamma narsa tayyor! Faqat quyidagi qadamlarni bajaring:

---

## 1️⃣ DATABASE ISHGA TUSHIRISH

### Docker PostgreSQL
```powershell
# Terminal oching (PowerShell) va loyiha papkasiga o'ting:
cd C:\lms

# PostgreSQL container ishga tushirish:
docker-compose up -d

# Statusni tekshirish:
docker ps

# Natija:
# school_lms_db   Up (healthy)   0.0.0.0:5433->5432/tcp
```

---

## 2️⃣ DEVELOPMENT SERVER ISHGA TUSHIRISH

### Birinchi marta (Setup)
```powershell
# Dependencies o'rnatish (agar o'rnatilmagan bo'lsa):
npm install

# Prisma client generate:
npm run db:generate

# Seed data yuklash (birinchi marta):
npm run db:seed
```

### Har safar (Development)
```powershell
# Development server ishga tushirish:
npm run dev

# Natija:
# ✓ Ready in 3.8s
# - Local: http://localhost:3000
```

---

## 3️⃣ LOGIN QILISH

### Browser'da oching:
```
http://localhost:3000
```

### Login ma'lumotlari:

#### 🔐 Super Admin
```
Email: admin@schoollms.uz
Password: SuperAdmin123!
```

#### 👤 Demo Maktab Admin
```
Email: admin@demo-maktab.uz
Password: Admin123!
```

#### 👨‍🏫 Demo Teacher
```
Email: teacher@demo-maktab.uz
Password: Teacher123!
```

#### 👨‍👩‍👧 Demo Parent
```
Email: parent@demo-maktab.uz
Password: Parent123!
```

---

## 4️⃣ PRISMA STUDIO (Database ko'rish)

### Terminal'da:
```powershell
npm run db:studio
```

### Browser'da oching:
```
http://localhost:5555
```

Bu yerda barcha database ma'lumotlarini ko'rishingiz va o'zgartirishingiz mumkin.

---

## 🎯 ASOSIY VAZIFALAR

### O'quvchi qo'shish:
1. Admin sifatida login qiling
2. Sidebar: **Students** → **Add New Student**
3. Ma'lumotlarni to'ldiring
4. **Save** bosing

### O'qituvchi qo'shish:
1. Sidebar: **Teachers** → **Add New Teacher**
2. Ma'lumotlarni to'ldiring
3. **Save** bosing

### Sinf yaratish:
1. Sidebar: **Classes** → **Add New Class**
2. Sinf nomini kiriting (masalan, "7-A")
3. Class teacher tanlang
4. **Save** bosing

### Davomat kiritish (Teacher):
1. Teacher sifatida login qiling
2. **Attendance** → **Mark Attendance**
3. Sinfni tanlang
4. Davomatni belgilang
5. **Save** bosing

### Baho qo'yish (Teacher):
1. **Grades** → **Add Grade**
2. O'quvchini tanlang
3. Fanini tanlang
4. Bahoni kiriting
5. **Save** bosing

### To'lov qabul qilish (Admin):
1. **Payments** → **Create Payment**
2. O'quvchini tanlang
3. Summani kiriting
4. To'lov turini tanlang
5. **Save** bosing

---

## 📊 DASHBOARD ELEMENTLARI

### Super Admin Dashboard:
- Jami maktablar soni
- Active tenants
- Subscription to'lovlar
- Barcha foydalanuvchilar

### Admin Dashboard:
- O'quvchilar soni
- O'qituvchilar soni
- Bu oyning daromadi
- Bugungi davomat
- Yangi o'quvchilar ro'yxati
- Oxirgi to'lovlar
- Attendance chart (7 kun)
- Grade distribution chart
- Payment statistics

### Teacher Dashboard:
- Mening sinflarim
- Bugungi darslar
- Baholash kerak bo'lgan vazifalar
- Xabarlar

### Parent Dashboard:
- Bolalarim
- Davomat statistikasi
- Baholar
- To'lovlar holati

---

## 🔧 QULAYLIK BUYRUQLARI

### Database:
```powershell
# Prisma Studio (database ko'rish)
npm run db:studio

# Schema push (development)
npm run db:push

# Prisma client generate
npm run db:generate

# Seed data qayta yuklash
npm run db:seed
```

### Development:
```powershell
# Dev server
npm run dev

# Linter tekshirish
npm run lint

# Build (production)
npm run build

# Production server
npm run start
```

### Docker:
```powershell
# PostgreSQL ishga tushirish
docker-compose up -d

# PostgreSQL to'xtatish
docker-compose down

# Loglarni ko'rish
docker-compose logs -f postgres

# Container'ni restart qilish
docker-compose restart postgres
```

---

## ⚠️ TUZATISH (Troubleshooting)

### Database ulanmasa:
```powershell
# Docker container statusini tekshiring:
docker ps -a

# Agar "Exited" bo'lsa, qayta ishga tushiring:
docker-compose restart postgres

# Yoki to'liq qayta yarating:
docker-compose down
docker-compose up -d
```

### Dev server ishlamasa:
```powershell
# node_modules o'chirish va qayta o'rnatish:
Remove-Item -Recurse -Force node_modules
npm install

# .next papkasini tozalash:
Remove-Item -Recurse -Force .next
npm run dev
```

### Prisma error:
```powershell
# Prisma client qayta generate:
npm run db:generate

# Database'ni reset qilish (EHTIYOTKOR!):
npx prisma db push --force-reset
npm run db:seed
```

---

## 📁 MUHIM FAYLLAR

### Environment:
- `.env` - Environment variables
- `.env.example` - Example env file

### Database:
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Seed data

### Configuration:
- `next.config.js` - Next.js config
- `tailwind.config.ts` - Tailwind config
- `tsconfig.json` - TypeScript config
- `.eslintrc.json` - ESLint config

### Docker:
- `docker-compose.yml` - PostgreSQL setup

---

## 🎨 UI CUSTOMIZATION

### Ranglarni o'zgartirish:
`tailwind.config.ts` faylini oching va `colors` qismida o'zgartiring.

### Logoni o'zgartirish:
`public/` papkaga yangi logo yuklang va `app/layout.tsx` da o'zgartiring.

### Font o'zgartirish:
`app/layout.tsx` faylida `Inter` o'rniga boshqa Google Font kiriting.

---

## 🔐 XAVFSIZLIK

### Production'ga deploy qilishdan oldin:

1. **Environment variables o'zgartiring:**
```env
NEXTAUTH_SECRET=<strong-random-secret>
DATABASE_URL=<production-database-url>
NEXTAUTH_URL=https://yourdomain.com
```

2. **Default parollarni o'zgartiring:**
- Super Admin paroli
- Demo hisoblarni o'chiring yoki parollarini yangilang

3. **Database backup:**
```powershell
# Backup yaratish:
docker exec school_lms_db pg_dump -U postgres school_lms > backup.sql

# Backup'dan tiklash:
docker exec -i school_lms_db psql -U postgres school_lms < backup.sql
```

---

## 📚 QO'SHIMCHA HUJJATLAR

- `README.md` - Umumiy ma'lumot
- `LOYIHA_TAHLILI.md` - To'liq tahlil
- `LOYIHA_HOLATI.md` - Hozirgi holat
- `FINAL_SUMMARY.md` - Yakuniy hisobot
- `ARCHITECTURE_DIAGRAM.md` - Arxitektura
- `DATABASE_OPTIMIZATION.md` - Database optimizatsiya
- `SECURITY_FIXES_SUMMARY.md` - Xavfsizlik
- `DEPLOYMENT_GUIDE.md` - Deploy qilish
- `PRODUCTION_CHECKLIST.md` - Production checklist

---

## 🎯 DASTLABKI TESTLAR

### 1. Login test:
- [ ] Super Admin login
- [ ] Admin login
- [ ] Teacher login
- [ ] Parent login

### 2. CRUD test:
- [ ] O'quvchi qo'shish, o'zgartirish, o'chirish
- [ ] O'qituvchi qo'shish, o'zgartirish, o'chirish
- [ ] Sinf yaratish, o'zgartirish, o'chirish

### 3. Functionality test:
- [ ] Davomat kiritish
- [ ] Baho qo'yish
- [ ] To'lov qabul qilish
- [ ] Xabar yuborish
- [ ] E'lon yaratish

### 4. Reports test:
- [ ] O'quvchilar hisoboti
- [ ] Davomat hisoboti
- [ ] Baholar hisoboti
- [ ] Moliyaviy hisobot

---

## ✅ TAYYOR!

Barcha qadamlar bajarildi va loyiha ishga tushdi! 🎉

**Savol yoki muammo bo'lsa:**
- Documentation'larni o'qing
- Prisma Studio'da database'ni tekshiring
- Docker logs'ni ko'ring: `docker-compose logs -f`

---

**Good luck!** 🚀

