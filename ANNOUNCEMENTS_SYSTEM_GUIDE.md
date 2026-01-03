# LMS Announcements System Guide

Bu hujjatda Announcements System (E'lonlar Tizimi) - Maktab e'lonlari va yangiliklar tizimi haqida to'liq ma'lumot.

## 📁 Yaratilgan Fayllar

### Validation & Actions
```
lib/validations/
  └── announcement.ts               # Validation schemas, priority/audience utils

app/actions/
  └── announcement.ts               # Server actions (CRUD, pin/unpin)
```

### Components
```
components/
  ├── announcement-list.tsx         # Announcement display component
  └── ui/
      └── badge.tsx                 # Badge component (NEW)
```

### Admin Pages
```
app/(dashboard)/admin/announcements/
  ├── page.tsx                      # Announcements management
  ├── announcements-actions.tsx    # Action buttons component
  └── create/
      ├── page.tsx                  # Create announcement page
      └── announcement-form.tsx     # Create form component
```

### Teacher/Parent Pages
```
app/(dashboard)/
  ├── teacher/announcements/page.tsx  # Teacher view
  └── parent/announcements/page.tsx   # Parent view
```

---

## 🎯 Key Features

### 1. **School-Wide Announcements**
- Admin creates announcements
- Visible to all users (or specific groups)
- Priority levels (Low, Medium, High, Urgent)
- Target audiences (All, Teachers, Parents, Students)

### 2. **Priority System**
- **Low**: General information
- **Medium**: Important updates
- **High**: Very important
- **Urgent**: Critical, immediate attention required

### 3. **Pinned Announcements**
- Pin important announcements to top
- Visual distinction (yellow border)
- Always shown first

### 4. **Expiration Dates**
- Optional expiration
- Automatic hiding after expiration
- Warning for expiring soon
- Gray out expired announcements

### 5. **Target Audiences**
- **All**: Everyone sees it
- **Teachers**: Only teachers
- **Parents**: Only parents
- **Students**: Only students (Phase 3)

---

## 📚 Announcement Schema

### Validation

```typescript
const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  targetAudience: z.enum(['ALL', 'TEACHERS', 'PARENTS', 'STUDENTS']),
  expiresAt: z.string().optional(),  // ISO date string
  isPinned: z.boolean().default(false),
})
```

### Database Model

```prisma
model Announcement {
  id             String   @id @default(cuid())
  tenantId       String
  title          String
  content        String   @db.Text
  priority       AnnouncementPriority
  targetAudience TargetAudience
  isPinned       Boolean  @default(false)
  expiresAt      DateTime?
  authorId       String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  tenant Tenant @relation(...)
  author User   @relation(...)
}

enum AnnouncementPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TargetAudience {
  ALL
  TEACHERS
  PARENTS
  STUDENTS
}
```

---

## 🎨 UI Components

### Announcement Card

```
┌─────────────────────────────────────────────────────┐
│ 📌 MUHIM E'LONLAR                                   │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📌 Ta'til kunlari o'zgarishi                    │ │
│ │                                                  │ │
│ │ [Shoshilinch] [Hammaga] [Tez orada tugaydi]   │ │
│ │                                                  │ │
│ │ Hurmatli ota-onalar va o'qituvchilar!          │ │
│ │ Navro'z bayrami munosabati bilan ta'til        │ │
│ │ kunlari o'zgartirildi...                       │ │
│ │                                                  │ │
│ │ ────────────────────────────────────────────── │ │
│ │ Aziz Karimov • 26-noyabr 2024, 14:30          │ │
│ │ Amal qiladi: 30-noyabr 2024, 23:59            │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ BARCHA E'LONLAR                                     │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Yangi darslik keldi                             │ │
│ │                                                  │ │
│ │ [O'rta] [O'qituvchilarga]                      │ │
│ │                                                  │ │
│ │ Matematika bo'yicha yangi darsliklar           │ │
│ │ kutubxonaga keldi...                           │ │
│ │                                                  │ │
│ │ ────────────────────────────────────────────── │ │
│ │ Dilnoza Azimova • 25-noyabr 2024, 10:00       │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Priority Badges

```tsx
// Red - Urgent
<Badge className="border-red-500 text-red-700 bg-red-50">
  Shoshilinch
</Badge>

// Orange - High
<Badge className="border-orange-500 text-orange-700 bg-orange-50">
  Yuqori
</Badge>

// Blue - Medium
<Badge className="border-blue-500 text-blue-700 bg-blue-50">
  O'rta
</Badge>

// Gray - Low
<Badge className="border-gray-500 text-gray-700 bg-gray-50">
  Past
</Badge>
```

### Target Audience Badge

```tsx
<Badge variant="outline">
  <Users className="h-3 w-3 mr-1" />
  Hammaga
</Badge>
```

---

## 👨‍💼 Admin Workflow

### Creating an Announcement

**Step 1: Navigate**
```
Admin Dashboard → E'lonlar → Yangi E'lon
```

**Step 2: Fill Form**
```
Sarlavha: "Ta'til kunlari o'zgarishi"

Matn:
"Hurmatli ota-onalar va o'qituvchilar!
Navro'z bayrami munosabati bilan ta'til kunlari 
o'zgartirildi. 21-22 mart kunlari dam olish 
kunlari hisoblanadi."

Muhimlik darajasi: [Shoshilinch ▼]
Kimga ko'rsatish: [Hammaga ▼]
Amal qilish muddati: 30.11.2024 23:59
☑ Muhim e'lon (yuqorida ko'rsatiladi)
```

**Step 3: Create**
```
Click "Yaratish"
→ Success toast
→ Announcement published
→ Visible to target audience immediately
```

### Managing Announcements

**View All Announcements:**
```
/admin/announcements

