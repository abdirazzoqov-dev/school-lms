# 🔧 Vercel Deployment - Muammolarni Hal Qilish Qo'llanmasi

## ❌ MUAMMO: Kompyuterida 100% ishlayapti, Vercel'da to'liq ishlamayapti

---

## 📋 TEKSHIRUV RO'YXATI

### 1️⃣ ENVIRONMENT VARIABLES TEKSHIRISH (MUHIM!)

Vercel Dashboard → Project → Settings → Environment Variables

Quyidagi variables **BARCHASI** qo'shilganligini tekshiring:

#### ✅ Zaruriy Variables:

| Variable | Qayerdan | Environment |
|----------|----------|-------------|
| `DATABASE_URL` | Supabase → Settings → Database → Connection pooling → URI | Production, Preview, Development |
| `NEXTAUTH_URL` | Vercel domain (masalan: `https://your-project.vercel.app`) | Production |
| `NEXTAUTH_SECRET` | Terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Production, Preview, Development |
| `DIRECT_URL` | Supabase → Settings → Database → Session mode → URI | Production, Preview, Development (optional) |

#### 🔍 Tekshirish:

1. Vercel Dashboard ga kiring
2. Project ni tanlang
3. **Settings** → **Environment Variables**
4. Har bir variable borligini tekshiring
5. **Environment** (Production/Preview/Development) to'g'ri tanlanganligini tekshiring

---

### 2️⃣ DATABASE CONNECTION TEKSHIRISH

#### A. Supabase Project Status

