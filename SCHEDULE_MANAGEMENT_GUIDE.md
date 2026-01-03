# LMS Schedule Management Guide

Bu hujjatda Schedule Management (Dars Jadvali) tizimi haqida to'liq ma'lumot.

## 📁 Yaratilgan Fayllar

### Validation & Actions
```
lib/validations/
  └── schedule.ts                    # Validation schemas, conflict checker

app/actions/
  └── schedule.ts                    # Server actions (CRUD + conflict detection)
```

### Components
```
components/
  └── timetable.tsx                  # Visual weekly timetable component
```

### Admin Pages
```
app/(dashboard)/admin/schedules/
  ├── page.tsx                       # Schedule management dashboard
  └── create/
      ├── page.tsx                   # Create schedule page
      └── schedule-form.tsx          # Client form component
```

### Teacher/Parent Pages
```
app/(dashboard)/
  ├── teacher/schedule/page.tsx     # Teacher's weekly schedule
  └── parent/schedule/page.tsx      # Children's class schedule
```

---

## 🎯 Key Features

### 1. **Schedule Creation**
- Admin creates schedules for classes
- Select: Class, Subject, Teacher, Day, Time, Room
- Automatic conflict detection (teacher, class, room)
- Validation (end time > start time)

### 2. **Visual Timetable**
- Weekly grid view (Monday-Saturday)
- Color-coded by subject
- Shows: Subject, Time, Room, Teacher
- Responsive (grid on desktop, list on mobile)

