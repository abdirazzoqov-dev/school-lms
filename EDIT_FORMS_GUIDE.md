# LMS Edit Forms Guide

Bu hujjatda barcha EDIT/UPDATE formalar, ularning funksionallik va limitatsiyalari haqida to'liq ma'lumot berilgan.

## 📁 Yaratilgan Fayllar

### Server Actions (Update functions)
```
app/actions/
  ├── tenant.ts    → updateTenant(), updateTenantStatus()
  ├── student.ts   → updateStudent()
  ├── teacher.ts   → updateTeacher()
  ├── class.ts     → updateClass()
  └── payment.ts   → updatePayment()
```

### Edit Pages
```
app/(dashboard)/
  ├── super-admin/tenants/[id]/edit/page.tsx
  └── admin/
      ├── students/[id]/edit/page.tsx
      ├── teachers/[id]/edit/page.tsx
      ├── classes/[id]/edit/page.tsx
      └── payments/[id]/edit/page.tsx
```

### GET API Routes (Load existing data)
```
app/api/
  ├── tenants/[id]/route.ts
  ├── students/[id]/route.ts
  ├── teachers/[id]/route.ts
  ├── classes/[id]/route.ts
  └── payments/[id]/route.ts
```

---

## 1️⃣ Super Admin - Edit Tenant

### Path
- **URL**: `/super-admin/tenants/[id]/edit`
- **Server Action**: `updateTenant()`
- **GET API**: `/api/tenants/[id]`

### Tahrir Mumkin Bo'lgan Maydonlar

| Maydon | O'zgartirish | Izoh |
|--------|--------------|------|
| name | ✅ | Maktab nomi |
| slug | ✅ | Unique bo'lishi kerak |
| email | ✅ | - |
| phone | ✅ | - |
| address | ✅ | - |
| subscriptionPlan | ✅ | Limitlar avtomatik yangilanadi |

### Tahrir Mumkin EMAS

| Maydon | Sabab |
|--------|-------|
| status | Alohida `updateTenantStatus()` funksiyasi orqali |
| trialEndsAt | Faqat yaratishda |
| subscriptionEnd | Subscription management orqali |

### Funksionallik
- Slug uniqueness tekshiruvi
- Subscription plan o'zgarsa, limitlar yangilanadi
- Mavjud data yuklash (loading state)
- Validation (client + server)

### ⚠️ Ogohlantirish
```
• Slug o'zgartirilsa, admin login ham o'zgaradi (admin@[slug].uz)
• Subscription plan o'zgarsa, limitlar ham yangilanadi
• Mavjud o'quvchi/o'qituvchilar soni yangi limitdan ko'p bo'lmasligi kerak
```

---

## 2️⃣ Admin - Edit Student

### Path
- **URL**: `/admin/students/[id]/edit`
- **Server Action**: `updateStudent()`
- **GET API**: `/api/students/[id]`

### Tahrir Mumkin Bo'lgan Maydonlar

| Maydon | O'zgartirish | Izoh |
|--------|--------------|------|
| studentCode | ✅ | Unique bo'lishi kerak |
| dateOfBirth | ✅ | - |
| gender | ✅ | MALE/FEMALE |
| classId | ✅ | Boshqa sinfga o'tkazish |
| address | ✅ | - |

### Tahrir Mumkin EMAS

| Maydon | Sabab |
|--------|-------|
| fullName | User jadvalida (Parent Access bilan bog'liq) |
| parentInfo | Alohida parent management |
| status | Alohida status management |

### Funksionallik
- Student code uniqueness tekshiruvi
- Class assignment (dropdown)
- Date picker for DOB
- Loading state

### ⚠️ Ogohlantirish
```
• Ota-ona ma'lumotlarini tahrirlash uchun alohida sahifadan foydalaning
• O'quvchi kodini o'zgartirganda unique ekanligiga ishonch hosil qiling
```

---

## 3️⃣ Admin - Edit Teacher

### Path
- **URL**: `/admin/teachers/[id]/edit`
- **Server Action**: `updateTeacher()`
- **GET API**: `/api/teachers/[id]`

### Tahrir Mumkin Bo'lgan Maydonlar

| Maydon | O'zgartirish | Izoh |
|--------|--------------|------|
| fullName | ✅ | User jadvalida yangilanadi |
| phone | ✅ | User jadvalida |
| teacherCode | ✅ | Unique bo'lishi kerak |
| specialization | ✅ | - |
| education | ✅ | - |
| experienceYears | ✅ | - |

### Tahrir Mumkin EMAS

| Maydon | Sabab |
|--------|-------|
| email | Security risk (login identifier) |
| password | Alohida password reset funksiyasi kerak |

### Funksionallik
- Teacher code uniqueness tekshiruvi
- User va Teacher jadvali birgalikda yangilanadi
- Loading state
- Education textarea

### ⚠️ Ogohlantirish
```
• Email va parolni o'zgartirish uchun alohida funksiya kerak (Security)
• O'qituvchi kodini o'zgartirganda unique ekanligiga ishonch hosil qiling
```

---

## 4️⃣ Admin - Edit Class

### Path
- **URL**: `/admin/classes/[id]/edit`
- **Server Action**: `updateClass()`
- **GET API**: `/api/classes/[id]`

### Tahrir Mumkin Bo'lgan Maydonlar

| Maydon | O'zgartirish | Izoh |
|--------|--------------|------|
| name | ✅ | Academic year uchun unique |
| gradeLevel | ✅ | 1-11 |
| classTeacherId | ✅ | Sinf rahbarini o'zgartirish |
| roomNumber | ✅ | - |
| maxStudents | ✅ | 10-50 |

### Tahrir Mumkin EMAS

| Maydon | Sabab |
|--------|-------|
| academicYear | O'zgarmaydi (o'quv yili uchun) |

