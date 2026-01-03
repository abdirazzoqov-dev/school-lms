# 🔧 Database Connection - Final Yechim

## ❌ XATOLIK:
```
Can't reach database server at `aws-0-singapore.pooler.supabase.com:6543`
```

## SABABLAR:
1. Connection string format noto'g'ri
2. Supabase project pause qilingan
3. Internet/Firewall muammosi
4. Parol yoki project ID noto'g'ri

---

# ✅ TO'LIQ YECHIM

## BOSQICH 1: SUPABASE PROJECT STATUS TEKSHIRISH

### 1.1 - Supabase Dashboard

1. https://supabase.com/dashboard ga kiring
2. Project ni tanlang
3. **Project pause qilinganligini tekshiring**

**Agar pause qilingan bo'lsa:**
- **Resume** tugmasini bosing
- 1-2 daqiqa kutish kerak

---

## BOSQICH 2: CONNECTION STRING NI TO'G'RI OLISH

### 2.1 - Supabase Dashboard → Settings → Database

1. **Settings** (⚙️) → **Database**
2. **Connection string** bo'limiga kiring

### 2.2 - Pooling Connection (DATABASE_URL)

1. **Connection pooling** ni tanlang
2. **URI** ni tanlang
3. Connection string ko'rinadi

**To'g'ri format:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Misol:**
```
postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

📋 **Copy qiling!**

### 2.3 - Session Mode (DIRECT_URL)

1. **Session mode** ni tanlang
2. **URI** ni tanlang
3. Connection string ko'rinadi

**To'g'ri format:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**Yoki agar IPv4 muammo bo'lsa, pooler port ishlatish:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

📋 **Copy qiling!**

---

## BOSQICH 3: .ENV FAYLNI TO'LIQ YANGILASH

### 3.1 - .env Fayl Content (Copy-Paste Ready)

`.env` faylni oching va **BARCHA CONTENT** ni quyidagi bilan almashtiring:

```env
# Supabase Connection (Pooling)
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Migrations)
DIRECT_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"

# Super Admin
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**MUHIM:**
- `pgkzjfacqntzsgcoqvhk` → Supabase dan olgan project ID
- `Just2003` → Supabase parolingiz
- `aws-0-singapore` → Sizning region (singapore, ap-southeast-1, etc.)
- Ikkala connection ham **port 6543** (pooler) ishlatadi

### 3.2 - Saqlash

`Ctrl+S` bosing.

---

## BOSQICH 4: CONNECTION TEST QILISH

### 4.1 - Simple Test

PowerShell da:

```powershell
# Connection string ni test qilish
$env:DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
npx prisma db push
```

Agar ishlasa → `.env` fayl muammosi
Agar ishlamasa → Connection string yoki Supabase muammosi

---

## BOSQICH 5: ALTERNATIV YECHIMLAR

### Variant 1: Supabase Connection String Format Tekshirish

Supabase dashboard dan connection string ni **to'g'ridan-to'g'ri copy** qiling va `.env` ga qo'ying.

**Format tekshirish:**
- `postgresql://` bilan boshlanishi kerak
- `postgres.` keyin project ID
- `@aws-0-` keyin region
- Port `6543` yoki `5432`
- `?pgbouncer=true` parametri (pooling uchun)

---

### Variant 2: Internet/Firewall Tekshirish

```powershell
# Supabase server ga ping qilish
Test-NetConnection -ComputerName aws-0-singapore.pooler.supabase.com -Port 6543
```

Agar timeout bo'lsa → Internet yoki Firewall muammosi

---

### Variant 3: Supabase Project Settings

1. Supabase dashboard da:
   - **Settings** → **Database**
   - **Connection pooling** enabled ekanligini tekshiring
   - **IPv4 add-on** kerak bo'lishi mumkin

---

### Variant 4: Prisma Schema da directUrl ni Optional Qilish