### 3. **Conflict Detection**
- Teacher conflicts (can't teach 2 classes at once)
- Class conflicts (can't have 2 subjects at once)
- Room conflicts (can't use same room at once)
- Real-time validation

### 4. **Multi-Role Views**
- **Admin**: All schedules, create/edit/delete
- **Teacher**: Personal weekly schedule
- **Parent**: Children's class schedules
- **Student**: Class schedule (Phase 3)

---

## 📚 Schedule Schema

### Validation

```typescript
const scheduleSchema = z.object({
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  dayOfWeek: z.number().min(1).max(7),  // 1=Monday, 7=Sunday
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  roomNumber: z.string().optional(),
  academicYear: z.string().min(1),
})
```

### Database Model

```prisma
model Schedule {
  id           String   @id @default(cuid())
  tenantId     String
  classId      String
  subjectId    String
  teacherId    String
  dayOfWeek    Int      // 1-7 (Monday-Sunday)
  startTime    String   // HH:MM format
  endTime      String   // HH:MM format
  roomNumber   String?
  academicYear String
  createdAt    DateTime @default(now())
  
  tenant   Tenant   @relation(...)
  class    Class    @relation(...)
  subject  Subject  @relation(...)
  teacher  Teacher  @relation(...)
}
```

---

## 🔍 Conflict Detection

### Algorithm

```typescript
function checkTimeConflict(schedule1, schedule2): boolean {
  const start1 = timeToMinutes(schedule1.startTime)
  const end1 = timeToMinutes(schedule1.endTime)
  const start2 = timeToMinutes(schedule2.startTime)
  const end2 = timeToMinutes(schedule2.endTime)
  
  // Times overlap if:
  // start1 < end2 AND end1 > start2
  return (start1 < end2 && end1 > start2)
}

// Examples:
// 08:00-08:45 vs 08:30-09:15 → CONFLICT (overlap 15 min)
// 08:00-08:45 vs 08:45-09:30 → NO CONFLICT (touching is OK)
// 08:00-08:45 vs 09:00-09:45 → NO CONFLICT (gap)
```

### Conflict Types

**1. Teacher Conflict**
```typescript
// Check if teacher has another class at same time
const teacherSchedules = await db.schedule.findMany({
  where: {
    teacherId: data.teacherId,
    dayOfWeek: data.dayOfWeek,
    academicYear: data.academicYear,
  }
})

for (const existing of teacherSchedules) {
  if (checkTimeConflict(newSchedule, existing)) {
    return { error: 'O\'qituvchi bu vaqtda boshqa darsda band' }
  }
}
```

**2. Class Conflict**
```typescript
// Check if class has another lesson at same time
const classSchedules = await db.schedule.findMany({
  where: {
    classId: data.classId,
    dayOfWeek: data.dayOfWeek,
    academicYear: data.academicYear,
  }
})

for (const existing of classSchedules) {
  if (checkTimeConflict(newSchedule, existing)) {
    return { error: 'Sinf bu vaqtda boshqa darsda band' }
  }
}
```

**3. Room Conflict**
```typescript
// Check if room is occupied at same time
if (data.roomNumber) {
  const roomSchedules = await db.schedule.findMany({
    where: {
      roomNumber: data.roomNumber,
      dayOfWeek: data.dayOfWeek,
      academicYear: data.academicYear,
    }
  })

  for (const existing of roomSchedules) {
    if (checkTimeConflict(newSchedule, existing)) {
      return { error: `Xona ${data.roomNumber} bu vaqtda band` }
    }
  }
}
```

---

## 🎨 Visual Timetable Component

### Desktop View (Grid)

```
┌─────────────────────────────────────────────────────────────┐
│              DARS JADVALI - 10-A                            │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────┤
│ DUSHANBA │ SESHANBA │ CHORSHANBA│ PAYSHANBA│  JUMA   │SHANBA│
├──────────┼──────────┼──────────┼──────────┼──────────┼──────┤
│ Matematik│ Fizika   │ Ingliz   │ Matematika│ Kimyo   │ Sport│
│ 08:00-   │ 08:00-   │ 08:00-   │ 08:00-    │ 08:00-  │08:00-│
│ 08:45    │ 08:45    │ 08:45    │ 08:45     │ 08:45   │08:45 │
│ Xona 201 │ Xona 105 │ Xona 301 │ Xona 201  │ Lab 1   │Zal  │
│ A.Karimov│ S.Tohirov│ D.Azimova│ A.Karimov │ N.Usmonov│...  │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────┤
│ Fizika   │ Ingliz   │ Matematika│ Adabiyot │ Tarix   │      │
│ 08:45-   │ 08:45-   │ 08:45-   │ 08:45-    │ 08:45-  │      │
│ 09:30    │ 09:30    │ 09:30    │ 09:30     │ 09:30   │      │
│ Lab 1    │ Xona 301 │ Xona 201 │ Xona 102  │ Xona 104│      │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────┘
```

### Mobile View (List)

```
DUSHANBA
┌────────────────────────────────┐
│ Matematika                     │
│ ⏰ 08:00 - 08:45               │
│ 📍 Xona 201                    │
│ 👤 Aziz Karimov                │
└────────────────────────────────┘

┌────────────────────────────────┐
│ Fizika                         │
│ ⏰ 08:45 - 09:30               │
│ 📍 Lab 1                       │
│ 👤 Sanjar Tohirov              │
└────────────────────────────────┘

SESHANBA
...
```

### Component Usage

```tsx
<Timetable 
  schedules={schedules}
  title="10-A Sinfi - Dars Jadvali"
  showTeacher={true}   // Show teacher names
  showClass={false}    // Hide class names (already in title)
/>
```

---

## 👨‍💼 Admin Workflow

### Creating a Schedule

**Step 1: Navigate**
```
Admin Dashboard → Dars Jadvali → Jadval Qo'shish
```

**Step 2: Fill Form**
```
1. Sinf: 10-A
2. Fan: Matematika
3. O'qituvchi: Aziz Karimov
4. Hafta kuni: Dushanba
5. Boshlanish: 08:00
6. Tugash: 08:45
7. Xona: 201
8. O'quv yili: 2024-2025 (auto)
```

**Step 3: Submit**
- Click "Saqlash"
- System checks conflicts:
  - ✓ Teacher available
  - ✓ Class free
  - ✓ Room available
- Success → Redirect to schedule list

**Conflict Example:**
```
Error: "O'qituvchi bu vaqtda boshqa darsda band"

Solution: Choose different time or teacher
```

### Viewing Schedules

**All Classes View:**
```
/admin/schedules

Shows:
- Statistics (total lessons, classes)
- Class filter buttons
- Table of all schedules
```

**Single Class View:**
```
/admin/schedules?classId=xxx

Shows:
- Visual weekly timetable for selected class
- All lessons in grid format
```

---

## 👨‍🏫 Teacher Workflow

### Viewing Personal Schedule

**Navigate:**
```
Teacher Dashboard → Mening Jadvali
or
/teacher/schedule
```

**Display:**
- Statistics:
  - Haftalik darslar: 24
  - Soat/hafta: 18.0
  - Ish kunlari: 6
  - Sinflar: 5

- Weekly timetable (shows classes, not teacher)

**Use Cases:**
- Check daily lessons
- See which classes to teach
- Know room numbers
- Plan week ahead

---

## 👨‍👩‍👧 Parent Workflow

### Viewing Child's Schedule

**Navigate:**
```
Parent Dashboard → Jadval
or
/parent/schedule
```

**Multiple Children:**
```
If parent has > 1 child:
[Zarina (10-A)] [Bobur (9-B)]  ← Tab selector

Shows selected child's class schedule
```

**Display:**
- Child name + Class name
- Weekly timetable
- All subjects with teachers
- Room numbers

**Use Cases:**
- Know when child has which subjects
- Contact relevant teachers
- Help with homework schedule
- Check if child should be at school

---

## ⏰ Time Slots

### Standard Schedule

```typescript
const TIME_SLOTS = [
  '08:00', // 1st period
  '08:45', // 2nd period
  '09:30', // 3rd period (15 min break)
  '10:15', // 4th period
  '11:00', // 5th period
  '11:45', // 6th period (Lunch: 45 min)
  '12:30', // 7th period
  '13:15', // 8th period
  '14:00', // 9th period (15 min break)
  '14:45', // 10th period
  '15:30', // 11th period
  '16:15', // 12th period
  '17:00', // End
]
```

### Period Duration
```
Standard: 45 minutes (08:00 - 08:45)
Can be customized per schedule
```

### Breaks
```
Small: 15 minutes (between periods 3-4, 9-10)
Lunch: 45 minutes (11:45 - 12:30)
```

---

## 📊 Statistics & Analytics

### Admin Dashboard

```typescript
// Total schedules
const totalSchedules = await db.schedule.count({
  where: { tenantId, academicYear }
})

// Schedules per class
const schedulesByClass = await db.schedule.groupBy({
  by: ['classId'],
  _count: true
})

// Schedules per teacher
const schedulesByTeacher = await db.schedule.groupBy({
  by: ['teacherId'],
  _count: true
})
```

### Teacher Statistics

```typescript
// Total lessons per week
const totalLessons = schedules.length

// Unique days (how many days/week teaching)
const uniqueDays = new Set(schedules.map(s => s.dayOfWeek)).size

// Unique classes
const uniqueClasses = new Set(schedules.map(s => s.classId)).size

// Total hours per week
const totalMinutes = schedules.reduce((sum, s) => {
  const start = timeToMinutes(s.startTime)
  const end = timeToMinutes(s.endTime)
  return sum + (end - start)
}, 0)
const totalHours = totalMinutes / 60
```

---

## 🎨 UI Components

### Days of Week

```typescript
const DAYS_OF_WEEK = [
  { value: 1, label: 'Dushanba' },     // Monday
  { value: 2, label: 'Seshanba' },     // Tuesday
  { value: 3, label: 'Chorshanba' },   // Wednesday
  { value: 4, label: 'Payshanba' },    // Thursday
  { value: 5, label: 'Juma' },         // Friday
  { value: 6, label: 'Shanba' },       // Saturday
  { value: 7, label: 'Yakshanba' },    // Sunday (optional)
]
```

### Schedule Card

```tsx
<div className="p-3 border rounded-lg bg-card hover:bg-accent">
  <div className="font-semibold text-primary">
    Matematika
  </div>
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Clock className="h-3 w-3" />
    08:00 - 08:45
  </div>
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <MapPin className="h-3 w-3" />
    Xona 201
  </div>
  <div className="text-xs text-muted-foreground">
    Aziz Karimov
  </div>
</div>
```

---

## 🔐 Permissions

| Action | Admin | Teacher | Parent | Student |
|--------|-------|---------|--------|---------|
| Create Schedule | ✅ | ❌ | ❌ | ❌ |
| View All Schedules | ✅ | ❌ | ❌ | ❌ |
| View Own Schedule | ✅ | ✅ | ❌ | ❌ |
| View Class Schedule | ✅ | ✅ | ✅ (children) | ✅ (own) |
| Edit Schedule | ✅ | ❌ | ❌ | ❌ |
| Delete Schedule | ✅ | ❌ | ❌ | ❌ |

---

## 🧪 Testing Scenarios

### Test Case 1: Create Schedule

```
✓ Select class, subject, teacher
✓ Select day and time
✓ Save successfully
✓ Appears in timetable
✓ Teacher can see it
✓ Class students/parents can see it
```

### Test Case 2: Teacher Conflict

```
✓ Create schedule for Teacher A at 08:00-08:45 Monday
✓ Try to create another at 08:00-08:45 Monday for same teacher
✓ Error: "O'qituvchi bu vaqtda boshqa darsda band"
✓ Cannot save
```

### Test Case 3: Class Conflict

```
✓ Create schedule for Class 10-A at 08:00-08:45 Monday
✓ Try to create another at 08:00-08:45 Monday for same class
✓ Error: "Sinf bu vaqtda boshqa darsda band"
✓ Cannot save
```

### Test Case 4: Room Conflict

```
✓ Create schedule for Room 201 at 08:00-08:45 Monday
✓ Try to create another at 08:00-08:45 Monday for same room
✓ Error: "Xona 201 bu vaqtda band"
✓ Cannot save
```

### Test Case 5: No Conflict (Touching Times)

```
✓ Schedule 1: 08:00-08:45
✓ Schedule 2: 08:45-09:30
✓ No conflict (touching is OK)
✓ Both save successfully
```

### Test Case 6: Time Validation

```
✓ Start: 09:00, End: 08:00
✓ Error: "Tugash vaqti boshlanish vaqtidan kech bo'lishi kerak"
✓ Cannot save
```

---

## 🚀 Performance

### Query Optimization

```typescript
// ✓ Good: Include relations in single query
const schedules = await db.schedule.findMany({
  where: { classId },
  include: {
    subject: true,
    teacher: { include: { user: true } }
  }
})

// ✗ Bad: N+1 queries
const schedules = await db.schedule.findMany({ where: { classId } })
for (const schedule of schedules) {
  const subject = await db.subject.findUnique({ where: { id: schedule.subjectId } })
}
```

### Conflict Checking

```typescript
// Only check schedules for same day
const existing = await db.schedule.findMany({
  where: {
    teacherId: data.teacherId,
    dayOfWeek: data.dayOfWeek,  // ← Filter by day
    academicYear: data.academicYear
  }
})

// Not all schedules for teacher
// Would be slower and unnecessary
```

---

## 📱 Mobile Responsiveness

### Grid → List

```css
/* Desktop: 6-column grid */
.timetable-grid {
  grid-template-columns: repeat(6, 1fr);
}

/* Mobile: Single column list */
@media (max-width: 768px) {
  .timetable-grid {
    display: none;
  }
  .timetable-list {
    display: block;
  }
}
```

### Touch-Friendly

- Large tap targets (buttons, cards)
- No hover-only interactions
- Scrollable lists
- Sticky day headers

---

## ✅ Summary

### Features Implemented:

| Feature | Status |
|---------|--------|
| Schedule Creation | ✅ Complete |
| Conflict Detection | ✅ Complete (3 types) |
| Visual Timetable | ✅ Complete (grid + list) |
| Admin Management | ✅ Complete |
| Teacher Schedule View | ✅ Complete |
| Parent Schedule View | ✅ Complete |
| Statistics | ✅ Complete |
| Mobile Responsive | ✅ Complete |

### Files Created:
- **Validation**: 1 file (schedule.ts)
- **Actions**: 1 file (4 functions)
- **Components**: 1 file (Timetable)
- **Pages**: 4 files (admin, teacher, parent, create)
- **Total**: 7 files, ~1,200 lines

### Key Stats:
- **Conflict Types**: 3 (teacher, class, room)
- **Days**: 7 (configurable, typically 1-6)
- **Time Slots**: 13 pre-defined
- **Roles Supported**: Admin, Teacher, Parent

---

## 🚀 Future Enhancements

### Phase 2: Advanced Features
- [ ] Drag-and-drop schedule editing
- [ ] Auto-generate optimal schedules (AI)
- [ ] Teacher preferences (preferred times)
- [ ] Subject hour requirements validation
- [ ] Print timetable (PDF export)

### Phase 2: Substitutions
- [ ] Teacher absence management
- [ ] Substitute teacher assignment
- [ ] Schedule changes notifications
- [ ] History of schedule changes

### Phase 3: Integration
- [ ] Link attendance to schedule (auto-mark periods)
- [ ] Link grades to schedule (grade by period)
- [ ] Homework assignments per schedule
- [ ] Calendar integration (Google, Outlook)

---

**Yozilgan sana**: 2024-11-26  
**Versiya**: 1.0  
**Holat**: ✅ Schedule Management Complete

