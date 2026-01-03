# 📚 LOYIHA TO'LIQ INDEXLASH - 2024

## 🎯 LOYIHA UMUMIY MA'LUMOTLARI

### Loyiha Nomi
**School LMS** - Xususiy maktablar uchun Learning Management System

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma 5.22.0
- **Authentication:** NextAuth.js 4.24.5
- **UI:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **PDF Generation:** jsPDF + jspdf-autotable
- **Charts:** Recharts + Tremor

### Loyiha Strukturasi
```
lms2/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── actions/           # Server Actions (15 ta)
│   └── api/               # API Routes (20+ ta)
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── layouts/          # Layout components
├── lib/                   # Utility functions (15 ta)
│   ├── validations/      # Zod schemas (12 ta)
│   └── ...
├── prisma/                # Database
│   ├── schema.prisma     # Database schema (1215 qator)
│   └── seed.ts           # Seed data
├── types/                 # TypeScript types
└── public/               # Static files
```

---

## 🗄️ DATABASE SCHEMA - TO'LIQ INDEX

### Database Provider
- **Type:** PostgreSQL
- **Connection:** `DATABASE_URL` environment variable
- **Connection Pooling:** Enabled (Production)

### Jami Modellar: **26 ta model**

---

### 1. CORE MODELS (Asosiy Modellar)

#### **Tenant** - Maktablar (Multi-tenant)
```prisma
Fields:
- id (String, cuid)
- name, slug (unique), logo, address, phone, email
- status (TenantStatus: TRIAL | ACTIVE | GRACE_PERIOD | SUSPENDED | BLOCKED)
- subscriptionPlan (SubscriptionPlan: BASIC | STANDARD | PREMIUM)
- subscriptionStart, subscriptionEnd, trialEndsAt (DateTime?)
- maxStudents, maxTeachers (Int)
- settings (Json?)
- createdAt, updatedAt

Relations: 24 ta relation
- users, students, parents, teachers, cooks
- classes, subjects, schedules
- attendances, grades, assignments
- materials, payments, permissions
- messages, announcements, notifications
- activityLogs, subscriptionPayments
- expenseCategories, expenses
- kitchenExpenseCategories, kitchenExpenses
- dormitoryBuildings, dormitoryRooms, dormitoryBeds, dormitoryAssignments

Indexes: 7 ta
- @@index([slug])
- @@index([status])
- @@index([subscriptionPlan])
- @@index([subscriptionEnd])
- @@index([trialEndsAt])
- @@index([createdAt])
- @@index([status, subscriptionPlan]) // Composite
```

#### **User** - Foydalanuvchilar
```prisma
Fields:
- id (String, cuid)
- tenantId (String?, null for SUPER_ADMIN)
- email (unique), phone, passwordHash
- fullName, avatar
- role (UserRole: SUPER_ADMIN | ADMIN | MODERATOR | TEACHER | PARENT | STUDENT | COOK)
- isActive (Boolean, default: true)
- lastLogin (DateTime?)
- createdAt, updatedAt

Relations: 10 ta relation
- tenant, student, teacher, parent, cook
- sentMessages, receivedMessages
- announcements, notifications, activityLogs
- paymentsReceived, expensesPaid
- dormitoryAssignmentsCreated, permissions

Indexes: 7 ta
- @@index([email])
- @@index([tenantId])
- @@index([role])
- @@index([isActive])
- @@index([tenantId, role]) // Composite
- @@index([tenantId, isActive]) // Composite
- @@index([createdAt])
```

#### **Student** - O'quvchilar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- userId (String?, unique, optional - Phase 3)
- studentCode (String, unique per tenant)
- dateOfBirth (DateTime)
- gender (Gender: MALE | FEMALE)
- address, medicalInfo (Json?), documents (Json?)
- classId (String?, optional)
- enrollmentDate (DateTime, default: now)
- status (String, default: "ACTIVE") // ACTIVE | GRADUATED | EXPELLED
- trialEnabled (Boolean, default: false)
- trialStartDate, trialEndDate (DateTime?)
- trialDays (Int?)
- createdAt, updatedAt

Relations: 6 ta relation
- tenant, user, class
- parents (StudentParent[])
- attendances, grades, assignmentSubmissions
- payments, dormitoryAssignment

Unique Constraints:
- @@unique([tenantId, studentCode])

