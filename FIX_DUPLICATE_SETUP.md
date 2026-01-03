# 🔧 Duplicate Loyiha Muammosini Hal Qilish

## ✅ Muammo Hal Qilindi!

Ikkinchi container endi ishlayapti. Endi quyidagi qadamlarni bajaring:

---

## 📋 Qadam 1: Ikkinchi Loyiha Papkasini Yaratish

```powershell
# Birinchi loyihadan ikkinchisini nusxalash
cd C:\lms
Copy-Item -Path "." -Destination "C:\lms2" -Recurse -Exclude "node_modules",".next",".git"
```

---

## 🔧 Qadam 2: .env Fayl Yaratish

`C:\lms2\.env` faylini yarating va quyidagi ma'lumotlarni kiriting:

```env
# ============================================
# IKKINCHI LOYIHA - Container 2 (Port 5434)
# ============================================
DATABASE_URL="postgresql://postgres:postgres2@localhost:5434/school_lms2?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-here-minimum-32-characters"

# Super Admin
SUPER_ADMIN_EMAIL="admin2@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**NEXTAUTH_SECRET yaratish:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 📦 Qadam 3: Dependencies O'rnatish

```powershell
cd C:\lms2
npm install
```

---

## 🗄️ Qadam 4: Database Schema Push

```powershell
cd C:\lms2
npm run db:generate
npm run db:push
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
✔ Schema is in sync with the database
```

---

## ✅ Qadam 5: Tekshirish

```powershell
# Container'lar ishlayaptimi?
docker ps | Select-String "school_lms"

# Database connection
docker exec school_lms_db2 pg_isready -U postgres
```

---

## 🚀 Qadam 6: Server'ni Ishga Tushirish

```powershell
cd C:\lms2
PORT=3001 npm run dev
```

**URL:** [http://localhost:3001](http://localhost:3001)

---

## 🐛 Agar Muammo Bo'lsa

### Muammo: "Can't reach database server"

**Yechim 1: Container ishlayaptimi tekshiring**
```powershell
docker ps | Select-String "school_lms_db2"
```

Agar ko'rinmasa:
```powershell
docker-compose up -d postgres2
```

**Yechim 2: Port to'g'rimi tekshiring**
```powershell
netstat -ano | findstr :5434
```

**Yechim 3: .env fayl to'g'rimi tekshiring**
- `DATABASE_URL` port 5434'ga ishora qilishi kerak
- `postgres2` parol to'g'ri bo'lishi kerak

---

## 📝 Xulosa

Endi sizda:
- ✅ **Ikkinchi container ishlayapti** (port 5434)
- ✅ **Ikkinchi loyiha papkasi** (C:\lms2)
- ✅ **.env fayl** sozlangan
- ✅ **Database schema** push qilingan

**Tayyor! 🎉**

