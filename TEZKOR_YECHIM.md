# ⚡ TEZKOR YECHIM - Prisma Xatoliklari

## 🔴 Xatolik: `Cannot find module '@prisma/client/runtime/library.js'`

### ✅ Yechim (3 qadam):

```bash
# 1️⃣ Prisma ni to'g'ri versiyaga o'zgartiring
npm uninstall prisma @prisma/client
npm install prisma@5.22.0 @prisma/client@5.22.0

# 2️⃣ Client ni generate qiling
npx prisma generate

# 3️⃣ Serverni ishga tushiring
npm run dev
```

---

## 🔴 Server ishlamayapti?

```bash
# Cache ni tozalang
Remove-Item -Path ".\.next" -Recurse -Force

# Serverni qaytadan ishga tushiring
npm run dev
```

---

## 🔴 Database ulanmayapti?

```bash
# 1. Prisma Client ni qayta yarating
npx prisma generate

# 2. Database migratsiyasini tekshiring
npx prisma db push

# 3. Serverni restart qiling
npm run dev
```

---

## 📋 FOYDALI BUYRUQLAR:

```bash
# Prisma versiyasini ko'rish
npx prisma version

# Database ni ochish (Studio)
npx prisma studio

# Migration yaratish
npx prisma migrate dev --name migration_nomi

# Schema ni database ga push qilish
npx prisma db push

# Prisma Client generate
npx prisma generate

# Node modules ni qayta o'rnatish (oxirgi chora)
Remove-Item -Path "node_modules" -Recurse -Force
npm install
```

---

## ⚠️ ESDA TUTING:

1. Har safar schema o'zgarganida: `npx prisma generate`
2. Har safar Prisma yangilanganida: `npx prisma generate`
3. Xatolik bo'lsa: Cache ni tozalang va restart qiling

---

## 🎯 JORIY VERSIYALAR:

```
Prisma: 5.22.0
@prisma/client: 5.22.0
Next.js: 14.1.0
```

**❌ v7 ga YANGILAMANG!** (Breaking changes bor)

---

**Yordam kerakmi?** `PRISMA_V7_MUAMMOSI_YECHIMI.md` ni o'qing