Indexes: 12 ta
- @@index([tenantId])
- @@index([userId])
- @@index([classId])
- @@index([studentCode])
- @@index([status])
- @@index([enrollmentDate])
- @@index([tenantId, status]) // Composite
- @@index([tenantId, classId]) // Composite
- @@index([createdAt])
- @@index([trialEnabled])
- @@index([trialEndDate])
- @@index([tenantId, trialEnabled]) // Composite
```

#### **Parent** - Ota-onalar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- userId (String, unique, required)
- guardianType (GuardianType: FATHER | MOTHER | OTHER)
- customRelationship (String?, optional)
- occupation, workAddress, emergencyContact (String?)
- createdAt, updatedAt

Relations: 2 ta relation
- tenant, user
- students (StudentParent[])
- payments

Indexes: 3 ta
- @@index([tenantId])
- @@index([userId])
- @@index([guardianType])
```

#### **StudentParent** - O'quvchi-Qarindosh Aloqasi
```prisma
Fields:
- studentId (String, FK)
- parentId (String, FK)
- hasAccess (Boolean, default: false) // Parent panel'ga kirish ruxsati
- createdAt

Composite Primary Key:
- @@id([studentId, parentId])

Indexes: 3 ta
- @@index([studentId])
- @@index([parentId])
- @@index([hasAccess])
```

#### **Teacher** - O'qituvchilar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- userId (String, unique, required)
- teacherCode (String, unique per tenant)
- specialization, education (String?)
- experienceYears (Int?)
- hireDate (DateTime, default: now)
- salaryInfo (Json?, encrypted)
- createdAt, updatedAt

Relations: 7 ta relation
- tenant, user
- classTeacher (Class[])
- classSubjects, schedules
- attendances, grades, assignments, materials

Unique Constraints:
- @@unique([tenantId, teacherCode])

Indexes: 5 ta
- @@index([tenantId])
- @@index([userId])
- @@index([teacherCode])
- @@index([tenantId, hireDate]) // Composite
```

---

### 2. AKADEMIK MODELLAR

#### **Class** - Sinflar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- name (String) // "7-A", "8-B"
- gradeLevel (Int) // 7, 8, 9
- classTeacherId (String?, optional)
- academicYear (String) // "2024-2025"
- maxStudents (Int, default: 30)
- roomNumber (String?)
- createdAt, updatedAt

Relations: 7 ta relation
- tenant, classTeacher
- students, classSubjects
- schedules, attendances, assignments
- materials, announcements

Indexes: 6 ta
- @@index([tenantId])
- @@index([classTeacherId])
- @@index([academicYear])
- @@index([gradeLevel])
- @@index([tenantId, academicYear]) // Composite
- @@index([tenantId, gradeLevel]) // Composite
```

#### **Subject** - Fanlar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- name (String) // "Matematika", "Fizika"
- code (String) // "MATH", "PHYS"
- description (String?)
- color (String?) // UI uchun
- createdAt, updatedAt

Relations: 6 ta relation
- tenant
- classSubjects, schedules
- attendances, grades, assignments, materials

Unique Constraints:
- @@unique([tenantId, code])

Indexes: 1 ta
- @@index([tenantId])
```

#### **ClassSubject** - Sinf-Fan-O'qituvchi Mapping
```prisma
Fields:
- id (String, cuid)
- classId (String, FK)
- subjectId (String, FK)
- teacherId (String, FK)
- hoursPerWeek (Int, default: 2)
- createdAt, updatedAt

Relations: 3 ta relation
- class, subject, teacher

Unique Constraints:
- @@unique([classId, subjectId])

Indexes: 3 ta
- @@index([classId])
- @@index([subjectId])
- @@index([teacherId])
```

#### **Schedule** - Dars Jadvali
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- classId, subjectId, teacherId (String, FK)
- dayOfWeek (Int) // 1=Dushanba, 7=Yakshanba
- startTime, endTime (String) // "08:00", "09:00"
- roomNumber (String?)
- academicYear (String) // "2024-2025"
- createdAt, updatedAt

Relations: 4 ta relation
- tenant, class, subject, teacher

Indexes: 4 ta
- @@index([tenantId])
- @@index([classId])
- @@index([teacherId])
- @@index([dayOfWeek])
```

---

### 3. O'QUV JARAYONI MODELLARI

#### **Attendance** - Davomat
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- studentId, classId, subjectId, teacherId (String, FK)
- date (DateTime, @db.Date)
- status (AttendanceStatus: PRESENT | ABSENT | LATE | EXCUSED)
- notes (String?)
- createdAt, updatedAt

Relations: 4 ta relation
- tenant, student, class, subject, teacher

Unique Constraints:
- @@unique([studentId, classId, subjectId, date])

