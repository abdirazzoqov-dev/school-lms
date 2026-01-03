# 🔧 EPERM Error - Windows File Lock Yechimi

## ❌ XATOLIK:
```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node'
```

## SABAB:
Windows da file lock - boshqa process file ni ishlatmoqda.

---

# YECHIMLAR (Qadam-ba-Qadam)

## YECHIM 1: Barcha Processlarni Yopish (Tavsiya)

### 1.1 - VS Code ni To'liq Yopish

1. **VS Code da:**
   - `Ctrl+Shift+P` bosing
   - "Close Window" yozing va Enter
   - Yoki barcha VS Code oynalarini yoping

### 1.2 - Terminal ni Yopish va Yangi Ochish

1. **Joriy terminal ni yoping**
2. **Yangi PowerShell terminal oching** (Administrator sifatida)
3. Loyiha papkasiga kiring:

```powershell
cd C:\lms
```

### 1.3 - Prisma Client ni Tozalash

```powershell
# .prisma papkasini o'chirish
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue

# node_modules/.prisma/client papkasini ham
Remove-Item -Recurse -Force node_modules\.prisma\client -ErrorAction SilentlyContinue
```

### 1.4 - Generate Qilish

```powershell
npm run db:generate
```

---

## YECHIM 2: Task Manager orqali Process ni To'xtatish

### 2.1 - Task Manager Ochish

1. `Ctrl+Shift+Esc` bosing
2. Yoki `Ctrl+Alt+Delete` → Task Manager

### 2.2 - Node Processlarni To'xtatish

1. **Details** tab ni oching
2. **node.exe** processlarni toping
3. **End Task** tugmasini bosing (barcha node processlar)

### 2.3 - Qayta Urinib Ko'ring

```powershell
npm run db:generate
```

---

## YECHIM 3: node_modules ni To'liq Qayta O'rnatish

### 3.1 - node_modules ni O'chirish

```powershell
# node_modules ni o'chirish
Remove-Item -Recurse -Force node_modules

# package-lock.json ni ham o'chirish (optional)
Remove-Item -Force package-lock.json
```

### 3.2 - Qayta O'rnatish

```powershell
npm install
```

### 3.3 - Generate Qilish

```powershell
npm run db:generate
```

---

## YECHIM 4: Prisma Client ni Alohida O'rnatish

### 4.1 - Prisma Client ni O'chirish

```powershell
npm uninstall @prisma/client
```

### 4.2 - Qayta O'rnatish

```powershell
npm install @prisma/client
```

### 4.3 - Generate Qilish

```powershell
npx prisma generate
```

---

## YECHIM 5: Administrator Terminal (Eng Kuchli)

### 5.1 - PowerShell ni Administrator sifatida Ochish

1. **Start** tugmasini bosing
2. **PowerShell** ni qidiring
3. **Right-click** → **Run as administrator**

### 5.2 - Loyiha Papkasiga Kiring

```powershell
cd C:\lms
```

### 5.3 - Prisma Client ni Tozalash va Generate

```powershell
# Tozalash
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue

# Generate
npm run db:generate
```

---

## YECHIM 6: Prisma Studio ni Yopish

Agar Prisma Studio ochiq bo'lsa:

1. **Prisma Studio** ni yoping (brauzer va terminal)
2. Terminal da `Ctrl+C` bosing (agar ishlayotgan bo'lsa)
3. Keyin generate qiling:

```powershell
npm run db:generate
```

---

## YECHIM 7: Dev Server ni Yopish

Agar `npm run dev` ishlayotgan bo'lsa:

1. Terminal da `Ctrl+C` bosing
2. Keyin generate qiling:

```powershell
npm run db:generate
```

---

# ✅ ENG SAMARALI YECHIM (Tavsiya)

## Qadam-ba-Qadam:

### 1. Barcha Processlarni Yopish

```powershell
# Task Manager da barcha node.exe processlarni to'xtatish
# Yoki terminal da:
Get-Process node | Stop-Process -Force
```

### 2. VS Code ni Yopish

VS Code ni to'liq yoping.

### 3. Administrator Terminal Ochish

PowerShell ni **Run as administrator** sifatida oching.

### 4. Loyiha Papkasiga Kiring

```powershell
cd C:\lms
```

### 5. Prisma Client ni Tozalash

```powershell
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
```

### 6. Generate Qilish

```powershell
npm run db:generate
```

---

# AGAR HALI HAM MUAMMO BO'LSA

## Variant 1: Kompyuterni Qayta Ishga Tushirish

Ba'zida file lock juda qattiq bo'ladi. Kompyuterni qayta ishga tushirish yechadi.

## Variant 2: Prisma Versiyasini Yangilash

```powershell
npm install prisma@latest @prisma/client@latest
npm run db:generate
```

## Variant 3: node_modules ni To'liq Qayta O'rnatish

```powershell
Remove-Item -Recurse -Force node_modules
npm install
npm run db:generate
```

---

# 📋 CHECKLIST

- [ ] VS Code yopildi
- [ ] Barcha terminal yopildi
- [ ] Task Manager da node.exe processlar to'xtatildi
- [ ] Administrator terminal ochildi
- [ ] .prisma papkasi o'chirildi
- [ ] db:generate ishlayapti

---

**Eng oson yechim: Kompyuterni qayta ishga tushirish va keyin `npm run db:generate` qilish!** 😊