Statistics:
- Jami e'lonlar: 15
- Muhim e'lonlar: 3
- Faol e'lonlar: 12

List:
- Pinned announcements first (yellow border)
- Regular announcements below
- Action buttons: Pin, Edit, Delete
```

**Pin/Unpin:**
```
Click Pin icon → Announcement moves to top
Click PinOff icon → Announcement moves to regular section
```

**Edit:**
```
Click Edit icon → Redirect to edit form
Update fields → Save
```

**Delete:**
```
Click Delete icon → Confirmation dialog
Confirm → Announcement deleted permanently
```

---

## 👨‍🏫 Teacher Workflow

### Viewing Announcements

**Navigate:**
```
Teacher Dashboard → E'lonlar
or
/teacher/announcements
```

**Display:**
```
Shows announcements where:
- targetAudience = 'ALL' OR 'TEACHERS'
- Not expired (OR no expiration)
- Sorted: Pinned first, then by date
```

**Features:**
- Read-only view
- No edit/delete
- See all relevant announcements
- Automatic updates

---

## 👨‍👩‍👧 Parent Workflow

### Viewing Announcements

**Navigate:**
```
Parent Dashboard → E'lonlar
or
/parent/announcements
```

**Display:**
```
Shows announcements where:
- targetAudience = 'ALL' OR 'PARENTS'
- Not expired (OR no expiration)
- Sorted: Pinned first, then by date
```

**Use Cases:**
1. School holiday notifications
2. Parent-teacher meeting announcements
3. Fee payment reminders
4. Event notifications
5. Important policy changes

---

## 🔔 Priority & Urgency

### Priority Levels

**1. LOW (Past)**
```
Color: Gray
Use: General information, tips, suggestions
Example: "Yangi kitoblar kutubxonada"
```

**2. MEDIUM (O'rta)**
```
Color: Blue
Use: Regular updates, reminders
Example: "Uy vazifalari haqida eslatma"
```

**3. HIGH (Yuqori)**
```
Color: Orange
Use: Important updates, required actions
Example: "Ota-onalar yig'ilishi"
```

**4. URGENT (Shoshilinch)**
```
Color: Red
Use: Critical, immediate attention needed
Example: "Ta'til kunlari o'zgarishi"
```

### Visual Hierarchy

```
1. Pinned + Urgent → Top, red badge, yellow border
2. Pinned + High → Top, orange badge, yellow border
3. Pinned + Medium → Top, blue badge, yellow border
4. Unpinned + Urgent → Red badge
5. Unpinned + High → Orange badge
6. Unpinned + Medium → Blue badge
7. Unpinned + Low → Gray badge
```

---

## 📅 Expiration System

### How It Works

```typescript
// When fetching announcements
where: {
  OR: [
    { expiresAt: null },           // No expiration
    { expiresAt: { gt: new Date() } } // Not yet expired
  ]
}
```

### Expiration States

**1. No Expiration:**
```
- expiresAt = null
- Always visible
- No expiration badge
```

**2. Active (Not Expired):**
```
- expiresAt > now
- Visible
- No warning if > 24 hours away
```

**3. Expiring Soon:**
```
- expiresAt < now + 24 hours
- Still visible
- Yellow badge: "Tez orada tugaydi"
```

**4. Expired:**
```
- expiresAt < now
- Hidden from non-admin users
- Admin sees with "Muddati o'tgan" badge
- Grayed out in admin panel
```

### Setting Expiration

```tsx
<Input
  type="datetime-local"
  value={formData.expiresAt}
  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