Indexes: 9 ta
- @@index([tenantId])
- @@index([studentId])
- @@index([classId])
- @@index([subjectId])
- @@index([teacherId])
- @@index([date])
- @@index([status])
- @@index([classId, date]) // Composite
- @@index([studentId, date]) // Composite
```

#### **Grade** - Baholar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- studentId, subjectId, teacherId (String, FK)
- gradeType (GradeType: ORAL | WRITTEN | TEST | EXAM | QUARTER | FINAL)
- score, maxScore (Decimal @db.Decimal(5, 2))
- percentage (Decimal? @db.Decimal(5, 2))
- quarter (Int?) // 1, 2, 3, 4
- academicYear (String)
- date (DateTime @db.Date)
- notes (String?)
- createdAt, updatedAt

Relations: 4 ta relation
- tenant, student, subject, teacher

Indexes: 5 ta
- @@index([tenantId])
- @@index([studentId])
- @@index([subjectId])
- @@index([academicYear])
- @@index([quarter])
```

#### **Assignment** - Uy Vazifalari
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- teacherId, classId, subjectId (String, FK)
- title, description (String @db.Text)
- attachments (Json?) // Array of file URLs
- dueDate (DateTime)
- maxScore (Decimal @db.Decimal(5, 2))
- status (String, default: "ACTIVE") // ACTIVE | CLOSED
- createdAt, updatedAt

Relations: 4 ta relation
- tenant, teacher, class, subject
- submissions (AssignmentSubmission[])

Indexes: 4 ta
- @@index([tenantId])
- @@index([teacherId])
- @@index([classId])
- @@index([dueDate])
```

#### **AssignmentSubmission** - Topshirilgan Vazifalar
```prisma
Fields:
- id (String, cuid)
- assignmentId, studentId (String, FK)
- submittedAt (DateTime, default: now)
- attachments (Json?)
- content (String? @db.Text)
- score (Decimal? @db.Decimal(5, 2))
- feedback (String? @db.Text)
- gradedAt (DateTime?)
- gradedBy (String?) // Teacher ID
- status (String, default: "PENDING") // PENDING | GRADED | LATE
- createdAt, updatedAt

Relations: 2 ta relation
- assignment, student

Unique Constraints:
- @@unique([assignmentId, studentId])

Indexes: 2 ta
- @@index([assignmentId])
- @@index([studentId])
```

#### **Material** - Dars Materiallari
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- teacherId, subjectId (String, FK)
- classId (String?, optional, null = hammaga)
- title, description (String? @db.Text)
- type (String) // pdf, link, presentation
- fileUrl (String)
- fileSize (Int?) // bytes
- createdAt, updatedAt

Relations: 4 ta relation
- tenant, teacher, subject, class

Indexes: 4 ta
- @@index([tenantId])
- @@index([teacherId])
- @@index([subjectId])
- @@index([classId])
```

---

### 4. TO'LOV MODELLARI

#### **Payment** - To'lovlar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- studentId (String, FK)
- parentId (String?, optional)
- amount (Decimal @db.Decimal(10, 2))
- paymentType (PaymentType: TUITION | BOOKS | UNIFORM | OTHER)
- paymentMethod (PaymentMethod: CASH | CLICK | PAYME | UZUM)
- status (PaymentStatus: PENDING | COMPLETED | FAILED | REFUNDED)
- transactionId (String?, optional) // Online payments uchun
- invoiceNumber (String, unique)
- dueDate, paidDate (DateTime @db.Date)
- receivedById (String?, optional) // Qaysi xodim qabul qilgan
- receiptNumber (String?)
- notes (String? @db.Text)
- createdAt, updatedAt

Relations: 4 ta relation
- tenant, student, parent
- receivedBy (User)

Indexes: 11 ta
- @@index([tenantId])
- @@index([studentId])
- @@index([parentId])
- @@index([status])
- @@index([dueDate])
- @@index([paidDate])
- @@index([invoiceNumber])
- @@index([paymentType])
- @@index([tenantId, status]) // Composite
- @@index([tenantId, dueDate]) // Composite
- @@index([studentId, status]) // Composite
- @@index([createdAt])
```

#### **PaymentPlan** - To'lov Rejalari
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- name (String) // "Oylik", "3 oylik", "Yillik"
- description (String? @db.Text)
- amount (Decimal @db.Decimal(10, 2))
- durationMonths (Int)
- discountPercentage (Decimal? @db.Decimal(5, 2))
- isActive (Boolean, default: true)
- createdAt, updatedAt

Relations: 1 ta relation
- tenant

Indexes: 1 ta
- @@index([tenantId])
```