### Funksionallik
- Class name uniqueness (per academic year)
- Teacher dropdown (load via API)
- Grade level selector (1-11)
- Max students validation

---

## 5️⃣ Admin - Edit Payment

### Path
- **URL**: `/admin/payments/[id]/edit`
- **Server Action**: `updatePayment()`
- **GET API**: `/api/payments/[id]`

### Tahrir Mumkin Bo'lgan Maydonlar

| Maydon | O'zgartirish | Izoh |
|--------|--------------|------|
| amount | ✅ | - |
| paymentType | ✅ | TUITION/BOOKS/UNIFORM/OTHER |
| paymentMethod | ✅ | CASH (MVP) |
| dueDate | ✅ | - |
| paidDate | ✅ | Status avtomatik COMPLETED |
| receiptNumber | ✅ | - |
| notes | ✅ | - |

### Tahrir Mumkin EMAS

| Maydon | Sabab |
|--------|-------|
| studentId | O'quvchini o'zgartirib bo'lmaydi |
| invoiceNumber | Accounting integrity |
| parentId | Avtomatik bog'langan |

### Funksionallik
- Student info (readonly display)
- Invoice number (readonly)
- paidDate → status auto-update to COMPLETED
- receivedBy auto-set to current user

### ⚠️ Ogohlantirish
```
• To'langan sana kiritilsa, status avtomatik COMPLETED bo'ladi
• Invoice number o'zgartirilmaydi
• O'quvchini o'zgartirib bo'lmaydi (yangi to'lov yarating)
```

---

## 🔄 Update Actions Xususiyatlari

### 1. **Partial Updates**
Barcha update funksiyalar `Partial<FormData>` qabul qiladi - faqat o'zgargan maydonlar yuboriladi.

### 2. **Uniqueness Checks**
```typescript
// Example: updateStudent
if (data.studentCode) {
  const existingStudent = await db.student.findFirst({
    where: {
      tenantId,
      studentCode: data.studentCode,
      NOT: { id: studentId }  // ← Current record exclude qilish
    }
  })
}
```

### 3. **Related Data Updates**
Ba'zi update'lar bir nechta jadval yangilaydi:

```typescript
// updateTeacher - User va Teacher
await db.user.update({ fullName, phone })
await db.teacher.update({ teacherCode, specialization, ... })
```

### 4. **Auto-calculations**
```typescript
// updateTenant - Plan o'zgarsa limitlar yangilanadi
if (data.subscriptionPlan) {
  updateData.maxStudents = planLimits.maxStudents
  updateData.maxTeachers = planLimits.maxTeachers
}

// updatePayment - paidDate bo'lsa status COMPLETED
if (data.paidDate) {
  updateData.status = 'COMPLETED'
  updateData.receivedById = session.user.id
}
```

---

## 🎨 UI Patterns

### Loading States
```tsx
const [loading, setLoading] = useState(false)        // Submit loading
const [dataLoading, setDataLoading] = useState(true) // Initial data loading

if (dataLoading) {
  return <Loader2 className="h-8 w-8 animate-spin" />
}
```

### Data Fetching
```tsx
useEffect(() => {
  Promise.all([
    fetch(`/api/entity/${id}`).then(res => res.json()),
    fetch('/api/related-data').then(res => res.json())
  ]).then(([entityData, relatedData]) => {
    setFormData({ ...entityData.entity })
    setRelatedData(relatedData)
    setDataLoading(false)
  })
}, [id])
```

### Form Pre-population
```tsx
// Date fields
dateOfBirth: data.dateOfBirth 
  ? new Date(data.dateOfBirth).toISOString().split('T')[0]
  : ''

// Nullable fields
classId: data.classId || ''
phone: data.phone || ''
```