/>
```

**Examples:**
```
Tomorrow 11:59 PM:
  2024-11-27T23:59

Next Week:
  2024-12-03T17:00

No Expiration:
  Leave blank
```

---

## 🎯 Target Audience Filtering

### Filter Logic

**Admin View (All):**
```typescript
// Show all announcements
where: { tenantId }
```

**Teacher View:**
```typescript
// Show ALL or TEACHERS
where: {
  tenantId,
  targetAudience: { in: ['ALL', 'TEACHERS'] }
}
```

**Parent View:**
```typescript
// Show ALL or PARENTS
where: {
  tenantId,
  targetAudience: { in: ['ALL', 'PARENTS'] }
}
```

**Student View (Phase 3):**
```typescript
// Show ALL or STUDENTS
where: {
  tenantId,
  targetAudience: { in: ['ALL', 'STUDENTS'] }
}
```

### Use Cases by Audience

**ALL (Hammaga):**
- School holidays
- Major events
- Policy changes
- Emergency announcements

**TEACHERS:**
- Staff meetings
- Training sessions
- Curriculum updates
- Internal policies

**PARENTS:**
- Parent-teacher meetings
- Fee reminders
- Student progress reports
- Event invitations

**STUDENTS:**
- Exam schedules
- Assignment deadlines
- Club activities
- School trips

---

## 📊 Statistics Dashboard

### Admin Statistics

```typescript
// Total announcements
const totalAnnouncements = await db.announcement.count({
  where: { tenantId }
})

// Pinned announcements
const pinnedCount = announcements.filter(a => a.isPinned).length

// Active announcements (not expired)
const activeCount = announcements.filter(a => 
  !a.expiresAt || new Date(a.expiresAt) > new Date()
).length
```

**Display:**
```
┌───────────┐┌───────────┐┌───────────┐
│Jami       ││Muhim      ││Faol       │
│e'lonlar   ││e'lonlar   ││e'lonlar   │
│   15      ││    3      ││   12      │
└───────────┘└───────────┘└───────────┘
```

---

## 🧪 Testing Scenarios

### Test Case 1: Create Urgent Announcement

```
1. Login as Admin
2. Navigate to E'lonlar → Yangi E'lon
3. Fill form:
   - Title: "Emergency Announcement"
   - Content: "School closed tomorrow"
   - Priority: URGENT
   - Audience: ALL
   - Pin: Yes
4. Click "Yaratish"

✓ Announcement created
✓ Pinned to top
✓ Red priority badge
✓ Visible to all roles

5. Login as Teacher
6. Navigate to E'lonlar

✓ Announcement visible
✓ Pinned at top
✓ Red badge shown

7. Login as Parent
8. Navigate to E'lonlar

✓ Announcement visible
✓ Same display as teacher
```

### Test Case 2: Target Audience Filtering

```
Setup:
- Ann1: targetAudience = 'ALL'
- Ann2: targetAudience = 'TEACHERS'
- Ann3: targetAudience = 'PARENTS'

Teacher view:
✓ Sees Ann1 (ALL)
✓ Sees Ann2 (TEACHERS)
✗ Doesn't see Ann3 (PARENTS)

Parent view:
✓ Sees Ann1 (ALL)
✗ Doesn't see Ann2 (TEACHERS)
✓ Sees Ann3 (PARENTS)

Admin view:
✓ Sees all (Ann1, Ann2, Ann3)
```

### Test Case 3: Expiration

```
Setup:
- Ann1: expiresAt = tomorrow
- Ann2: expiresAt = in 1 hour
- Ann3: expiresAt = yesterday
- Ann4: expiresAt = null

Teacher view today:
✓ Sees Ann1 (not expired)
✓ Sees Ann2 (not expired, warning badge)
✗ Doesn't see Ann3 (expired)
✓ Sees Ann4 (no expiration)

Teacher view tomorrow:
✗ Doesn't see Ann1 (now expired)
✗ Doesn't see Ann2 (now expired)
✗ Doesn't see Ann3 (expired)
✓ Sees Ann4 (no expiration)