#### **SubscriptionPayment** - Subscription To'lovlari
```prisma
Fields:
- id (String, cuid)
- tenantId (String, FK)
- amount (Decimal @db.Decimal(10, 2))
- plan (SubscriptionPlan)
- paymentMethod (PaymentMethod, default: CASH)
- paymentDate (DateTime?)
- dueDate (DateTime)
- paidBy (String?) // Admin kim to'lagan
- notes (String?)
- status (PaymentStatus, default: PENDING)
- createdAt, updatedAt

Relations: 1 ta relation
- tenant

Indexes: 3 ta
- @@index([tenantId])
- @@index([status])
- @@index([dueDate])
```

---

### 5. XABARLASh MODELLARI

#### **Message** - Xabarlar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- senderId, receiverId (String, FK)
- subject (String?)
- content (String @db.Text)
- attachments (Json?)
- status (MessageStatus: SENT | READ, default: SENT)
- readAt (DateTime?)
- parentMessageId (String?, optional) // Thread uchun
- createdAt, updatedAt

Relations: 4 ta relation
- tenant, sender, receiver
- parentMessage, replies (Message[])

Indexes: 6 ta
- @@index([tenantId])
- @@index([senderId])
- @@index([receiverId])
- @@index([status])
- @@index([receiverId, status]) // Composite
- @@index([createdAt])
```

#### **Announcement** - E'lonlar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- authorId (String, FK)
- title, content (String @db.Text)
- targetAudience (String) // all, class, grade, parents, teachers
- targetId (String?) // classId or gradeLevel
- priority (String, default: "MEDIUM") // LOW, MEDIUM, HIGH
- isPinned (Boolean, default: false)
- publishedAt (DateTime, default: now)
- expiresAt (DateTime?)
- attachments (Json?)
- classId (String?, optional)
- createdAt, updatedAt

Relations: 3 ta relation
- tenant, author, class

Indexes: 3 ta
- @@index([tenantId])
- @@index([publishedAt])
- @@index([expiresAt])
```

#### **Notification** - Bildirishnomalar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- userId (String, FK)
- type (NotificationType: GRADE | ATTENDANCE | PAYMENT | ANNOUNCEMENT | MESSAGE | SYSTEM)
- title, content (String @db.Text)
- link (String?)
- isRead (Boolean, default: false)
- readAt (DateTime?)
- createdAt

Relations: 2 ta relation
- tenant, user

Indexes: 4 ta
- @@index([tenantId])
- @@index([userId])
- @@index([isRead])
- @@index([createdAt])
```

---

### 6. TIZIM MODELLARI

#### **GlobalSettings** - Platform Sozlamalari
```prisma
Fields:
- id (String, cuid)
- platformName (String, default: "School LMS")
- platformDescription (String, default: "Maktablar uchun zamonaviy boshqaruv tizimi")
- supportPhone (String, default: "+998 71 123 45 67")
- supportEmail (String?)
- defaultLanguage (String, default: "uz")
- timezone (String, default: "Asia/Tashkent")
- maintenanceMode (Boolean, default: false)
- maintenanceMessage (String?)
- settings (Json?)
- createdAt, updatedAt

Relations: Yo'q
Indexes: Yo'q
```

#### **GlobalSubscriptionPlan** - Global Tarif Rejalar
```prisma
Fields:
- id (String, cuid)
- planType (SubscriptionPlan, unique)
- name, displayName (String)
- price (Decimal @db.Decimal(10, 2))
- description (String? @db.Text)
- maxStudents, maxTeachers (Int)
- features (Json)
- isActive (Boolean, default: true)
- isPopular (Boolean, default: false)
- displayOrder (Int, default: 0)
- createdAt, updatedAt

Relations: Yo'q

Indexes: 2 ta
- @@index([planType])
- @@index([isActive])
```

#### **ActivityLog** - Faoliyat Loglar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- userId (String, FK)
- action (String) // created_student, updated_grade, etc.
- resourceType (String) // student, grade, payment, etc.
- resourceId (String)
- metadata (Json?)
- ipAddress, userAgent (String?)
- createdAt

Relations: 2 ta relation
- tenant, user

Indexes: 4 ta
- @@index([tenantId])
- @@index([userId])
- @@index([createdAt])
- @@index([resourceType])
```

#### **Permission** - Moderator Ruxsatlari
```prisma
Fields:
- id (String, cuid)
- userId (String, FK) // Moderator userId
- tenantId (String, FK)
- resource (String) // 'students', 'teachers', 'payments', etc.
- action (String) // 'CREATE', 'READ', 'UPDATE', 'DELETE'
- createdAt, updatedAt

Relations: 2 ta relation
- user, tenant

Unique Constraints:
- @@unique([userId, tenantId, resource, action])

Indexes: 5 ta
- @@index([userId])
- @@index([tenantId])
- @@index([resource])
- @@index([tenantId, resource]) // Composite
- @@index([userId, tenantId]) // Composite
```

