# 📚 Fanlar va Dars Jadvali - To'liq Qo'llanma

## 🎯 Yaratilgan Tizimlar

### 1️⃣ **Fanlar (Subjects) Tizimi** ✅

#### **Sahifalar:**
- `/admin/subjects` - Fanlar ro'yxati
- `/admin/subjects/create` - Yangi fan qo'shish
- `/admin/subjects/[id]/edit` - Fanni tahrirlash
- `/admin/subjects/quick-setup` - Tez sozlash (17 ta standart fan)

#### **Funksiyalar:**
✅ **CRUD operatsiyalari** (Create, Read, Update, Delete)
✅ **Bulk creation** - ko'p fanlarni bir vaqtda qo'shish
✅ **Ranglar** - har bir fan uchun rang
✅ **Validation** - kod va nom tekshiruvi
✅ **Relationship checking** - fan o'chishdan oldin ishlatilishini tekshirish
✅ **Statistics** - sinf, dars va baho soni

#### **Standart Fanlar (Quick Setup):**
1. Matematika (MATH)
2. Fizika (PHYS)
3. Kimyo (CHEM)
4. Biologiya (BIO)
5. Ona tili (UZ_LANG)
6. Ingliz tili (ENG)
7. Rus tili (RUS)
8. Tarix (HIST)
9. Geografiya (GEO)
10. Informatika (IT)
11. Jismoniy tarbiya (PE)
12. Texnologiya (TECH)
13. Chizmachilik (DRAW)
14. Musiqa (MUS)
15. Tasviriy san'at (ART)
16. Huquq (LAW)
17. Iqtisod (ECON)

---

### 2️⃣ **Dars Jadvali (Schedule) Tizimi** ✅

#### **Sahifalar:**
- `/admin/schedules` - Dars jadvali (barcha sinflar)
- `/admin/schedules/create` - Yangi dars qo'shish
- `/admin/schedule` - Eski sahifa (redirect qilish kerak)

#### **Funksiyalar:**
✅ **Conflict Detection:**
   - O'qituvchi band yoki yo'qligini tekshirish
   - Sinf band yoki yo'qligini tekshirish
   - Xona band yoki yo'qligini tekshirish
   - Vaqt overlap tekshiruvi

✅ **Validation:**
   - Tugash vaqti > Boshlanish vaqti
   - Sinf, fan, o'qituvchi mavjudligi

✅ **Features:**
   - Hafta kunlari bo'yicha ko'rish
   - Sinf bo'yicha filter
   - Vizual jadval (Timetable component)

---

## 🚀 Foydalanish Qo'llanmasi

### **1. Avval Fanlarni Qo'shing:**

```
Admin Panel → Fanlar → Tez sozlash
```

1. `/admin/subjects/quick-setup` ga o'ting
2. Kerakli fanlarni tanlang (yoki barchasini)
3. "Fanni qo'shish" tugmasini bosing
4. Fanlar avtomatik qo'shiladi

**Yoki bitta-bitta:**
1. `/admin/subjects/create` ga o'ting
2. Fan ma'lumotlarini kiriting
3. Rang tanlang
4. Saqlang

### **2. Dars Jadvali Yarating:**

```
Admin Panel → Dars jadvali → Yangi dars
```

1. `/admin/schedules/create` ga o'ting
2. Quyidagilarni tanlang:
   - **Sinf** (masalan: 11-A)
   - **Fan** (masalan: Matematika)
   - **O'qituvchi** (masalan: Karimov Sherzod)
   - **Hafta kuni** (masalan: Dushanba)
   - **Boshlanish vaqti** (masalan: 08:00)
   - **Tugash vaqti** (masalan: 08:45)
   - **Xona raqami** (ixtiyoriy: 101)
3. Saqlang

**Tizim avtomatik tekshiradi:**
- ✅ O'qituvchi bu vaqtda bo'sh yoki yo'q
- ✅ Sinf bu vaqtda bo'sh yoki yo'q
- ✅ Xona bu vaqtda bo'sh yoki yo'q

---

## 📊 Arxitektura

### **Database Schema:**

```prisma
model Subject {
  id          String  @id @default(cuid())
  tenantId    String
  name        String  // "Matematika"
  code        String  // "MATH" (unique per tenant)
  description String?
  color       String? // "#3b82f6"
  
  // Relations
  classSubjects ClassSubject[]
  schedules     Schedule[]
  grades        Grade[]
  
  @@unique([tenantId, code])
}

model Schedule {
  id           String   @id @default(cuid())
  tenantId     String
  classId      String
  subjectId    String   // → Subject
  teacherId    String   // → Teacher
  dayOfWeek    Int      // 1-7 (Monday-Sunday)
  startTime    String   // "08:00"
  endTime      String   // "08:45"
  roomNumber   String?
  academicYear String   // "2024-2025"
}
```

### **Server Actions:**

**Subjects:**
- `createSubject(data)` - Yangi fan qo'shish
- `updateSubject(id, data)` - Fanni yangilash
- `deleteSubject(id)` - Fanni o'chirish (tekshiruv bilan)
- `bulkCreateSubjects(subjects[])` - Ko'p fanlarni qo'shish

**Schedules:**
- `createSchedule(data)` - Yangi dars qo'shish (conflicts bilan)
- `updateSchedule(id, data)` - Darsni yangilash
- `deleteSchedule(id)` - Darsni o'chirish
- `bulkCreateSchedule(schedules[])` - Ko'p darslarni qo'shish

---

## 🎨 UI Components

