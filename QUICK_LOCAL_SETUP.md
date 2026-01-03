# ⚡ TEZKOR LOCAL SETUP (3 daqiqa)

Lokal kompyuterda Docker PostgreSQL bilan ishlash uchun tezkor qo'llanma.

---

## 🚀 3 QADAMDA ISHGA TUSHIRISH

### 1️⃣ Docker Container Ishga Tushirish (30 soniya)

```powershell
docker-compose up -d
```

**Tekshirish:**
```powershell
docker ps
```

✅ Container `school_lms_db` ishlayapti bo'lishi kerak.

---

### 2️⃣ .env Fayl Sozlash (1 daqiqa)

`.env` fayl yarating yoki oching va quyidagilarni qo'ying:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**MUHIM:** Port `5433` (docker-compose.yml da 5433:5432)

---

### 3️⃣ Schema Push va Dev Server (1 daqiqa)

```powershell
npx prisma db push
npm run dev
```

**Brauzerda:** http://localhost:3000

✅ **Tayyor!** Lokal development ishlayapti!

---

## 🔄 SUPABASE GA O'TISH

Agar Supabase ga o'tmoqchi bo'lsangiz:

1. `.env` faylda `DATABASE_URL` ni Supabase connection string bilan almashtiring
2. `npx prisma db push` qiling

**Batafsil:** `LOCAL_DEVELOPMENT_GUIDE.md` ga qarang.

---

## 🛠️ FOYDALI BUYRUQLAR

### Docker Container:
```powershell
docker-compose up -d          # Ishga tushirish
docker-compose down           # To'xtatish
docker-compose logs -f        # Loglarni ko'rish
```

### Database:
```powershell
npm run db:push               # Schema push
npm run db:studio             # Prisma Studio (http://localhost:5555)
npm run db:seed               # Demo ma'lumotlar
```

---

**Batafsil qo'llanma:** `LOCAL_DEVELOPMENT_GUIDE.md`