---

### 7. XARAJATLAR MODELLARI

#### **ExpenseCategory** - Xarajat Turlari
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- name (String) // "Soliq", "Maosh", "Kommunal", "Remont"
- description (String? @db.Text)
- limitAmount (Decimal @db.Decimal(12, 2))
- period (ExpensePeriod: DAILY | WEEKLY | MONTHLY | YEARLY)
- color (String?) // UI uchun rang (#FF5733)
- icon (String?) // Icon nomi
- isActive (Boolean, default: true)
- createdAt, updatedAt

Relations: 2 ta relation
- tenant, expenses

Indexes: 3 ta
- @@index([tenantId])
- @@index([isActive])
- @@index([tenantId, isActive]) // Composite
```

#### **Expense** - Xarajatlar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- categoryId (String, FK)
- amount (Decimal @db.Decimal(12, 2))
- date (DateTime @db.Date)
- paymentMethod (PaymentMethod) // CASH, BANK, CARD
- receiptNumber (String?)
- description (String? @db.Text)
- paidById (String?, optional)
- attachments (Json?)
- createdAt, updatedAt

Relations: 3 ta relation
- tenant, category, paidBy (User)

Indexes: 6 ta
- @@index([tenantId])
- @@index([categoryId])
- @@index([date])
- @@index([tenantId, date]) // Composite
- @@index([tenantId, categoryId]) // Composite
- @@index([createdAt])
```

---

### 8. OSHXONA MODELLARI

#### **Cook** - Oshpazlar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- userId (String, unique, required)
- cookCode (String, unique per tenant)
- specialization (String) // Mutaxassisligi
- experienceYears (Int?)
- hireDate (DateTime, default: now)
- position (String, default: "COOK") // COOK, HEAD_COOK, ASSISTANT
- salary (Decimal? @db.Decimal(12, 2))
- workSchedule (String?)
- createdAt, updatedAt

Relations: 2 ta relation
- tenant, user
- kitchenExpenses

Unique Constraints:
- @@unique([tenantId, cookCode])

Indexes: 5 ta
- @@index([tenantId])
- @@index([userId])
- @@index([cookCode])
- @@index([position])
```

#### **KitchenExpenseCategory** - Oshxona Xarajat Turlari
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- name (String) // "Oziq-ovqat", "Idish-tovoq", "Texnika"
- description (String? @db.Text)
- limitAmount (Decimal @db.Decimal(12, 2))
- period (ExpensePeriod, default: MONTHLY)
- color, icon (String?)
- isActive (Boolean, default: true)
- createdAt, updatedAt

Relations: 2 ta relation
- tenant, kitchenExpenses

Unique Constraints:
- @@unique([tenantId, name])

Indexes: 3 ta
- @@index([tenantId])
- @@index([isActive])
- @@index([tenantId, isActive]) // Composite
```

#### **KitchenExpense** - Oshxona Xarajatlari
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- categoryId (String, FK)
- amount (Decimal @db.Decimal(12, 2))
- date (DateTime @db.Date)
- paymentMethod (PaymentMethod, default: CASH)
- receiptNumber (String?)
- description (String? @db.Text)
- itemName (String?) // Mahsulot nomi
- quantity (Decimal? @db.Decimal(10, 2))
- unit (String?) // Birlik (kg, dona, litr)
- supplier (String?) // Yetkazib beruvchi
- createdById (String?, optional) // Cook ID
- attachments (Json?)
- createdAt, updatedAt

Relations: 3 ta relation
- tenant, category, createdBy (Cook)

Indexes: 6 ta
- @@index([tenantId])
- @@index([categoryId])
- @@index([date])
- @@index([tenantId, date]) // Composite
- @@index([tenantId, categoryId]) // Composite
- @@index([createdById])
- @@index([createdAt])
```

---

### 9. YOTOQXONA MODELLARI

#### **DormitoryBuilding** - Yotoqxona Binolari
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- name (String) // "Bino A", "O'g'il bolalar yotoqxonasi"
- code (String) // "BLDG-A", "BOYS-1"
- address, description (String? @db.Text)
- totalFloors (Int, default: 1)
- totalRooms (Int, default: 0) // Cache
- totalCapacity (Int, default: 0) // Cache
- occupiedBeds (Int, default: 0) // Cache
- gender (Gender?) // MALE, FEMALE, null = aralash
- isActive (Boolean, default: true)
- facilities, rules (Json?)
- contactPerson, contactPhone (String?)
- createdAt, updatedAt

Relations: 2 ta relation
- tenant, rooms (DormitoryRoom[])

Unique Constraints:
- @@unique([tenantId, code])

Indexes: 5 ta
- @@index([tenantId])
- @@index([isActive])
- @@index([gender])
- @@index([tenantId, isActive]) // Composite
```

