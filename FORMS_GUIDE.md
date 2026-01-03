# LMS Forms Guide

Bu hujjatda barcha CRUD formalar, ularning validatsiyalari va server actions haqida to'liq ma'lumot berilgan.

## 📁 Fayl Tuzilishi

```
lib/validations/       # Zod validation schemas
  ├── tenant.ts
  ├── student.ts
  ├── teacher.ts
  ├── class.ts
  └── payment.ts

app/actions/           # Server Actions (API)
  ├── tenant.ts
  ├── student.ts
  ├── teacher.ts
  ├── class.ts
  └── payment.ts

app/(dashboard)/
  ├── super-admin/
  │   └── tenants/
  │       └── create/page.tsx
  └── admin/
      ├── students/create/page.tsx
      ├── teachers/create/page.tsx
      ├── classes/create/page.tsx
      └── payments/create/page.tsx

app/api/               # GET API routes
  ├── classes/route.ts
  ├── teachers/route.ts
  └── students/route.ts

components/ui/         # Form components
  ├── select.tsx
  ├── textarea.tsx
  ├── input.tsx
  ├── label.tsx
  └── button.tsx
```

---

## 1️⃣ Super Admin - Create Tenant (Maktab Yaratish)

### Path
- **URL**: `/super-admin/tenants/create`
- **Validation**: `lib/validations/tenant.ts`
- **Server Action**: `app/actions/tenant.ts`

### Form Maydonlari

| Maydon | Turi | Required | Validatsiya |
|--------|------|----------|-------------|
| name | string | ✅ | min 3 belgi |
| slug | string | ✅ | min 3, max 50, faqat a-z0-9- |
| email | string | ❌ | email formati |
| phone | string | ❌ | - |
| address | string | ❌ | - |
| subscriptionPlan | enum | ✅ | BASIC/STANDARD/PREMIUM |
| trialDays | number | ✅ | 0-90 kun |

### Funksionallik
- Auto-generate slug from name
- Tenant yaratish
- Default admin user avtomatik yaratiladi
  - Email: `admin@[slug].uz`
  - Parol: `Admin123!`
- Subscription plan bo'yicha limitlar o'rnatiladi:
  - **BASIC**: 50 o'quvchi, 10 o'qituvchi
  - **STANDARD**: 200 o'quvchi, 30 o'qituvchi
  - **PREMIUM**: Cheksiz

### Server Action
```typescript
createTenant(data: TenantFormData): Promise<{
  success: boolean
  error?: string
  tenant?: Tenant
  adminCredentials?: { email: string, password: string }
}>
```

---

## 2️⃣ Admin - Add Student (O'quvchi Qo'shish)

### Path
- **URL**: `/admin/students/create`
- **Validation**: `lib/validations/student.ts`
- **Server Action**: `app/actions/student.ts`

### Form Maydonlari

#### O'quvchi Ma'lumotlari
| Maydon | Turi | Required | Validatsiya |
|--------|------|----------|-------------|
| fullName | string | ✅ | min 3 belgi |
| studentCode | string | ✅ | min 2 belgi, unique |
| dateOfBirth | date | ✅ | - |
| gender | enum | ✅ | MALE/FEMALE |
| classId | string | ❌ | - |
| address | string | ❌ | - |

#### Ota-ona Ma'lumotlari
| Maydon | Turi | Required | Validatsiya |
|--------|------|----------|-------------|
| parentFullName | string | ✅ | min 3 belgi |
| parentEmail | string | ✅ | email, unique |
| parentPhone | string | ✅ | min 9 belgi |
| parentRelationship | enum | ✅ | father/mother/guardian |

### Funksionallik
- Generate student code (STD24001)
- Tenant limit tekshiruvi (maxStudents)
- Agar ota-ona email mavjud bo'lsa - mavjudga bog'lanadi
- Aks holda yangi parent user yaratiladi:
  - Default parol: `Parent123!`
