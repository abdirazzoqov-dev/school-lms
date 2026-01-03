# ⚡ Tezkor Boshlash - Ikkita Container

## 🚀 1. Container'larni Ishga Tushirish

```powershell
# PowerShell script orqali
.\start-containers.ps1

# Yoki to'g'ridan-to'g'ri
docker-compose up -d
```

## ✅ 2. Tekshirish

```powershell
# Container holatini tekshirish
.\check-containers.ps1

# Yoki
docker ps | Select-String "school_lms"
```

## 🔧 3. Environment Variables

### Birinchi Loyiha (.env)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### Ikkinchi Loyiha (.env)
```env
DATABASE_URL="postgresql://postgres:postgres2@localhost:5434/school_lms2?schema=public"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-2"
```

## 📦 4. Schema Push

### Birinchi Loyiha
```bash
cd C:\lms
npm run db:push
```

### Ikkinchi Loyiha
```bash
cd C:\lms2
npm run db:push
```

## 🛑 5. To'xtatish

```powershell
.\stop-containers.ps1
```

---

**Tayyor! 🎉**