#### **DormitoryRoom** - Xonalar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- buildingId (String, FK)
- roomNumber (String) // "101", "A-205"
- floor (Int)
- capacity (Int, default: 4) // Jami joy soni
- occupiedBeds (Int, default: 0) // Band joylar
- roomType (String, default: "STANDARD") // STANDARD, LUXURY, SUITE
- pricePerMonth (Decimal @db.Decimal(10, 2))
- gender (Gender?)
- isActive (Boolean, default: true)
- description (String? @db.Text)
- amenities, images (Json?)
- createdAt, updatedAt

Relations: 3 ta relation
- tenant, building
- beds (DormitoryBed[])
- assignments (DormitoryAssignment[])

Unique Constraints:
- @@unique([buildingId, roomNumber])

Indexes: 6 ta
- @@index([tenantId])
- @@index([buildingId])
- @@index([isActive])
- @@index([gender])
- @@index([floor])
- @@index([tenantId, isActive]) // Composite
```

#### **DormitoryBed** - Joylar/To'shaklar
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- roomId (String, FK)
- bedNumber (String) // "1", "2", "A", "B"
- bedType (String, default: "SINGLE") // SINGLE, BUNK_TOP, BUNK_BOTTOM
- isOccupied (Boolean, default: false)
- isActive (Boolean, default: true)
- description (String?)
- createdAt, updatedAt

Relations: 3 ta relation
- tenant, room
- currentAssignment (DormitoryAssignment?)

Unique Constraints:
- @@unique([roomId, bedNumber])

Indexes: 5 ta
- @@index([tenantId])
- @@index([roomId])
- @@index([isOccupied])
- @@index([isActive])
- @@index([tenantId, isOccupied, isActive]) // Composite
```

#### **DormitoryAssignment** - O'quvchini Joylashtirish
```prisma
Fields:
- id (String, cuid)
- tenantId (String, required)
- studentId (String, unique, FK)
- roomId (String, FK)
- bedId (String, unique, FK)
- checkInDate (DateTime, default: now)
- checkOutDate (DateTime?)
- status (String, default: "ACTIVE") // ACTIVE, MOVED, CHECKED_OUT, SUSPENDED
- monthlyFee (Decimal @db.Decimal(10, 2))
- notes (String? @db.Text)
- assignedById (String?, optional)
- createdAt, updatedAt

Relations: 4 ta relation
- tenant, student, room, bed
- assignedBy (User?)

Indexes: 7 ta
- @@index([tenantId])
- @@index([studentId])
- @@index([roomId])
- @@index([bedId])
- @@index([status])
- @@index([checkInDate])
- @@index([tenantId, status]) // Composite
- @@index([studentId, status]) // Composite
```

---

## 📊 DATABASE INDEXLARI - TO'LIQ STATISTIKA

### Jami Indexlar: **152+ ta**

#### Index Turlari:
- **Single Column Indexes:** ~120 ta
- **Composite Indexes:** ~32 ta
- **Unique Indexes:** ~10 ta

#### Eng Ko'p Indexlangan Modellar:
1. **Payment** - 11 ta index
2. **Student** - 12 ta index
3. **Attendance** - 9 ta index
4. **DormitoryAssignment** - 7 ta index
5. **Tenant** - 7 ta index
6. **User** - 7 ta index

#### Asosiy Index Strategiyalari:
1. **Tenant Isolation:** Har bir modelda `tenantId` index
2. **Foreign Keys:** Barcha FK'lar indexlangan
3. **Composite Indexes:** Ko'p ishlatiladigan query patterns uchun
4. **Status Filtering:** Status field'lar indexlangan
5. **Date Filtering:** Date field'lar indexlangan
6. **Unique Constraints:** Data integrity uchun

---

## 🔐 SECURITY & AUTHENTICATION

### Authentication System
- **Provider:** NextAuth.js 4.24.5
- **Strategy:** JWT (30 days expiry)
- **Password Hashing:** bcryptjs (12 rounds)
- **Session Management:** JWT tokens

### Role-Based Access Control (RBAC)
**Rollar:**
1. **SUPER_ADMIN** - Tizim egasi, barcha maktablarni boshqaradi
2. **ADMIN** - Maktab administratori
3. **MODERATOR** - Cheklangan ruxsatlar bilan
4. **TEACHER** - O'qituvchi
5. **PARENT** - Ota-ona
6. **STUDENT** - O'quvchi (Phase 3)
7. **COOK** - Oshpaz