Admin view:
✓ Sees all, including expired (grayed out)
```

### Test Case 4: Pin/Unpin

```
1. Admin creates announcement (not pinned)
2. Announcement appears in regular section
3. Click Pin icon
4. Announcement moves to "Muhim e'lonlar" section
5. Yellow border applied
6. Click PinOff icon
7. Announcement moves back to regular section
8. Yellow border removed
```

---

## 🚀 Performance

### Query Optimization

```typescript
// ✓ Good: Filter in database
const announcements = await db.announcement.findMany({
  where: {
    tenantId,
    targetAudience: { in: ['ALL', 'TEACHERS'] },
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ]
  },
  include: {
    author: { select: { fullName: true } }
  },
  orderBy: [
    { isPinned: 'desc' },
    { createdAt: 'desc' }
  ]
})

// ✗ Bad: Fetch all, filter in code
const all = await db.announcement.findMany({ where: { tenantId } })
const filtered = all.filter(a => ...)
```

### Caching Strategy (Future)

```typescript
// Cache announcements for 5 minutes
export const revalidate = 300

// Or use ISR with on-demand revalidation
revalidatePath('/teacher/announcements')
```

---

## 🔄 Future Enhancements

### Phase 2: Rich Content

**1. Rich Text Editor:**
```
- Bold, italic, underline
- Lists, links
- Images
- Formatting
```

**2. Attachments:**
```
- Upload files
- PDF announcements
- Images, documents
```

**3. Reactions:**
```
- Like/acknowledge
- See who read
- Read receipts
```

### Phase 3: Advanced Features

**1. Scheduled Publishing:**
```
- Create in advance
- Auto-publish at set time
- Draft state
```

**2. Multi-Language:**
```
- Uzbek, Russian, English
- Auto-translate
- Language selector
```

**3. Push Notifications:**
```
- Real-time alerts
- Email notifications
- SMS for urgent
```

**4. Categories/Tags:**
```
- Academic, Administrative, Events
- Filter by category
- Tag-based filtering
```

### Phase 4: Analytics

```typescript
// Track views
model AnnouncementView {
  id             String   @id
  announcementId String
  userId         String
  viewedAt       DateTime @default(now())
}

// Analytics
- View count
- Read percentage
- Engagement metrics
```

---

## ✅ Summary

### Features Implemented:

| Feature | Status |
|---------|--------|
| Create Announcements | ✅ Complete |
| Edit Announcements | ✅ Complete |
| Delete Announcements | ✅ Complete |
| Priority System (4 levels) | ✅ Complete |
| Target Audience (4 types) | ✅ Complete |
| Pin/Unpin | ✅ Complete |
| Expiration System | ✅ Complete |
| Admin Management | ✅ Complete |
| Teacher View | ✅ Complete |
| Parent View | ✅ Complete |
| Visual Badges | ✅ Complete |
| Expiration Warnings | ✅ Complete |

### Files Created:
- **Validation**: 1 file
- **Server Actions**: 1 file (5 functions)
- **Components**: 2 files (AnnouncementList, Badge)
- **Pages**: 5 files (admin, admin create, teacher, parent)
- **Total**: 9 files, ~1,200 lines

### Key Stats:
- **Priority Levels**: 4 (Low, Medium, High, Urgent)
- **Target Audiences**: 4 (All, Teachers, Parents, Students)
- **Roles**: Admin (manage), Teacher/Parent (view)
- **Max Title Length**: 200 chars
- **Max Content Length**: 10,000 chars

---

## 📊 Complete Platform Status

| Feature | Status |
|---------|--------|
| **A. Create Forms** | ✅ Complete |
| **B. Edit Forms** | ✅ Complete |
| **C. Detail Pages** | ✅ Complete |
| **D. Delete Operations** | ✅ Complete |
| **E. Search & Filters** | ✅ Complete |
| **F. Pagination** | ✅ Complete |
| **G. Sorting** | ✅ Complete |
| **H. Bulk Operations** | ✅ Complete |
| **I. Grades & Attendance** | ✅ Complete |
| **J. Reports & Analytics** | ✅ Complete |
| **K. Schedule Management** | ✅ Complete |
| **L. Materials Management** | ✅ Complete |
| **M. Messaging System** | ✅ Complete |
| **N. Announcements System** | ✅ Complete |

---

**Yozilgan sana**: 2024-11-26  
**Versiya**: 1.0  
**Holat**: ✅ Announcements System Complete

