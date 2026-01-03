# 🔧 PRISMA RELATION ERROR FIX

## ❌ Muammo

```
Error: Invalid `prisma.student.findFirst()` invocation

Unknown field `attendance` for include statement on model `Student`. 
Available options are marked with ?.
? attendances?: true
```

**Sabab:**
- Prisma schema'da relation nomi: `attendances` (ko'plik)
- Kod'da ishlatilgan: `attendance` (birlik)
- Mos emas!

---

## ✅ YECHIM

### Prisma Schema
```prisma
model Student {
  id           String       @id @default(cuid())
  // ...
  attendances  Attendance[] @relation("StudentAttendance")  // ✅ Ko'plik!
  // ...
}

model Attendance {
  id        String   @id @default(cuid())
  student   Student  @relation("StudentAttendance", fields: [studentId], references: [id])
  studentId String
  // ...
}
```

### Noto'g'ri Kod ❌
```typescript
const student = await db.student.findFirst({
  include: {
    attendance: {  // ❌ Birlik - ERROR!
      orderBy: { date: 'desc' },
      take: 20
    }
  }
})

// Ishlatish
{student.attendance.length}  // ❌ ERROR!
{student.attendance.map(...)}  // ❌ ERROR!
```

### To'g'ri Kod ✅
```typescript
const student = await db.student.findFirst({
  include: {
    attendances: {  // ✅ Ko'plik - TO'G'RI!
      orderBy: { date: 'desc' },
      take: 20
    }
  }
})

// Ishlatish
{student.attendances.length}  // ✅ TO'G'RI!
{student.attendances.map(...)}  // ✅ TO'G'RI!
```

---

## 📁 TUZATILGAN FAYL

### Student Detail Page
```
✅ app/(dashboard)/admin/students/[id]/page.tsx
   - Line 73: attendance → attendances (include)
   - Line 194: student.attendance → student.attendances
   - Line 284: student.attendance → student.attendances
   - Line 349: student.attendance → student.attendances
   - Line 361: student.attendance → student.attendances
```

**Jami 5ta joy tuzatildi!**

---

## 🔍 QANDAY TOPISH

### 1. Prisma Error Message'da
```
Available options are marked with ?.
? attendances?: true  ← Bu to'g'ri nom!
```

### 2. Prisma Schema Tekshirish
```bash
# Schema file
prisma/schema.prisma

# Qidiramiz
attendances  Attendance[]  # ✅ Ko'plik
```

### 3. TypeScript IntelliSense
```typescript
const student = await db.student.findFirst({
  include: {
    // Ctrl+Space - VS Code to'g'ri variantlarni ko'rsatadi
    attendances: true  // ✅
  }
})
```

---

## 📊 PRISMA RELATION QOIDALARI

### One-to-Many Relations (Ko'plik)
```prisma
model Student {
  payments     Payment[]      // ✅ Ko'plik []
  grades       Grade[]        // ✅ Ko'plik []
  attendances  Attendance[]   // ✅ Ko'plik []
}
```

```typescript
// Include
include: {
  payments: true,      // ✅ Ko'plik
  grades: true,        // ✅ Ko'plik
  attendances: true    // ✅ Ko'plik
}

// Ishlatish
student.payments.map(...)      // ✅
student.grades.length          // ✅
student.attendances.filter(...)  // ✅
```

### One-to-One / Many-to-One (Birlik)
```prisma
model Student {
  user    User    @relation(...)  // ✅ Birlik
  class   Class?  @relation(...)  // ✅ Birlik (optional)
}
```

```typescript
// Include
include: {
  user: true,   // ✅ Birlik
  class: true   // ✅ Birlik
}

// Ishlatish
student.user.fullName     // ✅
student.class?.name       // ✅ (optional)
```

---

## ⚠️ UMUMIY XATOLAR

### ❌ Qilmang
```typescript
// 1. Noto'g'ri relation nomi
include: { attendance: true }  // ❌ Schema'da attendances

// 2. Ko'plikni birlik sifatida ishlatish
const att = student.attendance  // ❌ attendances array

// 3. Mavjud bo'lmagan field
include: { assignmentSubmissions: true }  // ❌ Agar schema'da yo'q
```

### ✅ Qiling
```typescript
// 1. Schema'dagi nom bilan bir xil
include: { attendances: true }  // ✅

// 2. To'g'ri data structure
const atts = student.attendances  // ✅ Array
atts.map(...)  // ✅

// 3. Faqat schema'dagi relationlar
// Avval schema'ni tekshiring!
```

---

## 🧪 TEST QILISH

### 1. Student Detail Page
```bash
1. Browser'ni refresh qiling
2. /admin/students/[id] sahifasiga o'ting
3. Sahifa to'g'ri ochilishi kerak ✅
4. Davomat tab'da ma'lumotlar ko'rinadi ✅
5. Hech qanday Prisma error yo'q ✅
```

### 2. Prisma Studio
```bash
# Prisma Studio'ni oching
npm run db:studio

# Student model'ni ko'ring
# Relations:
- attendances ✅
- payments ✅
- grades ✅
- parents ✅
```

---

## 🎯 XULOSA

**Muammo:**
- Schema: `attendances` (ko'plik)
- Kod: `attendance` (birlik)
- Mos emas → ERROR!

**Yechim:**
- ✅ Include: `attendances: { ... }`
- ✅ Ishlatish: `student.attendances.map(...)`
- ✅ Barcha joyda to'g'rilandi

**Natija:**
- ✅ Hech qanday Prisma error yo'q
- ✅ Student detail sahifasi ishlaydi
- ✅ Davomat ma'lumotlari ko'rsatiladi

---

## 📝 ESLATMA

Prisma bilan ishlashda:
1. **Schema'ni tekshiring** - relation nomi qanday?
2. **Error message'ni o'qing** - "Available options" ko'rsatiladi
3. **TypeScript IntelliSense** - Ctrl+Space yordamida
4. **Birlik vs Ko'plik** - `[]` belgisi ko'plikni bildiradi

**Test qiling va xabar bering!** 🚀