### Tenant Isolation
- **Row-Level Security:** Har bir query'da `tenantId` check
- **Middleware Protection:** Route-level tenant status check
- **Security Utilities:** `lib/tenant-security.ts`

### Subscription Status Flow
```
NEW → TRIAL (30 days) → ACTIVE (paid)
                      ↓
                 GRACE_PERIOD (7 days warning)
                      ↓
                 SUSPENDED (login only, payment page)
                      ↓
                 BLOCKED (no access)
```

---

## 📁 SERVER ACTIONS (15 ta)

1. **student.ts** - O'quvchilar CRUD, bulk operations
2. **teacher.ts** - O'qituvchilar CRUD
3. **class.ts** - Sinflar CRUD
4. **subject.ts** - Fanlar CRUD
5. **attendance.ts** - Davomat kiritish, bulk operations
6. **grade.ts** - Baholar kiritish, bulk operations
7. **payment.ts** - To'lovlar CRUD
8. **schedule.ts** - Dars jadvali CRUD
9. **message.ts** - Xabarlar CRUD
10. **announcement.ts** - E'lonlar CRUD
11. **material.ts** - Materiallar CRUD
12. **tenant.ts** - Tenant CRUD (Super Admin)
13. **expense.ts** - Xarajatlar CRUD
14. **cook.ts** - Oshpazlar CRUD
15. **dormitory.ts** - Yotoqxona CRUD

---

## 🛣️ API ROUTES (20+ ta)

### Authentication
- `/api/auth/[...nextauth]` - NextAuth endpoints
- `/api/auth/change-password` - Parol o'zgartirish

### CRUD Operations
- `/api/students` - O'quvchilar
- `/api/teachers` - O'qituvchilar
- `/api/parents/[id]` - Ota-onalar
- `/api/classes/[id]` - Sinflar
- `/api/grades/[id]` - Baholar
- `/api/grades/bulk` - Bulk baholar
- `/api/attendance/[id]` - Davomat
- `/api/attendance/bulk` - Bulk davomat
- `/api/payments/[id]` - To'lovlar
- `/api/tenants/[id]` - Tenant'lar (Super Admin)
- `/api/tenant/settings` - Tenant sozlamalari

### Utilities
- `/api/upload` - Fayl yuklash
- `/api/clear-cache` - Cache tozalash
- `/api/global-settings` - Global sozlamalar
- `/api/user/profile` - User profil
- `/api/dormitory/available-rooms` - Mavjud xonalar

---

## 📄 SAHIFALAR (100+ ta)

### Super Admin (5 ta)
- `/super-admin` - Dashboard
- `/super-admin/tenants` - Maktablar ro'yxati
- `/super-admin/tenants/[id]` - Maktab tafsilotlari
- `/super-admin/payments` - Subscription to'lovlari
- `/super-admin/settings` - Platform sozlamalari

### Admin (40+ ta)
- `/admin` - Dashboard
- `/admin/students` - O'quvchilar
- `/admin/teachers` - O'qituvchilar
- `/admin/parents` - Ota-onalar
- `/admin/classes` - Sinflar
- `/admin/subjects` - Fanlar
- `/admin/attendance` - Davomat
- `/admin/grades` - Baholar
- `/admin/payments` - To'lovlar
- `/admin/schedules` - Dars jadvali
- `/admin/messages` - Xabarlar
- `/admin/announcements` - E'lonlar
- `/admin/materials` - Materiallar
- `/admin/expenses` - Xarajatlar
- `/admin/kitchen` - Oshxona
- `/admin/dormitory` - Yotoqxona
- `/admin/reports` - Hisobotlar
- `/admin/settings` - Sozlamalar

### Teacher (15+ ta)
- `/teacher` - Dashboard
- `/teacher/classes` - Sinflar
- `/teacher/attendance` - Davomat
- `/teacher/grades` - Baholar
- `/teacher/schedule` - Dars jadvali
- `/teacher/messages` - Xabarlar
- `/teacher/materials` - Materiallar
- `/teacher/reports` - Hisobotlar

### Parent (10+ ta)
- `/parent` - Dashboard
- `/parent/children` - Farzandlar
- `/parent/attendance` - Davomat
- `/parent/grades` - Baholar
- `/parent/payments` - To'lovlar
- `/parent/messages` - Xabarlar
- `/parent/schedule` - Dars jadvali

### Cook (5+ ta)
- `/cook` - Dashboard
- `/cook/expenses` - Xarajatlar
- `/cook/settings` - Sozlamalar

---

## 🛠️ LIBRARY FUNCTIONS