- Student-Parent relation yaratiladi

### Server Action
```typescript
createStudent(data: StudentFormData): Promise<{
  success: boolean
  error?: string
  student?: Student
  parentCredentials?: { email: string, password: string } | null
}>
```

---

## 3️⃣ Admin - Add Teacher (O'qituvchi Qo'shish)

### Path
- **URL**: `/admin/teachers/create`
- **Validation**: `lib/validations/teacher.ts`
- **Server Action**: `app/actions/teacher.ts`

### Form Maydonlari

| Maydon | Turi | Required | Validatsiya |
|--------|------|----------|-------------|
| fullName | string | ✅ | min 3 belgi |
| email | string | ✅ | email, unique |
| phone | string | ❌ | - |
| teacherCode | string | ✅ | min 2 belgi, unique |
| specialization | string | ✅ | min 3 belgi |
| education | string | ❌ | - |
| experienceYears | number | ❌ | 0-50 |
| password | string | ✅ | min 6 belgi |

### Funksionallik
- Generate teacher code (TCH24001)
- Generate random password
- Tenant limit tekshiruvi (maxTeachers)
- User account yaratish (TEACHER role)
- Password hash qilish

### Server Action
```typescript
createTeacher(data: TeacherFormData): Promise<{
  success: boolean
  error?: string
  teacher?: Teacher
  credentials?: { email: string, password: string }
}>
```

---

## 4️⃣ Admin - Add Class (Sinf Yaratish)

### Path
- **URL**: `/admin/classes/create`
- **Validation**: `lib/validations/class.ts`
- **Server Action**: `app/actions/class.ts`

### Form Maydonlari

| Maydon | Turi | Required | Validatsiya |
|--------|------|----------|-------------|
| name | string | ✅ | min 2 belgi (masalan: 7-A) |
| gradeLevel | number | ✅ | 1-11 |
| classTeacherId | string | ❌ | - |
| roomNumber | string | ❌ | - |
| maxStudents | number | ✅ | 10-50 |

### Funksionallik
- Auto-suggest name based on gradeLevel (7-A)
- Current academic year avtomatik o'rnatiladi
- Sinf nomi academic year uchun unique
- Teachers ro'yxati dinamik yuklash (API)

### Server Action
```typescript
createClass(data: ClassFormData): Promise<{
  success: boolean
  error?: string
  class?: Class
}>
```

---

## 5️⃣ Admin - Create Payment (To'lov Qabul Qilish)

### Path
- **URL**: `/admin/payments/create`
- **Validation**: `lib/validations/payment.ts`
- **Server Action**: `app/actions/payment.ts`

### Form Maydonlari

| Maydon | Turi | Required | Validatsiya |
|--------|------|----------|-------------|
| studentId | string | ✅ | - |
| amount | number | ✅ | > 0 |
| paymentType | enum | ✅ | TUITION/BOOKS/UNIFORM/OTHER |
| paymentMethod | enum | ✅ | CASH (MVP), CLICK/PAYME/UZUM (disabled) |
| dueDate | date | ✅ | - |
| paidDate | date | ❌ | - |
| receiptNumber | string | ❌ | - |
| notes | string | ❌ | - |

### Funksionallik
- Generate receipt number (RCP202401001)
- Students ro'yxati dinamik yuklash (API)
- Auto-generate invoice number
- Agar paidDate kiritilsa, status = COMPLETED
- Aks holda status = PENDING
- Parent avtomatik topiladi va bog'lanadi

### Server Action
```typescript
createPayment(data: PaymentFormData): Promise<{
  success: boolean
  error?: string
  payment?: Payment
}>
```

---

## 🔗 API Routes (GET endpoints)

### 1. Get Classes
```
GET /api/classes
```
- Current academic year sinflarini qaytaradi
- O'quvchilar sonini count bilan

### 2. Get Teachers
```
GET /api/teachers
```
- Tenant o'qituvchilarini qaytaradi
- User ma'lumotlari bilan

