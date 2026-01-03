# LMS Detail Pages Guide

Bu hujjatda barcha Detail/View pages, ularning tuzilishi va funksionallik haqida to'liq ma'lumot berilgan.

## 📁 Yaratilgan Fayllar

### Detail Pages
```
app/(dashboard)/
  ├── super-admin/tenants/[id]/page.tsx
  └── admin/
      ├── students/[id]/page.tsx
      ├── teachers/[id]/page.tsx
      ├── classes/[id]/page.tsx
      └── payments/[id]/page.tsx
```

### UI Components
```
components/ui/tabs.tsx  # Radix UI Tabs component
```

---

## 1️⃣ Super Admin - Tenant Detail

### Path
- **URL**: `/super-admin/tenants/[id]`
- **GET API**: `/api/tenants/[id]` (allaqachon mavjud)

### Ko'rsatiladigan Ma'lumotlar

#### Basic Information
- Maktab nomi
- Slug (@slug)
- Email, telefon, manzil
- Status (badge + icon)
- Subscription plan

#### Subscription Info
- Current plan (BASIC/STANDARD/PREMIUM)
- Trial ends at (agar TRIAL status bo'lsa)
- Subscription end date
- Created date

#### Usage Statistics (Progress bars)
- O'quvchilar: X / MaxStudents (%)
  - Red: > 90%
  - Orange: > 70%
  - Blue: < 70%
- O'qituvchilar: X / MaxTeachers (%)

#### Quick Stats Cards
- O'quvchilar soni
- O'qituvchilar soni
- Sinflar soni
- Foydalanuvchilar soni

#### Admin Users List
- Admin foydalanuvchilar ro'yxati
- Ism, email, created date

### Actions
- **Edit** button → `/super-admin/tenants/[id]/edit`
- **Back** button → `/super-admin/tenants`

---

## 2️⃣ Admin - Student Detail

### Path
- **URL**: `/admin/students/[id]`
- **GET API**: `/api/students/[id]`

### Ko'rsatiladigan Ma'lumotlar

#### Basic Information
- To'liq ism
- Student code
- Tug'ilgan sana
- Jinsi (O'g'il bola / Qiz bola)
- Status badge (ACTIVE/GRADUATED/EXPELLED)
- Manzil

#### Quick Stats Cards
- Baholar soni
- Davomat soni
- To'lovlar soni

#### Class Information
- Sinf nomi
- Xona raqami
- Sinf rahbari ismi

#### Parents Information
- Ota-ona ismlari
- Email va telefon
- Relationship (father/mother/guardian)
- isPrimary badge

#### Tabs
1. **Baholar (Grades)**
   - Oxirgi 10 ta baho
   - Fan, baho, turi, sana, o'qituvchi
   - Table formatida

2. **Davomat (Attendance)**
   - Oxirgi 20 kun
   - Sana, fan, status (PRESENT/ABSENT/LATE/EXCUSED), izoh
   - Color-coded status

3. **To'lovlar (Payments)**
   - Payment summary cards (Jami, To'langan, Qarzdorlik)
   - Oxirgi 10 ta to'lov
   - Invoice, summa, status

### Actions
- **Edit** button → `/admin/students/[id]/edit`
- **Back** button → `/admin/students`

---

## 3️⃣ Admin - Teacher Detail

### Path
- **URL**: `/admin/teachers/[id]`
- **GET API**: `/api/teachers/[id]`

### Ko'rsatiladigan Ma'lumotlar

#### Basic Information
- To'liq ism
- Teacher code
- Mutaxassislik
- Email, telefon
- Tajriba (yillar)
- Qo'shilgan sana
- Ta'lim (education)

#### Quick Stats Cards
- Dars beradigan sinflar soni
- Sinf rahbari (soni)
- Berilgan baholar soni

#### Classes as Class Teacher
- Mas'ul bo'lgan sinflar ro'yxati
- Sinf nomi, o'quvchilar soni, xona
- Clickable → class detail

#### Teaching Classes/Subjects
- Dars beradigan sinflar va fanlar
- Table: Sinf, Fan, Haftalik soat
- Links to class detail

#### Recent Grades Given
- Oxirgi 10 ta berilgan baho
- Table: O'quvchi, Fan, Baho, Turi, Sana
- Links to student detail

### Actions
- **Edit** button → `/admin/teachers/[id]/edit`
- **Back** button → `/admin/teachers`

---

## 4️⃣ Admin - Class Detail

### Path
- **URL**: `/admin/classes/[id]`
- **GET API**: `/api/classes/[id]`

### Ko'rsatiladigan Ma'lumotlar

#### Basic Information
- Sinf nomi (masalan: 7-A)
- Sinf darajasi (1-11)
- Xona raqami
- O'quv yili (academicYear)
- Maksimal o'quvchilar
- Hozirgi o'quvchilar soni

#### Quick Stats Cards
- O'quvchilar soni
- Fanlar soni
- To'ldirilish foizi (%)

#### Class Teacher
- Sinf rahbari ma'lumotlari
- Ism, email, telefon
- Clickable → teacher detail

#### Subjects Table
- Fan nomi
- O'qituvchi
- Haftalik soat
- Links to teacher detail

#### Occupancy Progress Bar
- X / MaxStudents o'quvchi
- Visual progress bar (Red/Orange/Blue)

#### Students List (Grid)
- Barcha o'quvchilar ro'yxati
- Ism va student code
- Grid layout (3 columns)
- Clickable → student detail

### Actions
- **Edit** button → `/admin/classes/[id]/edit`
- **Back** button → `/admin/classes`

---

## 5️⃣ Admin - Payment Detail

### Path
- **URL**: `/admin/payments/[id]`
- **GET API**: `/api/payments/[id]`

### Ko'rsatiladigan Ma'lumotlar

#### Status Card (Highlighted)
- Status badge + icon
- Status text (COMPLETED/PENDING/FAILED)
- Muddati o'tgan warning (agar kerak bo'lsa)
- Summa (katta, bold)
- Payment type

#### Payment Information
- Invoice raqami (mono font)
- Chek raqami (agar mavjud bo'lsa)
- To'lov turi (TUITION/BOOKS/UNIFORM/OTHER)
- To'lov usuli (CASH badge)
- Summa (katta, blue)

#### Dates
- Yaratilgan sana (date + time)
- Muddat (dueDate)
  - Red text agar o'tgan bo'lsa
- To'langan sana (agar mavjud)
  - Green text
- Izoh (notes)

#### Student Information
- O'quvchi ismi
- Student code
- Sinf
- Clickable → student detail

#### Parent Information
- Ota-ona ismi
- Email, telefon

#### Received By
- Qabul qilgan admin/user
- Ism, email

### Actions
- **Edit** button → `/admin/payments/[id]/edit` (faqat agar COMPLETED emas)
- **Back** button → `/admin/payments`

---

## 🎨 UI Patterns & Best Practices

### 1. Page Layout Structure
```tsx
<div className="space-y-6">
  {/* Header with back button and title */}
  {/* Status/Important info card */}
  {/* Main grid (2 or 3 columns) */}
  {/* Related data sections */}
  {/* Tabs (if needed) */}
</div>
```

### 2. Header Pattern
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    <Link href="/back"><Button variant="ghost" size="icon">
      <ArrowLeft />
    </Button></Link>
    <div>
      <h2>{Title} with Icon</h2>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  </div>
  <Link href="/edit"><Button>Edit</Button></Link>
</div>
```

### 3. Status Badges & Colors
```tsx
// Status icons
ACTIVE → CheckCircle2 (green)
TRIAL → Clock (blue)
PENDING → Clock (orange)
COMPLETED → CheckCircle2 (green)
FAILED → XCircle (red)

// Background colors
bg-green-100 text-green-800  // Success
bg-blue-100 text-blue-800    // Info
bg-orange-100 text-orange-800 // Warning
bg-red-100 text-red-800      // Error
```

### 4. Quick Stats Cards
```tsx
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center gap-3">
      <Icon className="h-8 w-8 text-{color}-600" />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### 5. Progress Bars
```tsx
<div className="w-full bg-gray-200 rounded-full h-2.5">
  <div
    className={`h-2.5 rounded-full ${
      percentage > 90 ? 'bg-red-600' :
      percentage > 70 ? 'bg-orange-600' : 'bg-blue-600'
    }`}
    style={{ width: `${Math.min(percentage, 100)}%` }}
  ></div>
</div>
```

### 6. Clickable Cards/Links
```tsx
<Link href={`/detail/${id}`}>
  <div className="p-4 rounded-lg border hover:border-primary transition-colors">
    {/* Content */}
  </div>
</Link>
```

### 7. Tabs Component
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Label 1 ({count})</TabsTrigger>
    <TabsTrigger value="tab2">Label 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">{/* Content */}</TabsContent>
  <TabsContent value="tab2">{/* Content */}</TabsContent>
</Tabs>
```

---

## 🔗 Navigation & Links

### Internal Links
Barcha detail pageslarda related entities'ga linklar mavjud:

**Student Detail:**
- Class → `/admin/classes/[id]`
- Payments (har biri ko'rsatilmagan, lekin mumkin)

**Teacher Detail:**
- Classes (as class teacher) → `/admin/classes/[id]`
- Classes (teaching) → `/admin/classes/[id]`
- Students (in grades) → `/admin/students/[id]`

**Class Detail:**
- Class teacher → `/admin/teachers/[id]`
- Subject teachers → `/admin/teachers/[id]`
- Students → `/admin/students/[id]`

**Payment Detail:**
- Student → `/admin/students/[id]`

### Edit Links
- Edit button har bir page'da (status va permission'ga qarab)
- Edit page URL: `{current_url}/edit`

---

## 📊 Data Display Strategies

### 1. **Tables** (Ko'p ma'lumot)
- Grades, Attendance, Subjects
- Sortable (future)
- Pagination (future)

### 2. **Cards** (Individual items)
- Parents, Admin users, Related entities
- Visual separation
- Clickable

### 3. **Grid Layout** (List of similar items)
- Students list (in class detail)
- 2-3 columns responsive

### 4. **Stats Cards** (Numbers/Metrics)
- Quick overview
- Icon + number + label
- Color-coded

### 5. **Progress Bars** (Percentages)
- Usage limits
- Occupancy
- Visual indicator with colors

---

## 🎯 Key Features

### Real-time Data
- Server-side rendered (SSR)
- Fresh data on every visit
- No stale data

### Responsive Design
- Mobile-friendly
- Grid adapts (1/2/3 columns)
- Tables scroll horizontally on small screens

### Visual Hierarchy
- Important info at top
- Color-coded status
- Icons for context
- Clear sections

### Navigation
- Breadcrumb-like back buttons
- Internal links to related data
- Edit actions prominent

### Empty States
- Meaningful messages
- "Hozircha ... yo'q"
- Suggest actions (future)

---

## 🔐 Security & Permissions

### Access Control
```typescript
// Every detail page checks:
const session = await getServerSession(authOptions)
if (!session || session.user.role !== 'EXPECTED_ROLE') {
  redirect('/unauthorized')
}
```

### Tenant Isolation
```typescript
// Always filter by tenantId
const entity = await db.entity.findFirst({
  where: { 
    id: params.id,
    tenantId  // ← Prevents cross-tenant access
  }
})
```

### Not Found Handling
```typescript
if (!entity) {
  redirect('/back-to-list')
}
```

---

## 📋 Test Checklist

### Super Admin - Tenant Detail
- [ ] Basic info ko'rsatilishi
- [ ] Status badge to'g'ri rangi
- [ ] Progress bars to'g'ri foizlar
- [ ] Admin users ro'yxati
- [ ] Edit button ishlashi

### Admin - Student Detail
- [ ] Asosiy ma'lumotlar
- [ ] Class info (agar mavjud)
- [ ] Parents list
- [ ] Tabs switching
- [ ] Grades table
- [ ] Attendance table
- [ ] Payments summary
- [ ] Links to related pages

### Admin - Teacher Detail
- [ ] Basic info
- [ ] Class teacher cards
- [ ] Teaching subjects table
- [ ] Recent grades
- [ ] All links working

### Admin - Class Detail
- [ ] Basic info
- [ ] Class teacher card
- [ ] Subjects table
- [ ] Occupancy progress
- [ ] Students grid
- [ ] All links working

### Admin - Payment Detail
- [ ] Status card styling
- [ ] Overdue warning (agar kerak)
- [ ] Student info
- [ ] Parent info (agar mavjud)
- [ ] Received by (agar to'langan)
- [ ] Edit button (faqat pending uchun)

---

## 🐛 Common Issues & Solutions

### 1. **Data not loading**
```
Sabab: API route yo'q yoki permission issues
Fix: Check GET API route va session
```

### 2. **"Not found" redirect**
```
Sabab: Tenant isolation - boshqa tenant data
Fix: Ensure tenantId filter in query
```

### 3. **Links not working**
```
Sabab: Wrong href or entity not found
Fix: Check href paths va entity existence
```

### 4. **Tabs not switching**
```
Sabab: Radix UI dependency yo'q
Fix: npm install @radix-ui/react-tabs
```

### 5. **Responsive issues**
```
Sabab: Fixed widths yoki overflow hidden
Fix: Use responsive classes (md:, lg:)
```

---

## 🚀 Future Enhancements

### Phase 2
- [ ] Print/Export functionality (PDF)
- [ ] Share button (link copy)
- [ ] Activity history tab
- [ ] Comments/Notes section
- [ ] Document attachments

### Phase 3
- [ ] Real-time updates (WebSocket)
- [ ] Inline editing
- [ ] Quick actions (dropdown)
- [ ] Charts and graphs
- [ ] Comparison view

### Phase 4
- [ ] Advanced analytics
- [ ] Predictive insights
- [ ] Recommendations
- [ ] Audit trail
- [ ] Version history

---

## ✅ Summary

### Yaratilgan:
- ✅ 5 ta Detail Pages (fully functional)
- ✅ Tabs component (Radix UI)
- ✅ Status badges & icons
- ✅ Progress bars
- ✅ Quick stats cards
- ✅ Related data sections
- ✅ Internal navigation links
- ✅ Responsive layouts

### Key Features:
- **Server-side rendering** - Fresh data
- **Tenant isolation** - Security
- **Visual hierarchy** - UX
- **Internal links** - Navigation
- **Responsive design** - Mobile-friendly
- **Color-coded status** - Quick understanding
- **Progress indicators** - Visual feedback
- **Empty states** - User guidance

---

**Yozilgan sana**: 2024-11-26  
**Versiya**: 1.0  
**Holat**: ✅ Detail Pages Complete

