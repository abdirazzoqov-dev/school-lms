# 📋 TEXNIK TOPSHIRIQ - LMS (Learning Management System)
## Xususiy Maktablar uchun Boshqaruv Tizimi

---

## 1. 🎯 LOYIHA MAQSADI

Xususiy maktablar uchun zamonaviy, ko'p funksiyali LMS platformasini yaratish. Tizim o'qituvchilar, ota-onalar va maktab rahbariyati uchun o'quv jarayonini boshqarish, nazorat qilish va tahlil qilishni osonlashtiradi.

**Asosiy maqsad:** Bir nechta xususiy maktablarga o'rnatib, sozlab berish mumkin bo'lgan multi-tenant SaaS yechim.

---

## 2. 👥 FOYDALANUVCHI ROLLARI

### 2.1 Super Admin (Siz - Tizim Egasi)
- Barcha maktablarni boshqarish
- Yangi maktab qo'shish/o'chirish
- Moliyaviy hisobotlar (har bir maktabdan subscription to'lovlar)
- Tizim sozlamalari

### 2.2 Maktab Administratori (Biznes Egasi)
- O'z maktabini to'liq boshqarish
- Dashboard va statistika
- Xodimlar va o'quvchilar boshqaruvi
- Moliyaviy hisobotlar
- Sinflar va guruhlarni tashkil qilish

### 2.3 O'qituvchi
- O'z darslarini boshqarish
- Baholar va davomat kiritish
- Uy vazifalari yaratish
- Ota-onalar bilan muloqot
- O'quvchilar progress reportlari

### 2.4 Ota-ona
- Farzandlarini kuzatish
- Baholar va davomat ko'rish
- To'lovlar amalga oshirish
- O'qituvchilar bilan muloqot
- Bildirishnomalar olish

### 2.5 O'quvchi *(KEYINGI VERSIYAGA QOLDIRILDI)*
- O'z baholar va davomatini ko'rish
- Uy vazifalarini topshirish
- Dars materiallarini ko'rish
- Dars jadvalini ko'rish

> **Eslatma:** MVP versiyasida o'quvchi roli qo'shilmaydi. Barcha funksiyalar ota-onalar va o'qituvchilar orqali amalga oshiriladi.

---

## 3. 📱 FUNKSIONAL TALABLAR

### 3.1 AUTHENTICATION & AUTHORIZATION

#### Login/Register
- [ ] Email + Password
- [ ] Google OAuth
- [ ] Phone number (SMS confirmation)
- [ ] "Parolni unutdim" funksiyasi
- [ ] 2FA (ikki faktorli autentifikatsiya) - ixtiyoriy

#### Role-based Access Control
- [ ] Har bir rol uchun alohida dashboard
- [ ] Permission-based access
- [ ] Session management

---

### 3.2 SUPER ADMIN PANELI

#### Maktablar Boshqaruvi
- [ ] Yangi maktab qo'shish (School Onboarding)
  - Maktab nomi, logo, contact info
  - Admin foydalanuvchi yaratish
  - Domen/subdomain sozlash (masalan: school1.lms.uz)
- [ ] Maktablarni aktivlashtirish/to'xtatish
- [ ] Maktablar ro'yxati va statistika

#### Subscription Management
- [ ] Har bir maktab uchun to'lov rejasi (plan)
  - Basic Plan (50 o'quvchigacha)
  - Standard Plan (200 o'quvchigacha)
  - Premium Plan (unlimited)
- [ ] To'lov tarixi
- [ ] Invoice yaratish va yuborish
- [ ] Trial period (30 kun bepul)

#### Global Settings
- [ ] Tizim sozlamalari
- [ ] Feature flags (yangi funksiyalarni boshqarish)
- [ ] Email/SMS templates
- [ ] Logs va monitoring

---

### 3.3 MAKTAB ADMIN PANELI

#### Dashboard
- [ ] Asosiy statistika
  - Jami o'quvchilar soni
  - Jami o'qituvchilar soni
  - Bu oyning daromadi
  - To'lanmagan to'lovlar
  - Yangi ro'yxatga olingan o'quvchilar (grafik)
- [ ] Tezkor harakatlar (Quick Actions)
- [ ] Oxirgi bildirishnomalar

#### O'quvchilar Boshqaruvi
- [ ] Yangi o'quvchi qo'shish
  - F.I.O, tug'ilgan sana
  - Sinfi, guruhi
  - Ota-ona ma'lumotlari
  - Foto yuklash
- [ ] O'quvchilar ro'yxati (filtrlash, qidirish)
- [ ] O'quvchi profili
  - Shaxsiy ma'lumotlar
  - Baholar tarixi
  - Davomat statistikasi
  - To'lovlar tarixi
  - Documents (shartnoma, arizalar)
- [ ] O'quvchini o'chirish/arxivlash
- [ ] O'quvchilarni import qilish (Excel/CSV)

#### O'qituvchilar Boshqaruvi
- [ ] Yangi o'qituvchi qo'shish
  - F.I.O, contact info
  - O'qitiladigan fanlar
  - Tajriba, malumoti
  - Ish haqi ma'lumotlari
- [ ] O'qituvchilar ro'yxati
- [ ] O'qituvchi profili
- [ ] Dars yuklamalari
- [ ] Performance hisobotlari

#### Sinflar va Guruhlar
- [ ] Yangi sinf/guruh yaratish
  - Sinf nomi (masalan: 7-A, 8-B)
  - Sinf rahbari tayinlash
  - O'quvchilar sonini cheklash
- [ ] Sinflar ro'yxati
- [ ] O'quvchilarni sinflarga biriktirish
- [ ] Fanlarni sinflarga biriktirish
- [ ] O'qituvchilarni sinflarga tayinlash

#### Fanlar (Subjects)
- [ ] Fan qo'shish (Matematika, Fizika, Ingliz tili...)
- [ ] Fanlar ro'yxati
- [ ] Har bir fan uchun darslik yuklamalar

#### Dars Jadvali
- [ ] Haftalik jadval yaratish
- [ ] Drag & Drop orqali darslarni joylashtirish
- [ ] Collision detection (bir vaqtda bir o'qituvchi)
- [ ] Jadval print qilish
- [ ] O'quvchi va o'qituvchilarga ko'rinadi

#### Moliyaviy Boshqaruv
- [ ] To'lov paketlari (Pricing Plans)
  - Oylik, 3 oylik, 6 oylik, yillik
  - Chegirmalar
- [ ] O'quvchilar uchun to'lov invoice yaratish
- [ ] To'lovlar tarixi (naqd pul)
  - **MVP: Faqat naqd pul to'lovlari qo'lda kiritiladi**
  - **Phase 2: Click, Payme, Uzum integratsiyasi**
- [ ] To'lanmagan to'lovlar
- [ ] To'lov qabul qilish (naqd)
  - To'lov summasi
  - To'lov sanasi
  - Kimdan qabul qilindi
  - Qabul qilgan xodim
  - Chek raqami (ixtiyoriy)
- [ ] Moliyaviy hisobotlar
  - Oylik daromad
  - O'qituvchilar ish haqi
  - Boshqa xarajatlar
  - Foyda hisobi
- [ ] Excel export

#### Bildirishnomalar (Announcements)
- [ ] Yangi e'lon yaratish
- [ ] Kimga yuborish (barcha, sinf, guruh)
- [ ] E'lonlar tarixi
- [ ] Push notification, Email, SMS

#### Sozlamalar
- [ ] Maktab ma'lumotlari (nom, logo, manzil)
- [ ] Ish vaqti va tatil kunlari
- [ ] Baholar tizimi (5-ball, 100-ball, harflar A/B/C)
- [ ] Email/SMS templates
- [ ] To'lov usullari (Click, Payme, Uzum)

---

### 3.4 O'QITUVCHI PANELI

#### Dashboard
- [ ] Kunlik darslar ro'yxati
- [ ] Bugungi davomat statistikasi
- [ ] Tekshirish kerak bo'lgan uy vazifalari soni
- [ ] Oxirgi xabarlar

#### Mening Sinflarim
- [ ] O'qitiladigan sinflar va guruhlar ro'yxati
- [ ] Har bir sinfdagi o'quvchilar soni
- [ ] Dars jadvali

#### Davomat
- [ ] Kunlik davomat belgilash
  - Bor ✓
  - Yo'q ✗
  - Sababli ⊘
  - Kech keldi ↓
- [ ] Davomat tarixi
- [ ] Davomat statistikasi (grafik)
- [ ] Excel export

#### Baholar
- [ ] Baholar kiritish
  - Sinf tanlash → Fan tanlash → O'quvchi tanlash
  - Baho turi (yozma ish, og'zaki, nazorat ishi)
  - Izoh qo'shish
- [ ] Baholar jadvali (Spreadsheet ko'rinishi)
- [ ] Chorak baholari
- [ ] Yillik baholar
- [ ] Statistika va grafiklar

#### Uy Vazifalari
- [ ] Yangi topshiriq yaratish
  - Fan, sinf
  - Tavsif
  - Fayl yuklash (PDF, Word, rasm)
  - Topshirish muddati
  - Maksimal ball
- [ ] Topshiriqlar ro'yxati
- [ ] Topshirilgan vazifalarni ko'rish
- [ ] Baholash va izoh qo'shish
- [ ] Statistika (necha kishi topshirgan)

#### Dars Materiallari *(Phase 3 - Ixtiyoriy)*
- [ ] Darsliklar (PDF) yuklash
- [ ] Prezentatsiyalar
- [ ] Havolalar
- [ ] Kategoriyalarga bo'lish

> **Eslatma:** Video darslar MVP versiyasida qo'shilmaydi. Bu xususiyat keyinchalik qo'shilishi mumkin (ixtiyoriy).

#### Xabarlar
- [ ] Ota-onalar bilan chat
- [ ] Guruh xabar yuborish
- [ ] Bildirishnomalar

#### Hisobotlar
- [ ] Sinf reytingi (eng yaxshi o'quvchilar)
- [ ] O'rtacha ball dinamikasi
- [ ] Davomat hisoboti
- [ ] Progress report (choraklik)

---

### 3.5 OTA-ONA PANELI

#### Dashboard
- [ ] Farzandlar ro'yxati (agar bir nechta bo'lsa)
- [ ] Oxirgi baholar
- [ ] Bu haftaning davomati
- [ ] Kelgusi to'lovlar
- [ ] Yangi xabarlar

#### Farzandim
- [ ] Farzand profili
- [ ] Sinfi va dars jadvali

#### Baholar
- [ ] Barcha fanlar bo'yicha baholar
- [ ] Chorak baholari
- [ ] Yillik baholar
- [ ] Grafik ko'rinish (progress)
- [ ] Fan bo'yicha statistika

#### Davomat
- [ ] Kunlik davomat
- [ ] Kalendar ko'rinishi
- [ ] Statistika (necha kun bordi, necha kun qoldi)
- [ ] Sababli qoldirgan kunlar

#### Uy Vazifalari
- [ ] Berilgan topshiriqlar
- [ ] Topshirilgan vazifalar
- [ ] Baholangan vazifalar
- [ ] Deadline trackeri

#### To'lovlar
- [ ] Hozirgi to'lov paketi
- [ ] To'lov tarixi (naqd to'lovlar)
- [ ] Invoice yuklash/ko'rish
- [ ] To'lovlar summasi va muddat
- [ ] To'lanmagan qarzlar ko'rish
- [ ] To'lov eslatmalari

> **Eslatma MVP:** To'lovlar faqat maktabda naqd qabul qilinadi. Ota-onalar faqat to'lov tarixini va qarzlarini ko'rishi mumkin.
> **Phase 2:** Online to'lov (Click, Payme, Uzum) qo'shiladi.

#### Xabarlar
- [ ] O'qituvchilar bilan chat
- [ ] Maktab administratsiyasi bilan
- [ ] Bildirishnomalar

#### Bildirishnomalar
- [ ] Maktab e'lonlari
- [ ] Baholar haqida notification
- [ ] To'lovlar eslatmasi
- [ ] Davomat haqida xabar (agar farzand kelmasa)

---

### 3.6 O'QUVCHI PANELI *(Phase 3 - Keyingi versiyada)*

> **Eslatma:** MVP versiyasida o'quvchi paneli bo'lmaydi. O'quvchilar ma'lumotlarini ota-onalar orqali ko'radilar.

#### Dashboard (Future)
- [ ] Bugungi darslar
- [ ] Oxirgi baholar
- [ ] Topshirish kerak bo'lgan uy vazifalari
- [ ] Bildirishnomalar

#### Mening Baholarim (Future)
- [ ] Barcha fanlar bo'yicha baholar
- [ ] Grafik ko'rinish
- [ ] Chorak va yillik baholar

#### Davomatim (Future)
- [ ] Kalendar ko'rinish
- [ ] Statistika

#### Uy Vazifalari (Future)
- [ ] Topshirish kerak bo'lgan vazifalar
- [ ] Topshirish (fayl yuklash)
- [ ] Baholangan vazifalar ko'rish

#### Dars Materiallari (Future)
- [ ] Video darslar
- [ ] Darsliklar
- [ ] O'qituvchi yuklaganlari

#### Dars Jadvali (Future)
- [ ] Haftalik jadval
- [ ] Kalendar ko'rinish

---

## 4. 💻 TEXNIK STACK

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** Zustand / React Context
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts / Chart.js
- **Calendar:** FullCalendar
- **Rich Text Editor:** Tiptap / Quill
- **File Upload:** react-dropzone

### Backend
- **Framework:** Next.js API Routes
- **ORM:** Prisma
- **Validation:** Zod
- **Authentication:** NextAuth.js
- **File Storage:** AWS S3 / Cloudinary / UploadThing

### Database
- **Primary DB:** PostgreSQL
- **Caching:** Redis (optional, for performance)
- **Search:** PostgreSQL Full-Text Search

### Payment Integration *(Phase 2)*
- Click API (keyinchalik)
- Payme API (keyinchalik)
- Uzum Bank API (keyinchalik)

> **MVP:** Faqat naqd to'lovlar (database record)

### Communication
- **In-app Notifications:** MVP uchun yetarli
- **Email:** Resend / SendGrid *(Phase 2)*
- **SMS:** Eskiz.uz / Playmobile *(Phase 2)*
- **Push Notifications:** Firebase Cloud Messaging *(Phase 4)*

### DevOps & Deployment
- **Hosting:** Vercel (Frontend) / Railway (Database)
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (error tracking)
- **Analytics:** Vercel Analytics

---

## 5. 🗄️ DATABASE STRUCTURE

### Core Tables

#### 1. Tenants (Maktablar)
```
- id (UUID)
- name (string)
- slug (string, unique) - subdomain uchun
- logo (string, URL)
- address (text)
- phone (string)
- email (string)
- subscription_plan (enum: basic, standard, premium)
- subscription_end_date (date)
- is_active (boolean)
- settings (JSON)
- created_at, updated_at
```

#### 2. Users
```
- id (UUID)
- tenant_id (FK)
- email (unique)
- phone (string)
- password_hash
- full_name (string)
- avatar (string, URL)
- role (enum: super_admin, admin, teacher, parent)
  # MVP: super_admin, admin, teacher, parent
  # Phase 3: 'student' qo'shiladi
- is_active (boolean)
- last_login (timestamp)
- created_at, updated_at
```

#### 3. Students
```
- id (UUID)
- user_id (FK)
- tenant_id (FK)
- student_code (string, unique per tenant)
- date_of_birth (date)
- gender (enum)
- class_id (FK)
- enrollment_date (date)
- status (enum: active, graduated, expelled)
- address (text)
- medical_info (JSON)
- documents (JSON) - shartnoma, arizalar
- created_at, updated_at
```

#### 4. Parents
```
- id (UUID)
- user_id (FK)
- tenant_id (FK)
- relationship (enum: father, mother, guardian)
- occupation (string)
- work_address (text)
- emergency_contact (string)
- created_at, updated_at
```

#### 5. Student_Parents (Many-to-Many)
```
- student_id (FK)
- parent_id (FK)
- is_primary (boolean)
```

#### 6. Teachers
```
- id (UUID)
- user_id (FK)
- tenant_id (FK)
- teacher_code (string)
- specialization (string)
- education (text)
- experience_years (integer)
- hire_date (date)
- salary_info (JSON, encrypted)
- subjects (array) - o'qitiladigan fanlar
- created_at, updated_at
```

#### 7. Classes
```
- id (UUID)
- tenant_id (FK)
- name (string) - 7-A, 8-B
- grade_level (integer) - 7, 8, 9
- class_teacher_id (FK, nullable)
- academic_year (string) - 2024-2025
- max_students (integer)
- room_number (string)
- created_at, updated_at
```

#### 8. Subjects
```
- id (UUID)
- tenant_id (FK)
- name (string) - Matematika, Fizika
- code (string) - MATH, PHYS
- description (text)
- color (string) - UI uchun
- created_at, updated_at
```

#### 9. Class_Subjects (Many-to-Many)
```
- class_id (FK)
- subject_id (FK)
- teacher_id (FK)
- hours_per_week (integer)
```

#### 10. Schedule (Dars jadvali)
```
- id (UUID)
- tenant_id (FK)
- class_id (FK)
- subject_id (FK)
- teacher_id (FK)
- day_of_week (integer) - 1=Dushanba, 7=Yakshanba
- start_time (time)
- end_time (time)
- room_number (string)
- academic_year (string)
- created_at, updated_at
```

#### 11. Attendance
```
- id (UUID)
- tenant_id (FK)
- student_id (FK)
- class_id (FK)
- subject_id (FK)
- teacher_id (FK)
- date (date)
- status (enum: present, absent, late, excused)
- notes (text)
- created_at, updated_at
```

#### 12. Grades
```
- id (UUID)
- tenant_id (FK)
- student_id (FK)
- subject_id (FK)
- teacher_id (FK)
- grade_type (enum: oral, written, test, exam, quarter, final)
- score (decimal)
- max_score (decimal)
- percentage (decimal)
- quarter (integer) - 1, 2, 3, 4
- academic_year (string)
- date (date)
- notes (text)
- created_at, updated_at
```

#### 13. Assignments (Uy vazifalari)
```
- id (UUID)
- tenant_id (FK)
- teacher_id (FK)
- class_id (FK)
- subject_id (FK)
- title (string)
- description (text)
- attachments (JSON) - files URLs
- due_date (timestamp)
- max_score (decimal)
- status (enum: active, closed)
- created_at, updated_at
```

#### 14. Assignment_Submissions
```
- id (UUID)
- assignment_id (FK)
- student_id (FK)
- submitted_at (timestamp)
- attachments (JSON)
- content (text)
- score (decimal)
- feedback (text)
- graded_at (timestamp)
- graded_by (FK -> teachers)
- status (enum: pending, graded, late)
```

#### 15. Materials (Dars materiallari) *(Phase 3 - Ixtiyoriy)*
```
- id (UUID)
- tenant_id (FK)
- teacher_id (FK)
- subject_id (FK)
- class_id (FK, nullable) - null = hammaga
- title (string)
- description (text)
- type (enum: pdf, link, presentation, video)
  # MVP: faqat 'pdf', 'link', 'presentation' (video yo'q)
  # Phase 3: 'video' qo'shilishi mumkin (ixtiyoriy)
- file_url (string)
- size (integer)
- created_at, updated_at
```

#### 16. Payments
```
- id (UUID)
- tenant_id (FK)
- student_id (FK)
- parent_id (FK, nullable)
- amount (decimal)
- payment_type (enum: tuition, books, uniform, other)
- payment_method (enum: cash, click, payme, uzum)
  # MVP: faqat 'cash'
  # Phase 2: 'click', 'payme', 'uzum' qo'shiladi
- status (enum: pending, completed, failed, refunded)
- transaction_id (string, nullable) - online payments uchun
- invoice_number (string)
- due_date (date)
- paid_date (date, nullable)
- received_by (FK -> users) - qaysi xodim qabul qilgan (naqd uchun)
- receipt_number (string, nullable) - chek raqami
- notes (text)
- created_at, updated_at
```

#### 17. Payment_Plans
```
- id (UUID)
- tenant_id (FK)
- name (string) - Oylik, 3 oylik, Yillik
- description (text)
- amount (decimal)
- duration_months (integer)
- discount_percentage (decimal)
- is_active (boolean)
- created_at, updated_at
```

#### 18. Messages
```
- id (UUID)
- tenant_id (FK)
- sender_id (FK -> users)
- receiver_id (FK -> users)
- subject (string)
- content (text)
- attachments (JSON)
- is_read (boolean)
- read_at (timestamp)
- parent_message_id (FK, nullable) - thread uchun
- created_at, updated_at
```

#### 19. Announcements
```
- id (UUID)
- tenant_id (FK)
- author_id (FK -> users)
- title (string)
- content (text)
- target_audience (enum: all, class, grade, parents, teachers)
- target_id (UUID, nullable) - class_id yoki grade_level
- priority (enum: low, medium, high)
- published_at (timestamp)
- expires_at (timestamp, nullable)
- attachments (JSON)
- created_at, updated_at
```

#### 20. Notifications
```
- id (UUID)
- tenant_id (FK)
- user_id (FK)
- type (enum: grade, attendance, payment, announcement, message)
- title (string)
- content (text)
- link (string, nullable)
- is_read (boolean)
- read_at (timestamp)
- created_at
```

#### 21. Activity_Logs
```
- id (UUID)
- tenant_id (FK)
- user_id (FK)
- action (string) - "created_student", "updated_grade"
- resource_type (string) - "student", "grade"
- resource_id (UUID)
- metadata (JSON)
- ip_address (string)
- user_agent (string)
- created_at
```

---

## 6. 🎨 UI/UX TALABLARI

### Design Principles
- **Modern va Minimalist** - ortiqcha elementlarsiz
- **Responsive** - mobile-first approach
- **Accessible** - WCAG 2.1 standartlari
- **Fast** - 3 soniyadan tez yuklash
- **Intuitive** - training kerak bo'lmasligi

### Color Scheme
- Primary: Blue (#3B82F6) - ishonch va profesionallik
- Success: Green (#10B981) - muvaffaqiyat
- Warning: Orange (#F59E0B) - ogohlantirish
- Danger: Red (#EF4444) - xato va xavflar
- Neutral: Gray scale

### Typography
- Font: Inter / Roboto
- Sizes: hierarchical system

### Components
- Buttons - primary, secondary, outline
- Forms - validation messages
- Tables - sortable, filterable
- Cards - information display
- Modals - actions confirmation
- Toast notifications - feedback
- Loading states - skeletons

### Mobile Optimization
- Touch-friendly buttons (min 44x44px)
- Swipe gestures
- Bottom navigation
- Responsive tables

---

## 7. 🔒 XAVFSIZLIK

### Authentication
- [ ] Secure password hashing (bcrypt)
- [ ] JWT tokens (access + refresh)
- [ ] Session management
- [ ] Rate limiting (login attempts)
- [ ] 2FA support

### Authorization
- [ ] Role-based access control
- [ ] Row-level security (tenant isolation)
- [ ] API route protection
- [ ] Permission checks

### Data Security
- [ ] HTTPS only
- [ ] SQL injection prevention (Prisma)
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Input validation (Zod)
- [ ] Sensitive data encryption (salaries, etc.)

### File Upload Security
- [ ] File type validation
- [ ] File size limits
- [ ] Virus scanning (optional)
- [ ] Secure file storage

### Compliance
- [ ] GDPR considerations
- [ ] Data backup strategy
- [ ] Audit logs

---

## 8. 💳 TO'LOV TIZIMI

### MVP: Naqd To'lovlar
> **Hozirgi holat:** Maktablar faqat naqd pul qabul qiladi.

#### Naqd To'lov Funksiyalari
- [ ] To'lov invoice yaratish
- [ ] Naqd to'lov qabul qilish va tizimga kiritish
  - To'lov summasi
  - To'lov sanasi
  - Qabul qilgan xodim
  - Izoh
- [ ] To'lov tarixi
- [ ] To'lanmagan qarzlar ro'yxati
- [ ] To'lov eslatmalari
- [ ] Chek chop etish (print)
- [ ] To'lovlar hisoboti (Excel)

---

### Phase 2: Online To'lov Integratsiyalari *(KEYINCHALIK)*

#### Click API
- [ ] Prepare URL generation
- [ ] Payment verification
- [ ] Webhook handling
- [ ] Transaction status check

#### Payme API
- [ ] CheckPerformTransaction
- [ ] CreateTransaction
- [ ] PerformTransaction
- [ ] CancelTransaction
- [ ] CheckTransaction

#### Uzum Bank
- [ ] API integration
- [ ] Payment processing
- [ ] Refunds handling

### Advanced Payment Features (Phase 2)
- [ ] Automatic invoice generation
- [ ] Payment reminders (SMS/Email)
- [ ] Online receipt sending
- [ ] Auto payment status updates
- [ ] Refund support

---

## 9. 📊 HISOBOTLAR VA ANALYTICS

### Admin Reports
- [ ] Moliyaviy hisobotlar
- [ ] O'quvchilar statistikasi
- [ ] O'qituvchilar performance
- [ ] To'lovlar analitikasi
- [ ] Enrollment trends

### Teacher Reports
- [ ] Sinf performance
- [ ] O'quvchilar reytingi
- [ ] Davomat hisoboti
- [ ] Baholar statistikasi

### Parent Reports
- [ ] Farzand progress report
- [ ] Baholar dinamikasi
- [ ] Davomat summary

### Export Options
- [ ] PDF export
- [ ] Excel export
- [ ] Print-friendly versions

---

## 10. 📱 BILDIRISHNOMALAR

### Types
- **Email** - muhim xabarlar uchun
- **SMS** - tezkor xabarlar
- **Push Notifications** - real-time
- **In-app** - tizim ichida

### Notification Events
- [ ] Yangi baho qo'yildi
- [ ] Uy vazifa deadline yaqinlashdi
- [ ] To'lov muddati yaqinlashdi
- [ ] O'quvchi kelmadi (ota-onaga)
- [ ] Yangi e'lon
- [ ] Yangi xabar
- [ ] To'lov muvaffaqiyatli bajarildi

### Settings
- [ ] Notification preferences (user tomonidan)
- [ ] Email/SMS templates
- [ ] Frequency control

---

## 11. 🚀 DEPLOYMENT VA HOSTING

### Development Environment
- Local development with PostgreSQL
- Environment variables (.env)
- Hot reload

### Staging Environment
- Test server
- Dummy data for testing
- QA testing

### Production
- **Frontend:** Vercel
  - Automatic deployments from main branch
  - Preview deployments for PRs
  - CDN caching
  - SSL certificates

- **Database:** Railway / Supabase / Neon
  - Automatic backups (daily)
  - Scaling options
  - Connection pooling

- **File Storage:** AWS S3 / Cloudinary
  - CDN delivery
  - Image optimization

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Database query optimization

### Backup Strategy
- [ ] Daily database backups
- [ ] File storage backups
- [ ] Backup retention (30 days)
- [ ] Disaster recovery plan

---

## 12. 📈 PERFORMANCE TALABLARI

### Speed
- [ ] Initial page load < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] API response < 500ms
- [ ] Database queries optimized (indexes)

### Scalability
- [ ] Support 1000+ concurrent users
- [ ] Database connection pooling
- [ ] Redis caching (optional)
- [ ] Image lazy loading
- [ ] Code splitting

### SEO
- [ ] Meta tags
- [ ] Sitemap
- [ ] Open Graph tags
- [ ] Structured data

---

## 13. 🧪 TESTING

### Unit Tests
- [ ] Utility functions
- [ ] API routes
- [ ] Database queries

### Integration Tests
- [ ] API endpoints
- [ ] Payment flows
- [ ] Authentication

### E2E Tests (optional)
- [ ] Critical user flows
- [ ] Playwright / Cypress

### Manual Testing
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Accessibility testing

---

## 14. 📚 DOCUMENTATION

### Technical Documentation
- [ ] Setup instructions (README.md)
- [ ] API documentation
- [ ] Database schema
- [ ] Deployment guide

### User Documentation
- [ ] Admin user guide
- [ ] Teacher user guide
- [ ] Parent user guide
- [ ] FAQ
- [ ] Video tutorials (optional)

---

## 15. 🎯 RIVOJLANISH BOSQICHLARI (PHASES)

### Phase 1: MVP (2-3 oy)
**Maqsad:** Asosiy funksiyalar bilan ishlaydigan tizim

✅ **MVP DA KIRADI:**
- ✅ Authentication (login, register, role-based access)
- ✅ Super Admin: maktablar qo'shish/boshqarish
- ✅ Admin Panel:
  - O'quvchilar, o'qituvchilar, sinflar CRUD
  - Fanlar boshqaruvi
  - Dars jadvali yaratish
  - **Naqd to'lovlar kiritish va boshqarish**
  - Moliyaviy hisobotlar (naqd)
- ✅ O'qituvchi Panel:
  - Davomat kiritish
  - Baholar kiritish
  - Hisobotlar ko'rish
  - Xabarlar (basic chat)
- ✅ Ota-ona Panel:
  - Farzand ma'lumotlarini ko'rish
  - Baholar va davomat
  - To'lov tarixi va qarzlar ko'rish
  - Xabarlar
- ✅ Basic dashboard har bir rol uchun
- ✅ Asosiy statistika va hisobotlar
- ✅ Excel export (baholar, davomat, to'lovlar)

❌ **KEYINGI BOSQICHGA QOLDIRILDI:**
- ❌ O'quvchi paneli (hozircha yo'q)
- ❌ Online to'lov integratsiyalari (Click, Payme, Uzum)
- ❌ Uy vazifalari tizimi
- ❌ Video dars materiallari
- ❌ Advanced analytics va grafiklar
- ❌ SMS/Email notifications (faqat in-app)
- ❌ Mobile app
- ❌ Custom branding

### Phase 2: Online To'lovlar va Communication (1-1.5 oy)
- ✅ Click, Payme, Uzum integratsiyasi
- ✅ Online to'lovlar (ota-onalar tomonidan)
- ✅ Avtomatik invoice generation
- ✅ Email notifications
- ✅ SMS notifications (Eskiz.uz / Playmobile)
- ✅ To'lov eslatmalari (avtomatik)

### Phase 3: Learning Features (1-1.5 oy)
- ✅ Uy vazifalari tizimi
  - O'qituvchi: vazifa yaratish
  - Ota-ona: vazifa ko'rish
  - Baholash tizimi
- ✅ O'quvchi paneli qo'shish
  - Login va authentication
  - Baholar ko'rish
  - Uy vazifalarini topshirish
  - Dars jadvali
- ✅ Dars materiallari (ixtiyoriy)
  - PDF darsliklar
  - Prezentatsiyalar
  - Havolalar
- ✅ Video darslar (ixtiyoriy - agar kerak bo'lsa)
- ✅ File management system
- ✅ Rich text editor

### Phase 4: Advanced Features (1-2 oy)
- ✅ Advanced analytics va charts
- ✅ Predictive analytics
- ✅ Excel import/export (bulk operations)
- ✅ Automated report generation (PDF)
- ✅ Push notifications (PWA)
- ✅ Custom branding (har bir maktab uchun)
- ✅ Multi-language support

### Phase 5: Optimization & Scaling (davomiy)
- Performance optimization
- Caching (Redis)
- CDN setup
- Load testing
- Security audit
- Bug fixes va improvements

---

## 16. 💰 BIZNES MODEL (Sizning daromadingiz)

### Subscription Plans (har bir maktab uchun)

#### 🥉 Basic Plan - 500,000 so'm/oy
- 50 o'quvchigacha
- 10 o'qituvchigacha
- Asosiy funksiyalar
- Email support

#### 🥈 Standard Plan - 1,000,000 so'm/oy
- 200 o'quvchigacha
- 30 o'qituvchigacha
- Barcha funksiyalar
- To'lov integratsiyalari
- SMS notifications (500 SMS/oy)
- Priority support

#### 🥇 Premium Plan - 2,000,000 so'm/oy
- Unlimited o'quvchilar
- Unlimited o'qituvchilar
- Barcha funksiyalar
- SMS notifications (2000 SMS/oy)
- Custom branding (logo, rang)
- Dedicated support
- Training sessions

#### ⭐ Enterprise - Muzokaralar asosida
- Maxsus talablar
- Custom integrations
- On-premise deployment (optional)
- SLA guarantees

### Additional Revenue
- **Setup Fee:** 500,000 - 1,000,000 so'm (bir martalik)
  - Maktabni tizimga qo'shish
  - Dastlabki ma'lumotlar kiritish
  - Training
  
- **Training:** 300,000 so'm/sessiya
- **Custom Development:** 100,000 so'm/soat
- **SMS/Email Packages:** qo'shimcha xabarlar uchun

### Payment Terms
- Oylik to'lov (avans)
- 30 kunlik trial period (bepul)
- To'lov qilmasa - tizim to'xtatiladi
- Annual payment - 10% chegirma

---

## 17. 🎓 O'RNATISH VA TRAINING JARAYONI

### Onboarding Checklist (Har bir yangi maktab uchun)

#### 1-kun: Tizimni sozlash
- [ ] Yangi maktab yaratish
- [ ] Admin account yaratish
- [ ] Maktab ma'lumotlari (nom, logo, manzil)
- [ ] To'lov rejasini tanlash

#### 2-kun: Ma'lumotlar kiritish
- [ ] Sinflar yaratish
- [ ] Fanlar qo'shish
- [ ] O'qituvchilarni import qilish
- [ ] O'quvchilarni import qilish

#### 3-kun: Training (Adminlar uchun)
- [ ] Tizimga kirish
- [ ] O'quvchi/o'qituvchi qo'shish
- [ ] Sinflar boshqarish
- [ ] Dars jadvali yaratish
- [ ] Hisobotlar ko'rish

#### 4-kun: Training (O'qituvchilar uchun)
- [ ] Login qilish
- [ ] Davomat kiritish
- [ ] Baholar kiritish
- [ ] Xabarlar yuborish

#### 5-kun: Training (Ota-onalar uchun)
- [ ] Login qo'llanma (SMS/Email)
- [ ] Ma'lumotlarni ko'rish
- [ ] To'lov qilish

#### Follow-up
- 1-hafta: Support call
- 1-oy: Progress check
- 3-oy: Feature feedback

---

## 18. 🛠️ TEXNIK REQUIREMENTS (Development)

### Development Tools
- **IDE:** VS Code
- **Extensions:**
  - ESLint
  - Prettier
  - Prisma
  - Tailwind CSS IntelliSense
  
### Version Control
- Git branches strategy
  - `main` - production
  - `staging` - testing
  - `dev` - development
  - `feature/*` - yangi features

### Code Quality
- ESLint configuration
- Prettier code formatting
- Husky pre-commit hooks
- TypeScript strict mode

### Environment Variables
```env
# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# File Upload
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Payments
CLICK_MERCHANT_ID=
CLICK_SECRET_KEY=
PAYME_MERCHANT_ID=

# Communications
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
SMS_API_KEY=
```

---

## 19. ⚠️ RISKS VA MITIGATION

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Database performance | High | Proper indexing, query optimization, caching |
| Data loss | Critical | Regular backups, redundancy |
| Security breach | Critical | Security best practices, audits |
| Payment integration issues | High | Thorough testing, fallback options |
| Scalability issues | Medium | Cloud hosting, load testing |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Maktablar to'lovdan voz kechishi | High | Trial period, good support, value demonstration |
| Competitor emergence | Medium | Continuous improvement, customer relationships |
| Regulatory changes | Medium | Stay informed, flexibility |

---

## 20. 🎉 SUCCESS METRICS

### Technical KPIs
- [ ] System uptime > 99.5%
- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] Zero critical bugs in production
- [ ] Test coverage > 70%

### Business KPIs
- [ ] 10 maktab 6 oy ichida
- [ ] 50 maktab 1 yil ichida
- [ ] Customer satisfaction > 4.5/5
- [ ] Churn rate < 10%
- [ ] Monthly recurring revenue growth

### User Adoption
- [ ] 80% daily active users (o'qituvchilar)
- [ ] 60% weekly active users (ota-onalar)
- [ ] Average session duration > 5 minutes

---

## 21. 📞 SUPPORT STRATEGY

### Support Channels
- **Telegram Group/Channel** - tezkor savol-javob
- **Email Support** - support@yourlms.uz
- **Phone Support** - faqat Premium plan uchun
- **Video Tutorials** - YouTube channel
- **Knowledge Base** - FAQ va guides

### Support Tiers
- **Basic:** Email, 48 soat javob
- **Standard:** Email + Telegram, 24 soat javob
- **Premium:** Email + Telegram + Phone, 4 soat javob
- **Enterprise:** Dedicated support manager

### Support Hours
- Ish kunlari: 9:00 - 18:00
- Dam olish kunlari: Email only (javob Dushanba)

---

## 22. 🔮 FUTURE ENHANCEMENTS (v2.0+)

### Advanced Features
- [ ] AI-powered recommendations (o'quvchi uchun)
- [ ] Predictive analytics (kim muvaffaqiyatsiz bo'lishi mumkin)
- [ ] Gamification (badges, points)
- [ ] Virtual classroom (Zoom/Google Meet integration)
- [ ] Discussion forums
- [ ] Library management
- [ ] Transport management
- [ ] Cafeteria management
- [ ] Event management
- [ ] Certificate generation
- [ ] Alumni management

### Mobile Apps
- [ ] React Native mobile app (iOS & Android)
- [ ] Offline mode support
- [ ] Biometric authentication

### Integrations
- [ ] Google Classroom import
- [ ] Microsoft Teams integration
- [ ] Accounting software integration
- [ ] Government reporting systems

### Multi-language
- [ ] O'zbekcha (default)
- [ ] Русский
- [ ] English

---

## 23. ✅ TASDIQLASH (SIGN-OFF)

### Loyiha muddati: 4-6 oy (MVP + Payment + Learning)
### Boshlash sanasi: _____________
### Yakunlash sanasi (MVP): _____________

### Stakeholders:
- **Dasturchi:** ________________
- **Loyiha egasi:** ________________

---

## 📝 IZOHLAR VA MUHIM O'ZGARISHLAR

Bu texnik topshiriq dastlabki versiya. Rivojlanish jarayonida qo'shimcha talablar va o'zgarishlar kiritilishi mumkin.

### ⚠️ MVP uchun Muhim Qarorlar:

1. **💰 To'lovlar:** 
   - ✅ MVP: Faqat naqd to'lovlar (qo'lda kiritish)
   - ⏳ Phase 2: Click, Payme, Uzum integratsiyasi

2. **👨‍🎓 O'quvchi Paneli:**
   - ❌ MVP: Yo'q (ota-onalar orqali boshqariladi)
   - ⏳ Phase 3: Qo'shiladi

3. **🎥 Video Darslar:**
   - ❌ MVP: Yo'q (talab qilinmaydi)
   - ⏳ Phase 3: Ixtiyoriy ravishda qo'shilishi mumkin

4. **📱 Notifications:**
   - ✅ MVP: Faqat in-app (tizim ichida)
   - ⏳ Phase 2: Email va SMS

Bu o'zgarishlar MVP ni soddalashtiradi va 2-3 oyda ishga tushirish imkonini beradi! 🚀

---

**Keyingi qadamlar:**
1. ✅ Texnik topshiriqni ko'rib chiqish va tasdiqlash
2. 🏗️ Loyiha strukturasini yaratish
3. 🗄️ Database schema (Prisma) sozlash
4. 🎨 Design system va UI components
5. 💻 Development boshlash (MVP Phase 1)

---

**Hujjat versiyasi:** 1.1 (MVP optimized)
**Oxirgi yangilanish:** 2025-11-26
**Tuzdi:** AI Assistant + Loyiha egasi
**O'zgarishlar:** 
- Naqd to'lovlar uchun moslashtirildi
- O'quvchi paneli Phase 3ga ko'chirildi
- Video darslar ixtiyoriy qilindi
- MVP scope aniqroq belgilandi

---


