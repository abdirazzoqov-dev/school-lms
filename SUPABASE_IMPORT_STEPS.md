# 📥 Supabase ga Ma'lumotlarni Import Qilish - Qadam-ba-Qadam

## ✅ Hozirgi Holat:
- ✅ backup.sql yaratildi
- ✅ Supabase da yangi loyiha yaratildi

---

# BOSQICH 1: SUPABASE DAN CONNECTION STRINGS OLISH (5 daqiqa)

## 1.1 - Supabase Dashboard ga Kiring

1. https://supabase.com/dashboard ga kiring
2. Yaratgan loyihangizni tanlang (`school-lms-production`)

## 1.2 - Connection Strings Olish

1. **Chap tarafdagi Settings (⚙️) tugmasini bosing**
2. **Database** bo'limini tanlang
3. **Connection string** bo'limiga kiring

### A. Pooling Connection (Production uchun):

1. **Connection pooling** ni tanlang
2. **URI** ni tanlang
3. **Copy** tugmasini bosing

**Ko'rinishi:**
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

📋 **Bu connection string ni nusxalab oling!** Bu `DATABASE_URL` bo'ladi.

### B. Direct Connection (Migrations uchun):

1. **Session mode** ni tanlang (pooling emas!)
2. **URI** ni tanlang
3. **Copy** tugmasini bosing

**Ko'rinishi:**
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres
```

📋 **Bu connection string ni ham nusxalab oling!** Bu `DIRECT_URL` bo'ladi.

⚠️ **MUHIM:** `[YOUR-PASSWORD]` o'rniga Supabase da yaratgan parolingizni qo'ying!

---

# BOSQICH 2: LOCAL .ENV FAYLNI YANGILASH (2 daqiqa)

## 2.1 - .env Faylini Ochish

`.env` faylini oching (loyiha root papkasida).

## 2.2 - Connection Strings Qo'shish

`.env` faylga quyidagilarni qo'shing yoki yangilang:

```env
# Supabase Connection (Pooling - Production uchun)
DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Migrations uchun)
DIRECT_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres"

# NextAuth (Local development uchun)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Super Admin (Optional)
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**MUHIM:**
- `[YOUR-PASSWORD]` o'rniga Supabase parolingizni qo'ying
- `xxxxx` o'rniga Supabase dan olgan connection string dagi haqiqiy qiymat bo'ladi

**Misol:**
```env
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:[MyPassword123!]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.abcdefghijklmnop:[MyPassword123!]@aws-0-singapore.pooler.supabase.com:5432/postgres"
```

---

# BOSQICH 3: DATABASE SCHEMA PUSH QILISH (5 daqiqa)

## 3.1 - Prisma Client Generate

Terminal da:

```bash
npm run db:generate
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
```

## 3.2 - Schema Push (Supabase ga)

```bash
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ The database is now in sync with your schema.
```

✅ **Tayyor!** Database schema Supabase ga yuklandi.

---

# BOSQICH 4: MA'LUMOTLARNI IMPORT QILISH (10 daqiqa)

## Variant 1: psql orqali (Tavsiya - Tezkor)

Agar `psql` o'rnatilgan bo'lsa:

```bash
# Windows PowerShell
psql "DIRECT_URL" -f backup.sql

# Yoki macOS/Linux
psql "DIRECT_URL" < backup.sql
```

**Misol:**
```bash
psql "postgresql://postgres.xxxxx:password@aws-0-singapore.pooler.supabase.com:5432/postgres" < backup.sql
```

