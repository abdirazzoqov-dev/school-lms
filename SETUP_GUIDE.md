# 🚀 School LMS - O'rnatish Qo'llanmasi

Loyihani o'rnatish va ishga tushirish uchun qadamma-qadam qo'llanma.

---

## 📋 Talab qilinadigan dasturlar

O'rnatishdan oldin quyidagilarni o'rnatgan bo'lishingiz kerak:

- **Node.js** 18.0 yoki undan yuqori → [nodejs.org](https://nodejs.org)
- **PostgreSQL** 14+ → [postgresql.org](https://www.postgresql.org/download/)
- **Git** → [git-scm.com](https://git-scm.com)

---

## 1️⃣ Loyihani yuklab olish

```bash
cd lms
```

---

## 2️⃣ Dependencies o'rnatish

```bash
npm install
```

Bu jarayon 2-3 daqiqa davom etishi mumkin.

---

## 3️⃣ Database yaratish

### PostgreSQL'da yangi database yaratish:

**Windows (pgAdmin yoki CMD):**
```sql
CREATE DATABASE school_lms;
```

**macOS/Linux (Terminal):**
```bash
psql postgres
CREATE DATABASE school_lms;
\q
```

---

## 4️⃣ Environment o'zgaruvchilarni sozlash

`.env.example` faylini `.env` ga nusxalang:

**Windows (PowerShell):**
```powershell
copy .env.example .env
```

**macOS/Linux:**
```bash
cp .env.example .env
```

### `.env` faylini tahrirlang:

```env
# Database connection
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/school_lms?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"  # openssl rand -base64 32

# Super Admin credentials
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**MUHIM:**
- `yourpassword` - PostgreSQL parolingiz
- `NEXTAUTH_SECRET` - yangi secret key generate qiling

**Secret key yaratish:**
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 5️⃣ Database Schema o'rnatish

```bash
npm run db:push
```

Bu Prisma schema'ni database'ga yuklaydi.

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
✔ Schema is in sync with the database
```

---

## 6️⃣ Dastlabki ma'lumotlar kiritish (Seed)

```bash
npm run db:seed
```

Bu quyidagi demo ma'lumotlarni yaratadi:
- ✅ Super Admin hisob
- ✅ Demo maktab (tenant)
- ✅ Admin, Teacher, Parent hisoblar
- ✅ Demo sinflar va fanlar

**Natija:**
```
🌱 Starting seed...
✅ Super Admin created
✅ Demo Tenant created
✅ Demo Admin created
✅ Demo Teacher created
✅ Demo Parent created
🎉 Seed completed!
```

---

## 7️⃣ Development server ishga tushirish

```bash
npm run dev
```

**Server manzili:** [http://localhost:3000](http://localhost:3000)

---

## 8️⃣ Tizimga kirish

### 🔐 Login Credentials

#### Super Admin (Barcha maktablarni boshqarish):
- **Email:** `admin@schoollms.uz`
- **Parol:** `SuperAdmin123!`
- **Dashboard:** `/super-admin`

#### Maktab Admin (Demo Maktab):
- **Email:** `admin@demo-maktab.uz`
- **Parol:** `Admin123!`
- **Dashboard:** `/admin`

#### O'qituvchi:
- **Email:** `teacher@demo-maktab.uz`
- **Parol:** `Teacher123!`
- **Dashboard:** `/teacher`

#### Ota-ona:
- **Email:** `parent@demo-maktab.uz`
- **Parol:** `Parent123!`
- **Dashboard:** `/parent`

---

## 🛠️ Qo'shimcha Buyruqlar

### Prisma Studio (Database GUI)
```bash
npm run db:studio
```
[http://localhost:5555](http://localhost:5555) ochiladi

### Build for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

---

## 🔍 Muammolarni hal qilish

### 1. Database connection error

**Xato:**
```
Error: Can't reach database server
```

**Yechim:**
- PostgreSQL ishlab turishini tekshiring
- DATABASE_URL to'g'ri ekanligini tekshiring
- Parol va port to'g'ri kiritilgan bo'lishi kerak

**PostgreSQL ishga tushirish:**
```bash
# Windows
# Services → PostgreSQL → Start

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### 2. Port 3000 band

**Xato:**
```
Port 3000 is already in use
```

**Yechim:**
```bash
# Boshqa portda ishga tushirish
PORT=3001 npm run dev
```

### 3. Prisma Client yangilanmagan

**Xato:**
```
PrismaClient is not generated
```

**Yechim:**
```bash
npm run db:generate
```

### 4. NextAuth session error

**Yechim:**
```bash
# .env faylida NEXTAUTH_SECRET to'ldirilgan bo'lishi kerak
# Yangi secret generate qiling
```

---

## 📊 Prisma Studio'dan foydalanish

Database'dagi ma'lumotlarni ko'rish va tahrirlash:

```bash
npm run db:studio
```

- Tenants - Maktablar ro'yxati
- Users - Barcha foydalanuvchilar
- Students - O'quvchilar
- Teachers - O'qituvchilar
- Classes - Sinflar
- Subjects - Fanlar

---

## 🔒 Xavfsizlik

### Production uchun:

1. **Parollarni o'zgartiring:**
   - `.env` fayldagi barcha parollarni yangilang
   - Super admin parolini murakkab qiling

2. **NEXTAUTH_SECRET yangilang:**
   ```bash
   openssl rand -base64 32
   ```

3. **Database backup:**
   ```bash
   pg_dump school_lms > backup.sql
   ```

---

## 🚀 Deployment

### Vercel (Frontend)

1. GitHub'ga push qiling
2. [vercel.com](https://vercel.com)'da sign in
3. "Import Project" → Repository tanlang
4. Environment variables qo'shing (`.env` dan)
5. Deploy!

### Railway (Database)

1. [railway.app](https://railway.app)'da sign in
2. "New Project" → "Provision PostgreSQL"
3. Connection string oling
4. Vercel'da DATABASE_URL yangilang

---

## 📝 Keyingi qadamlar

✅ Loyiha ishga tushdi!

**Endi nima qilish kerak:**

1. **Super Admin sifatida kirish**
   - Yangi maktab qo'shish
   - Subscription rejalarni sozlash

2. **Maktab Admin sifatida:**
   - O'quvchilar qo'shish
   - O'qituvchilar qo'shish
   - Sinflar yaratish
   - Dars jadvali tuzish

3. **Development:**
   - API routes yaratish
   - UI komponentlar qo'shish
   - Yangi sahifalar yaratish

---

## 🆘 Yordam kerakmi?

**Muammo yuzaga kelsa:**

1. Terminalda xato xabarini o'qing
2. `SETUP_GUIDE.md` faylini qayta ko'rib chiqing
3. `.env` faylni tekshiring
4. Database connection'ni test qiling

**Bog'lanish:**
- Email: support@schoollms.uz
- GitHub Issues: [github.com/.../issues](https://github.com)

---

## ✅ Tekshirish Check-list

- [ ] Node.js 18+ o'rnatilgan
- [ ] PostgreSQL ishlab turibdi
- [ ] Database yaratilgan
- [ ] `.env` fayl to'ldirilgan
- [ ] `npm install` bajarilib bo'lgan
- [ ] `npm run db:push` muvaffaqiyatli
- [ ] `npm run db:seed` ishlab bo'lgan
- [ ] `npm run dev` ishga tushgan
- [ ] [http://localhost:3000](http://localhost:3000) ochiladi
- [ ] Login qilish ishlayapti

**Hammasi ✅ bo'lsa - TABRIKLAYMIZ! 🎉**

---

**Muvaffaqiyatlar!** 🚀

