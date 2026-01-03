# 🔗 Supabase Connection Strings Olish - Qadam-ba-Qadam

## 📍 Hozirgi Holat:
- ✅ Supabase dashboard dasiz
- ✅ API bo'limidasiz

---

# BOSQICH 1: DATABASE BO'LIMIGA O'TISH (1 daqiqa)

## 1.1 - Settings ga Kiring

1. **Chap tarafdagi sidebar da** (chap tomonda):
   - **Settings** (⚙️) ikonkasini bosing
   - Yoki pastga scroll qiling va **Settings** ni toping

## 1.2 - Database Bo'limini Tanlang

Settings ochilgach:
- **Database** bo'limini bosing (chap menuda)

---

# BOSQICH 2: CONNECTION STRINGS OLISH (5 daqiqa)

## 2.1 - Connection String Bo'limini Toping

Database bo'limida quyidagi bo'limlarni ko'rasiz:
- Connection string
- Connection pooling
- Database settings

## 2.2 - Pooling Connection Olish (DATABASE_URL)

1. **Connection string** bo'limida:
   - **Connection pooling** ni tanlang (dropdown dan)
   - **URI** ni tanlang
   - Connection string ko'rinadi

2. **Copy** tugmasini bosing (connection string yonida)

**Ko'rinishi:**
```
postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

📋 **Bu connection string ni nusxalab oling!**

⚠️ **MUHIM:** `[YOUR-PASSWORD]` o'rniga Supabase da yaratgan parolingizni qo'ying!

**Misol:**
```
postgresql://postgres.pgkzjfacqntzsgcoqvhk:MyPassword123!@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## 2.3 - Direct Connection Olish (DIRECT_URL)

1. **Connection string** bo'limida:
   - **Session mode** ni tanlang (pooling emas!)
   - **URI** ni tanlang
   - Connection string ko'rinadi

2. **Copy** tugmasini bosing

**Ko'rinishi:**
```
postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres
```

📋 **Bu connection string ni ham nusxalab oling!**

⚠️ **MUHIM:** `[YOUR-PASSWORD]` o'rniga Supabase da yaratgan parolingizni qo'ying!

**Misol:**
```
postgresql://postgres.pgkzjfacqntzsgcoqvhk:MyPassword123!@aws-0-singapore.pooler.supabase.com:5432/postgres
```

---

# BOSQICH 3: LOCAL .ENV FAYLNI YANGILASH (2 daqiqa)

## 3.1 - .env Faylini Ochish

Loyiha papkasida `.env` faylini oching (VS Code, Notepad++, etc.)

## 3.2 - Connection Strings Qo'shish

`.env` faylga quyidagilarni qo'shing yoki yangilang:

```env
# Supabase Connection (Pooling - Production uchun)
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Migrations uchun)
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:5432/postgres"

# NextAuth (Local development uchun)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Super Admin (Optional)
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**MUHIM:**
- `[YOUR-PASSWORD]` o'rniga Supabase da yaratgan parolingizni qo'ying
- `pgkzjfacqntzsgcoqvhk` o'rniga sizning project ID ingiz bo'ladi (screenshot da ko'rinadi)

**To'liq misol:**
```env
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:MySecurePassword123!@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:MySecurePassword123!@aws-0-singapore.pooler.supabase.com:5432/postgres"
```

---

# BOSQICH 4: DATABASE SCHEMA PUSH QILISH (5 daqiqa)

## 4.1 - Terminal Ochish

Loyiha papkasida terminal oching.

## 4.2 - Prisma Client Generate

```bash
npm run db:generate
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
```

## 4.3 - Schema Push

```bash
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ The database is now in sync with your schema.
```

✅ **Tayyor!** Database schema Supabase ga yuklandi.

---

# BOSQICH 5: MA'LUMOTLARNI IMPORT QILISH (10 daqiqa)

## Variant 1: psql orqali (Agar o'rnatilgan bo'lsa)

```bash
# Windows PowerShell
psql "DIRECT_URL" -f backup.sql

# macOS/Linux
psql "DIRECT_URL" < backup.sql
```

**Misol:**
```bash
psql "postgresql://postgres.pgkzjfacqntzsgcoqvhk:MyPassword123!@aws-0-singapore.pooler.supabase.com:5432/postgres" < backup.sql
```

⏳ 2-5 daqiqa kutish kerak...

---

## Variant 2: Supabase SQL Editor orqali (Tavsiya)

### 5.1 - SQL Editor ga Kiring

1. Supabase dashboard da:
   - **Chap sidebar da** **SQL Editor** ni bosing
   - Yoki **SQL Editor** ikonkasini bosing

### 5.2 - backup.sql Faylini Ochish

`backup.sql` faylini text editor da oching (VS Code, Notepad++, etc.)

### 5.3 - SQL Editor ga Copy Qilish

1. `backup.sql` faylning **BARCHA CONTENT** ni:
   - **Select qiling** (Ctrl+A yoki Cmd+A)
   - **Copy qiling** (Ctrl+C yoki Cmd+C)

2. Supabase SQL Editor da:
   - **New query** tugmasini bosing
   - **Paste qiling** (Ctrl+V yoki Cmd+V)

### 5.4 - Run Qilish

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

# BOSQICH 6: TEKSHIRISH (3 daqiqa)

## 6.1 - Supabase Table Editor orqali

1. Supabase dashboard da:
   - **Chap sidebar da** **Table Editor** ni bosing
   - **Tenant** jadvalini tanlang
   - Ma'lumotlar borligini tekshiring

Agar ma'lumotlar ko'rinayotgan bo'lsa → ✅ **Muvaffaqiyatli!**

## 6.2 - Prisma Studio orqali

Terminal da:

```bash
npm run db:studio
```

Brauzerda: http://localhost:5555

- **Tenant** jadvalini oching
- Ma'lumotlar borligini tekshiring

✅ **Tayyor!** Ma'lumotlar to'g'ri import qilingan.

---

# BOSQICH 7: LOCAL DA TEST QILISH (5 daqiqa)

## 7.1 - Dev Server Ishga Tushirish

Terminal da:

```bash
npm run dev
```

## 7.2 - Login Qilish

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
6. ✅ Local test qildik

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