⏳ 2-5 daqiqa kutish kerak (ma'lumotlar import qilinmoqda...)

---

## Variant 2: Supabase SQL Editor orqali (Agar psql yo'q bo'lsa)

### 4.1 - backup.sql Faylini Ochish

`backup.sql` faylini text editor da oching (VS Code, Notepad++, etc.)

### 4.2 - SQL Editor ga Copy Qilish

1. Supabase dashboard da:
   - **SQL Editor** bo'limini oching (chap menuda)
   - **New query** tugmasini bosing

2. `backup.sql` faylning **BARCHA CONTENT** ni:
   - Select qiling (Ctrl+A)
   - Copy qiling (Ctrl+C)
   - SQL Editor ga paste qiling (Ctrl+V)

### 4.3 - Run Qilish

1. SQL Editor da **Run** tugmasini bosing (yoki F5)

⏳ 2-5 daqiqa kutish kerak...

**Kutilayotgan natija:**
```
Success. No rows returned
```

Yoki:
```
Query executed successfully
```

✅ **Tayyor!** Ma'lumotlar import qilindi.

---

# BOSQICH 5: MA'LUMOTLARNI TEKSHIRISH (3 daqiqa)

## 5.1 - Supabase Table Editor orqali

1. Supabase dashboard da:
   - **Table Editor** bo'limini oching (chap menuda)
   - **Tenant** jadvalini tanlang
   - Ma'lumotlar borligini tekshiring

Agar ma'lumotlar ko'rinayotgan bo'lsa → ✅ **Muvaffaqiyatli!**

## 5.2 - Prisma Studio orqali

Terminal da:

```bash
npm run db:studio
```

Brauzerda: http://localhost:5555

- **Tenant** jadvalini oching
- Ma'lumotlar borligini tekshiring

✅ **Tayyor!** Ma'lumotlar to'g'ri import qilingan.

---

# BOSQICH 6: LOCAL DA TEST QILISH (5 daqiqa)

## 6.1 - Dev Server Ishga Tushirish

Terminal da:

```bash
npm run dev
```

## 6.2 - Login Qilish

Brauzerda: http://localhost:3000

- **Email:** Docker dan import qilingan email
- **Parol:** Docker dan import qilingan parol

Agar login ishlayotgan bo'lsa → ✅ **Hammasi tayyor!**

---

# ✅ TAYYOR!

## Nima qildik:

1. ✅ Supabase dan connection strings oldik
2. ✅ Local .env faylni yangiladik
3. ✅ Database schema push qildik
4. ✅ Ma'lumotlarni import qildik
5. ✅ Tekshirib ko'rdik

---

# 🔧 MUAMMOLAR VA YECHIMLAR

## 1. psql Command Not Found

**Xato:**
```
psql: command not found
```

**Yechim:**

**Windows:**
- PostgreSQL o'rnatilgan bo'lishi kerak
- Yoki Supabase SQL Editor dan foydalaning (Variant 2)

**macOS:**
```bash
brew install postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql-client
```

---

## 2. Connection Error

**Xato:**
```
could not connect to server
```

**Yechim:**
1. Connection string to'g'ri nusxalanganligini tekshiring
2. Parol to'g'ri ekanligini tekshiring
3. Supabase project active ekanligini tekshiring
4. Internet ulanishi borligini tekshiring

---

## 3. Import Error (SQL Editor da)

**Xato:**
```
syntax error
```

**Yechim:**
1. `backup.sql` fayl to'liq copy qilinganligini tekshiring
2. SQL Editor da boshqa querylar yo'qligini tekshiring
3. Agar katta fayl bo'lsa, qismma-qism import qiling

---

## 4. Schema Push Error

**Xato:**
```
Migration failed
```

**Yechim:**
1. `DIRECT_URL` .env faylda borligini tekshiring
2. `prisma/schema.prisma` da `directUrl` borligini tekshiring
3. Supabase database bo'sh emasligini tekshiring

**Agar muammo bo'lsa:**
```bash
# Prisma migrate status
npx prisma migrate status
```

---

# 📋 CHECKLIST

## Supabase Setup:
- [ ] Connection strings olindi (Pooling + Direct)
- [ ] .env fayl yangilandi
- [ ] Schema push qilindi
- [ ] Ma'lumotlar import qilindi
- [ ] Ma'lumotlar tekshirildi
- [ ] Local test qilindi

---

# 🚀 KEYINGI QADAM: VERCEL DEPLOY

Endi Vercel ga deploy qilish vaqti!

**Keyingi qadamlar:**
1. GitHub ga push qilish
2. Vercel ga import qilish
3. Environment variables qo'shish
4. Deploy!

**Batafsil:** `DOCKER_TO_VERCEL_DEPLOY.md` faylning **BOSQICH 4 va 5** qismlariga qarang.

---

**Savollar bo'lsa, so'rang!** 😊

