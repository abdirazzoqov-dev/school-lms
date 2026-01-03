# Prisma Generate EPERM Error - Yechim

## ❌ Muammo:
```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp' -> 'query_engine-windows.dll.node'
```

## ✅ Yechim:

### 1. **Dev Server'ni To'xtatish**

Terminal'da:
```powershell
# Ctrl+C bosib dev server'ni to'xtating
```

### 2. **Prisma Generate Qilish**

```powershell
npx prisma generate
```

### 3. **Agar Hali Ham Muammo Bo'lsa:**

#### Variant A: Node Processes'ni To'xtatish
```powershell
# Barcha node processes'ni to'xtatish
taskkill /F /IM node.exe

# Keyin generate qilish
npx prisma generate
```

#### Variant B: .prisma Folder'ni O'chirish
```powershell
# .prisma folder'ni o'chirish
Remove-Item -Recurse -Force node_modules\.prisma

# Keyin generate qilish
npx prisma generate
```

#### Variant C: To'liq Qayta O'rnatish
```powershell
# node_modules o'chirish
Remove-Item -Recurse -Force node_modules

# Qayta o'rnatish
npm install

# Prisma generate
npx prisma generate
```

### 4. **Dev Server'ni Qayta Ishga Tushirish**

```powershell
npm run dev
```

---

## ⚠️ MUHIM:

**Database schema allaqachon sync qilingan!** ✅

Faqat Prisma client generate qilish kerak. Database'da Permission table yaratilgan.

