# 📊 Dashboard Guide - School LMS

Barcha rollar uchun dashboard'lar to'liq yaratildi va test qilindi.

---

## ✅ **Yaratilgan Dashboard'lar:**

### 1. 🔐 **Super Admin Dashboard** (`/super-admin`)
**Foydalanuvchi:** Tizim egasi (siz)

**Funksiyalar:**
- ✅ Barcha maktablar statistikasi
- ✅ Faol, trial, bloklangan maktablar
- ✅ Oxirgi qo'shilgan maktablar
- ✅ Subscription management

**Login:**
- Email: `admin@schoollms.uz`
- Parol: `SuperAdmin123!`

---

### 2. 👨‍💼 **Maktab Admin Dashboard** (`/admin`)
**Foydalanuvchi:** Maktab rahbariyati

**Funksiyalar:**
- ✅ O'quvchilar, o'qituvchilar soni
- ✅ Bu oyning daromadi
- ✅ Bugungi davomat statistikasi
- ✅ To'lanmagan to'lovlar
- ✅ Yangi o'quvchilar ro'yxati
- ✅ Oxirgi to'lovlar
- ✅ Sinflar, fanlar statistikasi
- ✅ **Tenant status banner** (GRACE_PERIOD, SUSPENDED, BLOCKED)

**Login:**
- Email: `admin@demo-maktab.uz`
- Parol: `Admin123!`

**Navigatsiya:**
- Dashboard
- O'quvchilar
- O'qituvchilar
- Sinflar
- Dars jadvali
- To'lovlar
- Xabarlar
- Hisobotlar
- Sozlamalar

---

### 3. 👨‍🏫 **O'qituvchi Dashboard** (`/teacher`)
**Foydalanuvchi:** O'qituvchilar

**Funksiyalar:**
- ✅ Mening o'quvchilarim soni
- ✅ Bugungi davomat
- ✅ Tekshirish kerak bo'lgan vazifalar
- ✅ Uy vazifalari statistikasi
- ✅ Bugungi darslar jadvali
- ✅ Oxirgi qo'ygan baholar
- ✅ O'qitiladigan sinflar va fanlar

**Login:**
- Email: `teacher@demo-maktab.uz`
- Parol: `Teacher123!`

**Navigatsiya:**
- Dashboard
- Mening Sinflarim
- Davomat
- Baholar
- Uy Vazifalari
- Dars Materiallari
- Xabarlar
- Hisobotlar

---

### 4. 👨‍👩‍👧 **Ota-ona Dashboard** (`/parent`)
**Foydalanuvchi:** Ota-onalar

**Funksiyalar:**
- ✅ Farzandlar ro'yxati va ma'lumotlari
- ✅ O'rtacha ball (%)
- ✅ Bu haftaning davomati
- ✅ Bu yil to'langan to'lovlar
- ✅ To'lanmagan to'lovlar soni
- ✅ Oxirgi baholar
- ✅ Oxirgi davomat ma'lumotlari
- ✅ Har bir farzand uchun alohida card

**Login:**
- Email: `parent@demo-maktab.uz`
- Parol: `Parent123!`

**Navigatsiya:**
- Dashboard
- Farzandlarim
- Baholar
- Davomat
- Uy Vazifalari
- To'lovlar
- Xabarlar
- Bildirishnomalar

---

### 5. 👨‍🎓 **O'quvchi Dashboard** (`/student`) - Phase 3
**Foydalanuvchi:** O'quvchilar

**Status:** 🚧 Struktura tayyor, funksiyalar Phase 3da qo'shiladi

**Rejalashtirilgan funksiyalar:**
- Mening baholarim
- Davomatim
- Uy vazifalarini topshirish
- Dars materiallari
- Bildirishnomalar

---

## 🎨 **Dashboard Komponentlar:**

### **1. Asosiy Komponentlar:**

#### **Statistics Cards**
- Jami o'quvchilar, o'qituvchilar
- Moliyaviy ma'lumotlar
- Davomat statistikasi
- Real-time data

#### **Recent Data Tables**
- Yangi o'quvchilar
- Oxirgi to'lovlar
- Oxirgi baholar
- Oxirgi davomat

#### **Status Indicators**
- Color-coded status badges
- Icon indicators
- Percentage displays

### **2. TenantStatusBanner Component**
**Fayl:** `components/tenant-status-banner.tsx`

**Funksiyasi:** Subscription status'ga qarab ogohlantirish

**Statuslar:**
- `GRACE_PERIOD` 🟠 - 7 kun muhlat
- `SUSPENDED` 🔴 - To'xtatilgan
- `BLOCKED` ⛔ - Bloklangan
- `ACTIVE` / `TRIAL` - Banner ko'rsatilmaydi

---

## 📊 **Ma'lumotlar Bazasi Query'lari:**