1. [Supabase Dashboard](https://supabase.com/dashboard) ga kiring
2. Project ni tanlang
3. **Project pause qilinganligini tekshiring**
   - ❌ Agar pause qilingan bo'lsa → **Resume** tugmasini bosing
   - ✅ Green dot ko'rinishi kerak (Active)

#### B. Connection String Format

**To'g'ri format (Pooling):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Misol:**
```
postgresql://postgres.pgkzjfacqntzsgcoqvhk:YourPassword123@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**⚠️ MUHIM:**
- Port: `6543` (pooling) yoki `5432` (direct)
- `?pgbouncer=true` parametri bo'lishi kerak
- Parol to'g'ri kiritilganligini tekshiring

#### C. Vercel Build Logs tekshirish

1. Vercel Dashboard → Project → **Deployments**
2. Eng so'nggi deployment ni tanlang
3. **Build Logs** ni oching
4. Quyidagi xatolarni qidiring:
   - `Can't reach database server`
   - `P1001: Can't reach database server`
   - `Environment variable not found: DATABASE_URL`

---

### 3️⃣ NEXTAUTH SOZLAMALARI

#### A. NEXTAUTH_URL

**Production uchun:**
```
https://your-project-name.vercel.app
```

**⚠️ MUHIM:**
- `http://` emas, `https://` bo'lishi kerak
- Domain to'g'ri (Vercel sizga bergan domain)
- Trailing slash (`/`) bo'lmasligi kerak

#### B. NEXTAUTH_SECRET

**Yangi secret yaratish:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ MUHIM:**
- Production uchun yangi secret yaratish kerak (local bilan bir xil bo'lmasin!)
- 32 xonali hex string bo'lishi kerak
- Barcha environment (Production, Preview, Development) uchun qo'shish kerak

---

### 4️⃣ BUILD XATOLARI

#### A. Build Logs tekshirish

1. Vercel Dashboard → Deployments → Build Logs
2. Quyidagi xatolarni qidiring:

**TypeScript xatolari:**
- `Type error: ...`
- `Cannot find module ...`

**Prisma xatolari:**
- `Prisma schema loaded from prisma/schema.prisma`
- `Generated Prisma Client`
- `DATABASE_URL not set`

**Next.js xatolari:**
- `Failed to compile`
- `Module not found`

#### B. Build Command tekshirish

`vercel.json` faylida:
```json
{
  "buildCommand": "npm run vercel-build"
}
```

`package.json` da:
```json
{
  "scripts": {
    "vercel-build": "node scripts/vercel-build.js"
  }
}
```

---

### 5️⃣ RUNTIME XATOLARI

#### A. Function Logs tekshirish

1. Vercel Dashboard → Project → **Functions**
2. Yoki **Deployments** → **Function Logs**
3. Quyidagi xatolarni qidiring:

**Database xatolari:**
- `P1001: Can't reach database server`
- `P2002: Unique constraint failed`
- `P2025: Record not found`

**NextAuth xatolari:**
- `NEXTAUTH_URL is not set`
- `NEXTAUTH_SECRET is not set`
- `Invalid credentials`

**API xatolari:**
- `500 Internal Server Error`
- `401 Unauthorized`
- `403 Forbidden`

---

## ✅ YECHIMLAR

### YECHIM 1: Environment Variables Qo'shish/Yangilash

#### Qadam 1: Supabase Connection String Olish

1. Supabase Dashboard → **Settings** → **Database**
2. **Connection string** bo'limiga kiring
3. **Method:** "Connection pooling" ni tanlang
4. **Type:** "URI" ni tanlang
5. Connection string ni **copy** qiling
6. `[PASSWORD]` o'rniga parolingizni qo'ying

#### Qadam 2: Vercel ga Qo'shish

1. Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. **Add New** tugmasini bosing
3. Quyidagilarni qo'shing:

**DATABASE_URL:**
```
Key: DATABASE_URL
Value: [Supabase connection string - pooling mode]
Environment: ✅ Production, ✅ Preview, ✅ Development
```

**NEXTAUTH_URL:**
```
Key: NEXTAUTH_URL
Value: https://your-project-name.vercel.app
Environment: ✅ Production
```

**NEXTAUTH_SECRET:**
```
Key: NEXTAUTH_SECRET
Value: [32-xonali-random-string]
Environment: ✅ Production, ✅ Preview, ✅ Development
```

4. Har birini **Save** qiling

#### Qadam 3: Redeploy

1. Vercel Dashboard → **Deployments**
2. Eng so'nggi deployment ni tanlang
3. **Redeploy** tugmasini bosing
4. Yoki yangi commit push qiling

---

### YECHIM 2: Database Connection Tuzatish

#### A. Supabase Project Resume

1. Supabase Dashboard → Project
2. Agar pause qilingan bo'lsa → **Resume** tugmasini bosing
3. 1-2 daqiqa kutish

#### B. Connection String To'g'rilash

**Noto'g'ri:**
```
postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

**To'g'ri (Pooling):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Vercel'da yangilash:**
1. Settings → Environment Variables
2. `DATABASE_URL` ni **Edit** qiling
3. Yangi connection string ni qo'ying
4. **Save** → **Redeploy**

---

### YECHIM 3: NextAuth Sozlamalarini Tuzatish

#### A. NEXTAUTH_URL To'g'rilash

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. Production domain ni ko'ring (masalan: `school-lms-abc123.vercel.app`)
3. Settings → Environment Variables
4. `NEXTAUTH_URL` ni **Edit** qiling
5. Qiymat: `https://school-lms-abc123.vercel.app` (o'z domeningizni qo'ying)
6. **Save** → **Redeploy**

#### B. NEXTAUTH_SECRET Yangilash

1. Terminal da yangi secret yarating:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Vercel Dashboard → Settings → Environment Variables
3. `NEXTAUTH_SECRET` ni **Edit** qiling
4. Yangi secret ni qo'ying
5. **Save** → **Redeploy**

---

### YECHIM 4: Build Xatolarini Tuzatish

#### A. TypeScript Xatolari

Agar build log da TypeScript xatolari ko'rsatilgan bo'lsa:

1. Local'da build qiling:
```powershell
npm run build
```

2. Xatolarni tuzating
3. GitHub ga push qiling
4. Vercel avtomatik rebuild qiladi

#### B. Prisma Xatolari

Agar Prisma xatolari ko'rsatilgan bo'lsa:

1. `scripts/vercel-build.js` faylini tekshiring
2. `DATABASE_URL` mavjudligini tekshiring
3. Vercel Environment Variables da `DATABASE_URL` borligini tekshiring

---

### YECHIM 5: Runtime Xatolarini Tuzatish

#### A. Database Connection Xatolari

**Xatolik:** `P1001: Can't reach database server`

**Yechim:**
1. Supabase project active ekanligini tekshiring
2. Connection string to'g'ri ekanligini tekshiring
3. Parol to'g'ri ekanligini tekshiring
4. Vercel Environment Variables da `DATABASE_URL` borligini tekshiring

#### B. NextAuth Xatolari

**Xatolik:** `NEXTAUTH_URL is not set` yoki `Invalid credentials`

**Yechim:**
1. `NEXTAUTH_URL` Production environment uchun qo'shilganligini tekshiring
2. `NEXTAUTH_SECRET` barcha environment uchun qo'shilganligini tekshiring
3. URL to'g'ri formatda ekanligini tekshiring (`https://...`)

---

## 🔍 QO'SHIMCHA TEKSHIRUV

### 1. Vercel Build Logs

1. Vercel Dashboard → **Deployments**
2. Deployment ni tanlang
3. **Build Logs** ni oching
4. Quyidagilarni qidiring:
   - ✅ `✔ Compiled successfully`
   - ✅ `✔ Generated Prisma Client`
   - ❌ `Error: ...`
   - ❌ `Failed to compile`

### 2. Vercel Function Logs

1. Vercel Dashboard → **Functions**
2. Yoki **Deployments** → **Function Logs**
3. Runtime xatolarni ko'ring

### 3. Browser Console

1. Vercel'da deploy qilingan saytni oching
2. Browser Developer Tools (F12)
3. **Console** tab ni oching
4. Xatolarni qidiring

### 4. Network Tab

1. Browser Developer Tools → **Network** tab
2. Saytni refresh qiling
3. Failed requests ni qidiring
4. Status code va error messages ni ko'ring

---

## 📝 CHECKLIST

Quyidagi checklist ni bajarib, barcha muammolarni hal qiling:

- [ ] **Environment Variables:**
  - [ ] `DATABASE_URL` qo'shilgan (Production, Preview, Development)
  - [ ] `NEXTAUTH_URL` qo'shilgan (Production)
  - [ ] `NEXTAUTH_SECRET` qo'shilgan (Production, Preview, Development)
  - [ ] `DIRECT_URL` qo'shilgan (optional)

- [ ] **Database:**
  - [ ] Supabase project active (pause qilingan emas)
  - [ ] Connection string to'g'ri format (pooling mode)
  - [ ] Parol to'g'ri kiritilgan

- [ ] **NextAuth:**
  - [ ] `NEXTAUTH_URL` to'g'ri domain (https://...)
  - [ ] `NEXTAUTH_SECRET` yangi secret (production uchun)

- [ ] **Build:**
  - [ ] Build muvaffaqiyatli (`✔ Compiled successfully`)
  - [ ] Prisma Client generated
  - [ ] TypeScript xatolari yo'q

- [ ] **Deploy:**
  - [ ] Deployment muvaffaqiyatli
  - [ ] Function logs da xatolar yo'q
  - [ ] Sayt ochiladi va ishlayapti

---

## 🆘 YORDAM

Agar muammo hal bo'lmasa:

1. **Vercel Build Logs** ni to'liq ko'rib chiqing
2. **Vercel Function Logs** ni ko'rib chiqing
3. **Browser Console** da xatolarni ko'ring
4. **Network Tab** da failed requests ni ko'ring
5. Muammo haqida batafsil ma'lumot yuboring

---

## 📞 MUAMMO ANIQLASH

Quyidagi ma'lumotlarni yuboring:

1. **Vercel Build Logs** (eng so'nggi deployment)
2. **Vercel Function Logs** (agar runtime xatolar bo'lsa)
3. **Browser Console** xatolari (agar sayt ochilmasa)
4. **Environment Variables** ro'yxati (sensitive ma'lumotlarsiz)
5. **Supabase Project Status** (active/pause)

---

## ✅ MUAMMO HAL QILINGAN

Agar barcha qadamlarni bajardikdan keyin ham muammo hal bo'lmasa, quyidagilarni tekshiring:

1. **Vercel Plan Limits** - Free plan da ba'zi cheklovlar bo'lishi mumkin
2. **Supabase Plan Limits** - Free plan da connection limit bo'lishi mumkin
3. **GitHub Repository** - Code to'g'ri push qilinganligini tekshiring
4. **Vercel Project Settings** - Build command va output directory to'g'ri ekanligini tekshiring

---

**Yakuniy eslatma:** Ko'pincha muammo Environment Variables da. Barcha zaruriy variables qo'shilganligini va to'g'ri qiymatlarga ega ekanligini tekshiring!