Agar `DIRECT_URL` muammo bo'lsa, vaqtincha migrations o'rniga `db push` ishlatish:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // directUrl = env("DIRECT_URL")  // Vaqtincha comment qiling
}
```

Keyin:
```powershell
npx prisma db push
```

**Lekin bu tavsiya qilinmaydi** - production da `directUrl` kerak.

---

## BOSQICH 6: SUPABASE DAN TO'G'RI CONNECTION STRING OLISH (Qayta)

### 6.1 - Supabase Dashboard

1. https://supabase.com/dashboard
2. Project ni tanlang
3. **Settings** → **Database**

### 6.2 - Connection String Modal

1. **"Connect to your project"** tugmasini bosing (yoki connection string bo'limida)
2. Modal ochiladi

### 6.3 - Pooling Connection

1. **Method** dropdown da:
   - **"Connection pooling"** ni tanlang
2. **Type** dropdown da:
   - **"URI"** ni tanlang
3. Connection string ko'rinadi
4. **Copy** tugmasini bosing

**Bu `DATABASE_URL` bo'ladi.**

### 6.4 - Session Mode Connection

1. **Method** dropdown da:
   - **"Session mode"** ni tanlang
2. **Type** dropdown da:
   - **"URI"** ni tanlang
3. Connection string ko'rinadi
4. **Copy** tugmasini bosing

**Bu `DIRECT_URL` bo'ladi.**

⚠️ **MUHIM:** Connection string larni **to'g'ridan-to'g'ri copy** qiling, o'zgartirmang!

---

## BOSQICH 7: .ENV FAYLNI YANGILASH (Qayta)

Supabase dan olgan connection string larni `.env` faylga **to'g'ridan-to'g'ri** qo'ying:

```env
DATABASE_URL="[SUPABASE DAN COPY QILINGAN POOLING CONNECTION]"
DIRECT_URL="[SUPABASE DAN COPY QILINGAN SESSION MODE CONNECTION]"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**MUHIM:** Connection string larni o'zgartirmang, to'g'ridan-to'g'ri copy qiling!

---

## BOSQICH 8: QAYTA URINIB KO'RISH

### 8.1 - Terminal ni Yopish va Yangi Ochish

1. Joriy terminal ni yoping
2. VS Code da yangi terminal oching (`Ctrl+``)

### 8.2 - Prisma db push

```powershell
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ The database is now in sync with your schema.
```

---

# 🔍 DEBUGGING

## Connection String Format Tekshirish

`.env` faylda connection string quyidagicha bo'lishi kerak:

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:[PORT]/postgres[?PARAMS]
```

**Misol:**
```
postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Tekshirish:**
- ✅ `postgresql://` bilan boshlanadi
- ✅ `postgres.` keyin project ID
- ✅ `@` keyin host
- ✅ Port `6543` yoki `5432`
- ✅ `/postgres` keyin database nomi

---

## Supabase Project Status

1. Supabase dashboard da:
   - Project **active** ekanligini tekshiring
   - **Pause** qilingan bo'lmasligi kerak
   - **Settings** → **Database** da connection pooling enabled

---

## Internet Connection

```powershell
# Supabase ga ping
ping aws-0-singapore.pooler.supabase.com
```

Agar timeout bo'lsa → Internet yoki Firewall muammosi

---

# ✅ FINAL CHECKLIST

- [ ] Supabase project active (pause qilinmagan)
- [ ] Connection strings Supabase dan to'g'ridan-to'g'ri copy qilingan
- [ ] .env fayl to'g'ri format
- [ ] Connection string `postgresql://` bilan boshlanadi
- [ ] Port 6543 yoki 5432
- [ ] Parol to'g'ri
- [ ] Terminal qayta ishga tushirildi
- [ ] db:push ishlayapti

---

# 🚨 AGAR HALI HAM MUAMMO BO'LSA

## Variant 1: Supabase Support

1. Supabase dashboard da:
   - **Help** → **Support**
   - Connection muammosini yozing

## Variant 2: Alternative Database

Agar Supabase muammo bo'lsa:
- **Railway** (https://railway.app)
- **Neon** (https://neon.tech)
- **Render** (https://render.com)

---

**Eng muhimi: Supabase dan connection string larni to'g'ridan-to'g'ri copy qiling, o'zgartirmang!** 😊