### Core Libraries (15 ta)
1. **auth.ts** - Authentication helpers
2. **db.ts** - Prisma client (optimized)
3. **utils.ts** - General utilities
4. **permissions.ts** - Permission checking
5. **tenant-security.ts** - Tenant isolation utilities
6. **tenant.ts** - Tenant access checking
7. **error-handler.ts** - Error handling
8. **rate-limit.ts** - Rate limiting
9. **file-validation.ts** - File validation
10. **pdf-generator.ts** - PDF generation
11. **reports.ts** - Report generation
12. **export.ts** - Data export
13. **expense-utils.ts** - Expense utilities
14. **expense-helpers.ts** - Expense helpers
15. **constants.ts** - Constants

### Validation Schemas (12 ta)
1. **student.ts** - Student validation
2. **teacher.ts** - Teacher validation
3. **class.ts** - Class validation
4. **attendance.ts** - Attendance validation
5. **grade.ts** - Grade validation
6. **payment.ts** - Payment validation
7. **schedule.ts** - Schedule validation
8. **message.ts** - Message validation
9. **announcement.ts** - Announcement validation
10. **material.ts** - Material validation
11. **tenant.ts** - Tenant validation
12. **cook.ts** - Cook validation
13. **dormitory.ts** - Dormitory validation
14. **expense.ts** - Expense validation

---

## 🎨 UI COMPONENTS

### shadcn/ui Components
- Button, Input, Label
- Dialog, Alert Dialog
- Dropdown Menu, Select
- Table, Tabs
- Toast, Progress
- Avatar, Checkbox
- Popover, Scroll Area
- Separator, Switch

### Custom Components
- Forms (React Hook Form + Zod)
- Data Tables (TanStack Table)
- Charts (Recharts + Tremor)
- PDF Export (jsPDF)

---

## 📈 PERFORMANCE OPTIMIZATIONS

### Database
- ✅ 152+ optimized indexes
- ✅ Connection pooling
- ✅ Query optimization
- ✅ Composite indexes for common queries

### Application
- ✅ Server Actions (no API overhead)
- ✅ Optimized Prisma queries
- ✅ Caching strategies
- ✅ Rate limiting

---

## 🔒 SECURITY FEATURES

1. ✅ Password hashing (bcrypt, 12 rounds)
2. ✅ JWT authentication
3. ✅ CSRF protection
4. ✅ SQL injection prevention (Prisma)
5. ✅ XSS protection (Next.js)
6. ✅ Role-based access control
7. ✅ Tenant isolation (row-level security)
8. ✅ Rate limiting
9. ✅ File validation
10. ✅ Secure session management
11. ✅ Environment variables
12. ✅ Activity logging

---

## 📊 SUBSCRIPTION PLANS

| Plan | Narx | Max Students | Max Teachers | Features |
|------|------|-------------|--------------|----------|
| **BASIC** | 500,000 so'm/oy | 50 | 10 | Basic features |
| **STANDARD** | 1,000,000 so'm/oy | 200 | 30 | All + SMS |
| **PREMIUM** | 2,000,000 so'm/oy | ∞ | ∞ | All + Branding |

---

## ✅ LOYIHA HOLATI

### Bajarilgan (Phase 1 - MVP)
- ✅ Multi-tenant architecture
- ✅ Authentication & Authorization
- ✅ Student Management
- ✅ Teacher Management
- ✅ Class & Subject Management
- ✅ Attendance System
- ✅ Grading System
- ✅ Payment Management (Cash)
- ✅ Schedule Management
- ✅ Messaging System
- ✅ Announcements
- ✅ Materials Management
- ✅ Reports & Analytics
- ✅ Expense Management
- ✅ Kitchen Management
- ✅ Dormitory Management

### Rejalashtirilgan (Phase 2-3)
- 🔄 Online payments (Click, Payme, Uzum)
- 🔄 Student panel (full features)
- 🔄 Email/SMS notifications
- 🔄 Advanced analytics
- 🔄 Mobile app

---

## 📝 XULOSA

### Database
- **26 ta model** to'liq tuzilgan
- **152+ ta index** optimizatsiya qilingan
- **Multi-tenant** architecture
- **Row-level security** implementatsiya qilingan

### Application
- **100+ ta sahifa** yaratilgan
- **15 ta Server Action** implementatsiya qilingan
- **20+ ta API Route** yaratilgan
- **15 ta Library** function
- **12 ta Validation** schema

### Security
- **To'liq xavfsizlik** audit o'tkazilgan
- **Tenant isolation** qat'iy amalga oshirilgan
- **Role-based access** control
- **Activity logging** yoqilgan

---

**Yaratilgan:** 2024
**Oxirgi yangilanish:** 2024
**Versiya:** 1.0.0 (MVP)