Har bir dashboard optimal ishlashi uchun:

### **Admin:**
```typescript
- db.student.count() // O'quvchilar
- db.teacher.count() // O'qituvchilar
- db.payment.aggregate() // To'lovlar
- db.attendance.count() // Davomat
```

### **Teacher:**
```typescript
- db.teacher.findUnique() // O'qituvchi ma'lumotlari
- db.classSubjects.include() // Sinflar va fanlar
- db.schedule.findMany() // Bugungi darslar
- db.assignmentSubmission.count() // Tekshirish kerak
```

### **Parent:**
```typescript
- db.parent.findUnique() // Ota-ona ma'lumotlari
- db.student.include() // Farzandlar
- db.grade.findMany() // Baholar
- db.attendance.findMany() // Davomat
- db.payment.aggregate() // To'lovlar
```

---

## 🔒 **Xavfsizlik:**

### **Server-side Rendering:**
Barcha dashboard'lar `getServerSession()` dan foydalanadi:

```typescript
const session = await getServerSession(authOptions)

if (!session || session.user.role !== 'ADMIN') {
  redirect('/unauthorized')
}
```

### **Row-Level Security:**
Har bir query'da `tenantId` filter:

```typescript
db.student.findMany({
  where: { tenantId: session.user.tenantId }
})
```

### **Role-based Access:**
Middleware har bir requestni tekshiradi:
- `/super-admin/*` - faqat SUPER_ADMIN
- `/admin/*` - faqat ADMIN
- `/teacher/*` - faqat TEACHER
- `/parent/*` - faqat PARENT
- `/student/*` - faqat STUDENT

---

## 🎯 **Navigation Struktura:**

Har bir dashboard o'z navigation'iga ega:

```
Layout
├── Header
│   ├── Logo + Role Badge
│   └── User Nav (Avatar, Logout)
├── Tenant Status Banner (if needed)
└── Main Content
    ├── Sidebar Navigation
    └── Dashboard Content
```

---

## 📱 **Responsive Design:**

Barcha dashboard'lar responsive:

- **Desktop:** Grid layout (4 columns)
- **Tablet:** Grid layout (2 columns)
- **Mobile:** Stack layout (1 column)

Tailwind classes:
```typescript
"grid gap-4 md:grid-cols-2 lg:grid-cols-4"
```

---

## 🚀 **Performance Optimization:**

### **Parallel Queries:**
```typescript
const [stat1, stat2, stat3] = await Promise.all([
  db.query1(),
  db.query2(),
  db.query3()
])
```

### **Select Only Needed Fields:**
```typescript
include: {
  user: {
    select: { fullName: true } // faqat kerakli field
  }
}
```

### **Pagination:**
```typescript
take: 5, // Faqat 5 ta
orderBy: { createdAt: 'desc' }
```

---

## ✅ **Test Qilish:**

### **1. Server ishga tushiring:**
```bash
npm run dev
```

### **2. Har bir dashboard'ga kiring:**

- Super Admin: [http://localhost:3000/super-admin](http://localhost:3000/super-admin)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
- Teacher: [http://localhost:3000/teacher](http://localhost:3000/teacher)
- Parent: [http://localhost:3000/parent](http://localhost:3000/parent)
- Student: [http://localhost:3000/student](http://localhost:3000/student)

### **3. Tekshirish:**
- ✅ Ma'lumotlar to'g'ri ko'rsatilyaptimi?
- ✅ Navigation ishlayaptimi?
- ✅ Tenant status banner ko'rsatilyaptimi?
- ✅ Logout ishlayaptimi?
- ✅ Unauthorized sahifaga redirect bo'lmaydimi?

---

## 🐛 **Troubleshooting:**

### **Ma'lumotlar ko'rsatilmayapti:**
```bash
# Database'da ma'lumot borligini tekshiring
npm run db:studio
```

### **Unauthorized error:**
```bash
# Session'ni tekshiring
# Logout qilib, qaytadan login qiling
```

### **Tenant status banner ko'rinmayapti:**
```sql
-- Database'da tenant status'ni o'zgartiring
UPDATE "Tenant" SET status = 'GRACE_PERIOD' WHERE id = 'tenant-id';
```

---

## 📝 **Keyingi Qadamlar:**

### **Phase 1 (MVP):**
- ✅ Barcha dashboard'lar yaratildi
- 🔄 CRUD operations qo'shish
- 🔄 Forms yaratish
- 🔄 API routes

### **Phase 2:**
- Online to'lovlar
- Email/SMS notifications
- File uploads

### **Phase 3:**
- Student dashboard to'liq funksionalligi
- Uy vazifalari tizimi
- Advanced analytics

---

**Barcha dashboard'lar tayyor va test qilindi! 🎉**

**Xatolarsiz ishlayapti! ✅**