### 3. Get Students
```
GET /api/students
```
- Tenant o'quvchilarini qaytaradi
- Sinf ma'lumotlari bilan

---

## 🎨 UI Components

### Form Components
- **Select**: Radix UI-based dropdown
- **Textarea**: Multi-line text input
- **Input**: Single-line text input
- **Label**: Form labels
- **Button**: Action buttons
- **Card**: Form containers

### User Experience
- **Loading states**: Spinner bilan
- **Error handling**: Toast notifications
- **Success feedback**: Redirect + toast
- **Auto-generation**: Code va parol uchun
- **Validation**: Real-time client-side + server-side
- **Empty states**: Agar list bo'sh bo'lsa

---

## 🔐 Security & Validation

### Client-side (Zod)
- Form input validatsiyasi
- Type safety (TypeScript)
- Error messages (O'zbekcha)

### Server-side
- Session tekshiruvi (NextAuth)
- Role-based access control
- Tenant isolation (tenantId)
- Unique constraint checks
- Tenant limits validation
- Password hashing (bcrypt)

---

## 📝 Navigation Updates

Barcha list sahifalardagi "Add" buttonlar yangilandi:

- `/super-admin/tenants` → "Yangi Maktab" → `/create`
- `/admin/students` → "Yangi O'quvchi" → `/create`
- `/admin/teachers` → "Yangi O'qituvchi" → `/create`
- `/admin/classes` → "Yangi Sinf" → `/create`
- `/admin/payments` → "To'lov Qabul Qilish" → `/create`

---

## 🚀 Keyingi Qadamlar

### Edit Forms (Tahrirlash)
- Tenant edit
- Student edit
- Teacher edit
- Class edit
- Payment edit

### Delete Functionality
- Soft delete (status change)
- Confirmation modals
- Cascade delete handling

### Bulk Operations
- Import from Excel/CSV
- Bulk student registration
- Bulk payment processing

### Advanced Features
- File upload (photo, documents)
- Email/SMS notifications
- Payment reminders
- Report generation
- Activity logs

---

## 🐛 Troubleshooting

### Common Issues

1. **"Ruxsat berilmagan" error**
   - Session tekshiring
   - Role to'g'ri ekanligini tasdiqlang

2. **"Limit yetdi" error**
   - Tenant subscription plan'ni ko'ring
   - Upgrade kerak bo'lishi mumkin

3. **"Already exists" error**
   - Unique maydonlarni tekshiring (email, code, slug)

4. **API 401 error**
   - NextAuth session valid ekanligini tekshiring
   - Login qaytadan urinib ko'ring

5. **Form submit ishlamayapti**
   - Browser console'da xatolarni ko'ring
   - Network tab'da request/response tekshiring

---

## ✅ Testing Checklist

### Super Admin
- [ ] Tenant yaratish
- [ ] Slug uniqueness tekshirish
- [ ] Default admin user yaratilishini tekshirish
- [ ] Trial period o'rnatilishi

### Admin - Students
- [ ] O'quvchi qo'shish
- [ ] Student code generatsiyasi
- [ ] Parent yaratish yoki mavjudga bog'lash
- [ ] Class assignment
- [ ] Limit tekshiruvi

### Admin - Teachers
- [ ] O'qituvchi qo'shish
- [ ] Teacher code generatsiyasi
- [ ] Password generatsiyasi
- [ ] Limit tekshiruvi

### Admin - Classes
- [ ] Sinf yaratish
- [ ] Teacher assignment
- [ ] Academic year avtomatik
- [ ] Name uniqueness (per year)

### Admin - Payments
- [ ] To'lov yaratish
- [ ] Invoice generatsiyasi
- [ ] Status avtomatik (paid date ga qarab)
- [ ] Student va parent bog'lanishi

---

**Yozilgan sana**: 2024-11-26  
**Versiya**: 1.0  
**Holat**: ✅ MVP Complete