### **Subjects:**
- `SubjectForm` - Create/Edit form
- `QuickSetupForm` - Bulk selection form
- `DeleteSubjectButton` - Delete with confirmation

### **Schedules:**
- `ScheduleForm` - Create/Edit form
- `Timetable` - Visual schedule grid
- `ClassFilter` - Filter by class

---

## 🔒 Security & Validation

### **Subjects:**
```typescript
✅ Tenant isolation (har maktab faqat o'z fanlarini ko'radi)
✅ Code uniqueness (bir maktabda bir xil kod bo'lmasligi)
✅ Relationship checking (ishlatilayotgan fanni o'chirmaslik)
✅ Admin-only access
```

### **Schedules:**
```typescript
✅ Tenant isolation
✅ Conflict detection:
   - Teacher time conflict
   - Class time conflict
   - Room time conflict
✅ Time validation (end > start)
✅ Academic year filtering
```

---

## 📱 User Roles

### **ADMIN:**
- ✅ Barcha fanlarni ko'rish, qo'shish, tahrirlash, o'chirish
- ✅ Dars jadvalini boshqarish
- ✅ Conflicts ko'rish va hal qilish

### **TEACHER:**
- ✅ O'z dars jadvalini ko'rish
- ❌ Tahrirlash huquqi yo'q

### **PARENT:**
- ✅ Farzandining dars jadvalini ko'rish
- ❌ Tahrirlash huquqi yo'q

### **STUDENT:**
- ✅ O'z dars jadvalini ko'rish
- ❌ Tahrirlash huquqi yo'q

---

## 🐛 Debugging

### **Agar fanlar ko'rinmasa:**

1. Database tekshiring:
```sql
SELECT * FROM "Subject" WHERE "tenantId" = 'your-tenant-id';
```

2. Quick Setup dan foydalaning:
```
/admin/subjects/quick-setup
```

3. Terminal loglarni tekshiring:
```bash
# Server terminalda
Error logs ni qidiring
```

### **Agar dars qo'shishda xatolik bo'lsa:**

1. **"Fan topilmadi"** → Avval fanlarni qo'shing
2. **"O'qituvchi band"** → Boshqa vaqt tanlang
3. **"Sinf band"** → Boshqa vaqt tanlang
4. **"Xona band"** → Boshqa xona yoki vaqt tanlang

---

## 📈 Statistika

### **Subjects Page:**
- Jami fanlar soni
- Faol fanlar (dars jadvalida bor)
- Har bir fan uchun:
  - Nechta sinfda o'qitiladi
  - Nechta dars bor
  - Nechta baho berilgan

### **Schedule Page:**
- Jami darslar soni
- Sinf bo'yicha darslar soni
- Haftalik jadval vizualizatsiyasi

---

## 🔄 Migration Path

### **Eski sistemdan yangi sistemga o'tish:**

1. ✅ Subjects tizimini yaratish (DONE)
2. ✅ Quick setup dan foydalanish
3. ⏳ Eski `/admin/schedule` ni `/admin/schedules` ga redirect qilish
4. ⏳ Bulk schedule creation UI yaratish

---

## 🎯 Keyingi Qadamlar

### **Tavsiya etiladigan yaxshilashlar:**

1. **Bulk Schedule Creation UI:**
   - Bir vaqtda bir sinf uchun barcha haftalik darslarni qo'shish
   - Template yaratish (masalan: 11-A ning barcha fanlar uchun)

2. **Schedule Templates:**
   - Standart jadvallar saqlash
   - Boshqa sinfga nusxa ko'chirish

3. **Conflict Resolution:**
   - Avtomatik bo'sh vaqtlarni topish
   - O'qituvchi va sinf uchun mumkin vaqtlarni ko'rsatish

4. **Reports:**
   - O'qituvchi yuklamasi (soatlar soni)
   - Sinf yuklamasi (dars soatlari)
   - Xona foydalanishi

5. **Calendar Integration:**
   - iCal export
   - Google Calendar sync

---

## ✅ Yakuniy Checklist

- [x] Subjects CRUD
- [x] Quick setup (17 ta stan dart fan)
- [x] Color coding
- [x] Schedule CRUD
- [x] Conflict detection (teacher, class, room)
- [x] Time validation
- [x] Timetable visualization
- [x] Admin sidebar menu
- [x] Relationship checking
- [x] Statistics
- [ ] Bulk schedule creation UI
- [ ] Schedule templates
- [ ] Reports

---

## 🎓 Foydalanish Misoli

### **Oddiy Workflow:**

```
1. Admin panel → Fanlar → Tez sozlash
   → 17 ta fanni tanladim → Qo'shildi ✅

2. Admin panel → Dars jadvali → Yangi dars
   → Sinf: 11-A
   → Fan: Matematika (endi ko'rinadi!)
   → O'qituvchi: Karimov Sherzod
   → Kun: Dushanba
   → Vaqt: 08:00 - 08:45
   → Saqlash ✅

3. Yana bir dars qo'shish:
   → Sinf: 11-A
   → Fan: Fizika
   → O'qituvchi: Karimov Sherzod
   → Kun: Dushanba
   → Vaqt: 08:30 - 09:15
   → Xatolik: "O'qituvchi bu vaqtda boshqa darsda band" ❌
   → Vaqtni o'zgartirdim: 09:00 - 09:45
   → Saqlash ✅
```

---

**🎉 Tizim tayyor! Endi fanlarni qo'shib, dars jadvalini yarata olasiz!**