### Readonly Fields Display
```tsx
<div className="rounded-md bg-muted p-4">
  <p className="text-sm font-medium mb-1">O'quvchi</p>
  <p className="text-sm">{paymentInfo?.student?.user?.fullName}</p>
  <p className="text-xs text-muted-foreground">
    {paymentInfo?.student?.class?.name}
  </p>
</div>
```

---

## 🔐 Security

### Session Check
```typescript
const session = await getServerSession(authOptions)

if (!session || session.user.role !== 'ADMIN') {
  return { success: false, error: 'Ruxsat berilmagan' }
}
```

### Tenant Isolation
```typescript
const student = await db.student.findFirst({
  where: { 
    id: params.id,
    tenantId  // ← Har doim tenantId tekshiruvi
  }
})
```

### Role-based Access
- **SUPER_ADMIN**: Tenant edit
- **ADMIN**: Student, Teacher, Class, Payment edit
- **TEACHER**: Faqat o'z ma'lumotlari (future)
- **PARENT**: Faqat ko'rish (future)

---

## 📋 Test Checklist

### Super Admin - Edit Tenant
- [ ] Slug uniqueness tekshirish
- [ ] Subscription plan o'zgarishida limitlar yangilanishi
- [ ] Form data to'g'ri yuklanishi
- [ ] Validation errors

### Admin - Edit Student
- [ ] Student code uniqueness
- [ ] Class assignment o'zgarishi
- [ ] Date of birth format
- [ ] Ota-ona ma'lumotlari readonly

### Admin - Edit Teacher
- [ ] Teacher code uniqueness
- [ ] User va Teacher jadvali yangilanishi
- [ ] Email readonly (o'zgarmasligi)
- [ ] Experience years validation

### Admin - Edit Class
- [ ] Class name uniqueness (per academic year)
- [ ] Teacher assignment
- [ ] Max students range (10-50)
- [ ] Room number optional

### Admin - Edit Payment
- [ ] paidDate → status auto COMPLETED
- [ ] Amount validation
- [ ] Student info readonly
- [ ] Invoice number readonly

---

## 🐛 Common Issues & Fixes

### 1. **Data not loading**
```
Sabab: API route yo'q yoki 401 error
Fix: API route yaratilganligini va session valid ekanligini tekshiring
```

### 2. **Form not submitting**
```
Sabab: Server action import qilinmagan yoki validation fail
Fix: Console.log va network tab tekshiring
```

### 3. **"Not found" error**
```
Sabab: Tenant isolation - boshqa tenant ma'lumotini edit qilmoqda
Fix: tenantId tekshiruvi API route'da mavjudligini tasdiqlang
```

### 4. **Uniqueness not working**
```
Sabab: NOT { id } qo'shilmagan - current recordni exclude qilmayapti
Fix: Uniqueness check'da NOT condition qo'shing
```

### 5. **Related data not updating**
```
Sabab: Bir nechta jadval update kerak (e.g. User + Teacher)
Fix: Transaction yoki ketma-ket update'lar
```

---

## 🚀 Future Enhancements

### Phase 2
- [ ] Password change funksiyasi (Teacher)
- [ ] Email change funksiyasi (Security check)
- [ ] Bulk edit (multiple records)
- [ ] Revision history (audit log)
- [ ] Undo/Redo functionality

### Phase 3
- [ ] Teacher self-edit (own profile)
- [ ] Parent profile edit
- [ ] Student status management
- [ ] Payment refund/cancellation
- [ ] File upload (photo, documents)

### Phase 4
- [ ] Advanced validation (business rules)
- [ ] Approval workflow (changes need approval)
- [ ] Real-time collaboration
- [ ] Conflict resolution
- [ ] Versioning

---

## ✅ Summary

### Yaratilgan:
- ✅ 5 ta Update Server Actions
- ✅ 5 ta Edit Pages (with loading states)
- ✅ 5 ta GET API Routes
- ✅ Form pre-population
- ✅ Validation (client + server)
- ✅ Uniqueness checks
- ✅ Related data updates
- ✅ Auto-calculations
- ✅ Security checks

### Key Features:
- **Partial updates** - faqat o'zgargan maydonlar
- **Tenant isolation** - har doim tenantId tekshiruvi
- **Uniqueness validation** - duplicate oldini olish
- **Related data** - bir nechta jadval birga yangilash
- **Auto-calculations** - status, limits, etc
- **UX** - loading states, readonly fields, warnings

---

**Yozilgan sana**: 2024-11-26  
**Versiya**: 1.0  
**Holat**: ✅ Edit Forms Complete

