# 👨‍👩‍👧‍👦 QARINDOSHLAR TIZIMI - TO'LIQ YANGILANISH

**Sana**: 2024-yil Dekabr  
**Versiya**: 2.0  
**Holat**: ✅ TAYYOR (Test qilish kerak)

---

## 📋 O'ZGARISHLAR SUMMARY

### ❌ ESKI TIZIM
```
- "Ota-ona Ma'lumotlari" - bitta ota-ona
- Email orqali kirish
- Relationship: father | mother | guardian (text)
- isPrimary flag
```

### ✅ YANGI TIZIM
```
- "Qarindoshlari Ma'lumotlari" - ko'p qarindoshlar
- Telefon orqali kirish (qarindoshlar uchun)
- GuardianType enum: FATHER | MOTHER | OTHER
- customRelationship (agar OTHER)
- hasAccess flag (nazoratchi paneli)
- Dynamic form (+ tugma bilan qo'shish)
```

---

## 🗄️ DATABASE O'ZGARISHLARI

### 1. Yangi Enum
```prisma
enum GuardianType {
  FATHER // Ota
  MOTHER // Ona
  OTHER // Boshqa qarindosh (qo'lda kiritiladi)
}
```

### 2. Parent Model O'zgarishlari
```prisma
model Parent {
  id       String @id @default(cuid())
  tenant   Tenant @relation(...)
  tenantId String
  user     User   @relation(...)
  userId   String @unique

  // ❌ ESKI
  // relationship String // father, mother, guardian
  
  // ✅ YANGI
  guardianType GuardianType @default(OTHER) // FATHER, MOTHER, OTHER
  customRelationship String? // Agar guardianType = OTHER
  
  // Optional fields
  occupation       String?
  workAddress      String?
  emergencyContact String?

  // Relations
  students StudentParent[]
  payments Payment[]
}
```

### 3. StudentParent O'zgarishi
```prisma
model StudentParent {
  student   Student @relation(...)
  studentId String
  parent    Parent  @relation(...)
  parentId  String
  
  // ❌ ESKI
  // isPrimary Boolean @default(false)
  
  // ✅ YANGI
  hasAccess Boolean @default(false) // Nazorat paneliga kirish huquqi

  createdAt DateTime @default(now())

  @@id([studentId, parentId])
  @@index([hasAccess]) // Yangi index
}
```

---

## 📝 VALIDATION SCHEMA

### Yangi Guardian Schema
```typescript
// lib/validations/student.ts

export const guardianSchema = z.object({
  fullName: z.string().min(3, 'To\'liq ism kamida 3 ta harf'),
  phone: z.string().min(9, 'Telefon raqami kamida 9 ta raqam'),
  guardianType: z.enum(['FATHER', 'MOTHER', 'OTHER']),
  customRelationship: z.string().optional(), // Agar OTHER
  hasAccess: z.boolean().default(false),
  occupation: z.string().optional(),
  workAddress: z.string().optional(),
}).refine((data) => {
  // Agar guardianType = OTHER, customRelationship majburiy
  if (data.guardianType === 'OTHER' && !data.customRelationship) {
    return false
  }
  return true
}, {
  message: 'Qarindoshlik turini kiriting (masalan: Amaki, Xola)',
  path: ['customRelationship']
})
```

### Yangilangan Student Schema
```typescript
export const studentSchema = z.object({
  // ... student fields
  
  // ❌ ESKI
  // parentFullName: z.string()
  // parentEmail: z.string().email()
  // parentPhone: z.string()
  // parentRelationship: z.enum(['father', 'mother', 'guardian'])
  
  // ✅ YANGI
  guardians: z.array(guardianSchema).min(1, 'Kamida 1 ta qarindosh'),
  
  // ... other fields
}).refine((data) => {
  // Faqat bitta qarindosh hasAccess = true
  const accessCount = data.guardians.filter(g => g.hasAccess).length
  return accessCount === 1
}, {
  message: 'Faqat bitta qarindoshga nazorat paneliga kirish ruxsat bering',
  path: ['guardians']
})
```

---

## 🎨 UI O'ZGARISHLARI

### Student Create Form

**Eski**:
```
[Ota-ona Ma'lumotlari]
- Ota-ona To'liq Ismi
- Email
- Telefon
- Qarindoshlik (dropdown: Ota/Ona/Vasiy)
```

**Yangi**:
```
[Qarindoshlari Ma'lumotlari] [+ Qarindosh qo'shish]

[Qarindosh #1] [X]
- To'liq Ism *
- Telefon Raqami *
- Qarindoshlik Turi: [Ota/Ona/Boshqa ▼]
- Qarindoshlik (qo'lda): [faqat agar "Boshqa"]
- Kasbi (optional)
- Ish joyi (optional)
[✓] Bu qarindoshga nazorat paneliga kirish huquqi

[Qarindosh #2] [X]
- ...
[ ] Bu qarindoshga nazorat paneliga kirish huquqi
```

**Features**:
- ✅ "+" tugma - yangi qarindosh qo'shish
- ✅ "X" tugma - qarindoshni o'chirish (kamida 1 ta qolishi kerak)
- ✅ Dynamic fields
- ✅ Faqat bitta hasAccess = true
- ✅ "Boshqa" tanlaganda customRelationship input ko'rinadi

---

## 🔐 AUTHENTICATION O'ZGARISHI

### Telefon orqali Kirish (Parent'lar uchun)

**lib/auth.ts**:
```typescript
async authorize(credentials) {
  // Input tekshirish - telefon yoki email?
  const isPhone = /^[\d\s\+\-\(\)]+$/.test(credentials.email.trim())
  
  if (isPhone) {
    // Telefon orqali qidiruv (faqat PARENT role)
    const cleanPhone = credentials.email.replace(/[\s\+\-\(\)]/g, '')
    
    user = await db.user.findFirst({
      where: {
        phone: { contains: cleanPhone },
        role: 'PARENT'
      }
    })
  } else {
    // Email orqali (boshqa rollar)
    user = await db.user.findUnique({
      where: { email: credentials.email.toLowerCase() }
    })
  }
  
  // Password check va boshqalar...
}
```

### Login Page

**Eski**:
```
Label: "Email"
Placeholder: "email@example.com"
Type: email
```

**Yangi**:
```
Label: "Telefon / Email"
Placeholder: "+998 90 123 45 67 yoki email@example.com"
Type: text
Hint: "Qarindoshlar: telefon raqam bilan kiradi"
```

---

## 🔧 SERVER ACTION O'ZGARISHI

### createStudent() Function

**Eski Logic**:
```typescript
1. Check parent email exists
2. Create parent if not exists
3. Create student
4. Link parent to student (isPrimary = true)
```

**Yangi Logic**:
```typescript
1. Loop through guardians array:
   a. Check guardian phone exists (tenant ichida)
   b. If not exists:
      - Generate unique email: parent_{phone}@temp.local
      - Create User (role=PARENT)
      - Create Parent (guardianType, customRelationship)
   c. Add to results array with hasAccess flag

2. Create student (if email provided)

3. Link all guardians to student:
   - Create StudentParent for each guardian
   - Set hasAccess based on guardian selection

4. Dormitory assignment (if needed)

5. Return:
   - success: true
   - guardianCredentials: {
       phone: "...",
       password: "Parent123!",
       fullName: "..."
     }
```

---

## 📊 DATABASE MIGRATION

### Migration Commands

```bash
# 1. Database schema push
npx prisma db push

# 2. Generate Prisma client
npx prisma generate

# 3. Restart dev server
npm run dev
```

### Data Loss Warning
⚠️ **Eslatma**: Migration paytida eski ma'lumotlar yo'qoladi:
- `Parent.relationship` ustuni o'chiriladi (6 ta qator)
- `StudentParent.isPrimary` ustuni o'chiriladi (3 ta qator)

**Yechim**: Test environment, seed data bilan qayta tiklanadi.

---

## ✅ YANGI FEATURES

### 1. Ko'p Qarindosh Qo'shish
```
✅ Bir o'quvchiga bir nechta qarindosh biriktirilishi mumkin
✅ Masalan: Ota, Ona, Amaki, Bobo, Xola
✅ Dynamic form bilan qo'shish
```

### 2. Qarindoshlik Turlari
```
✅ FATHER - Ota
✅ MOTHER - Ona
✅ OTHER - Boshqa (qo'lda yozish: Amaki, Xola, Bobo, Tog'a, etc.)
```

### 3. Nazoratchi Tanlash
```
✅ Faqat bitta qarindosh nazorat paneliga kirishi mumkin
✅ hasAccess = true bo'lgan qarindosh
✅ Bu qarindosh telefon va parol bilan parent panel'ga kiradi
```

### 4. Telefon Orqali Kirish
```
✅ Parent'lar telefon raqam bilan login qiladi
✅ Format: +998 90 123 45 67
✅ Auto-detect: telefon yoki email
✅ Default password: Parent123!
```

### 5. Email Optional
```
✅ Qarindoshlar uchun email kerak emas
✅ Auto-generated: parent_{phone}@temp.local
✅ Faqat authentication uchun ishlatiladi
```

---

## 🧪 TEST QILISH

### 1. Yangi O'quvchi Yaratish

```bash
1. Admin panel → O'quvchilar → Yangi O'quvchi
2. O'quvchi ma'lumotlarini to'ldirish
3. Qarindosh #1 qo'shish:
   - To'liq Ism: Aliyev Ahmed Valiovich
   - Telefon: +998901234567
   - Turi: Ota
   - [✓] Nazorat paneliga kirish huquqi
4. "+ Qarindosh qo'shish" bosish
5. Qarindosh #2 qo'shish:
   - To'liq Ism: Aliyeva Malika Karimovna
   - Telefon: +998909876543
   - Turi: Ona
   - [ ] Nazorat paneliga kirish huquqi
6. Saqlash
```

### 2. Telefon Orqali Login

```bash
1. Logout qilish
2. Login page
3. Telefon: +998901234567
4. Parol: Parent123!
5. Kirish
6. Parent dashboard ko'rinadi ✅
```

### 3. Faqat Bitta Nazoratchi

```bash
1. Ikkala qarindoshga hasAccess = true qilishga harakat
2. Validation error: "Faqat bitta qarindoshga..." ✅
```

### 4. "Boshqa" Qarindoshlik

```bash
1. Qarindoshlik turi: Boshqa
2. Qo'lda kiritish: "Amaki"
3. Saqlash ✅
4. Database: guardianType = OTHER, customRelationship = "Amaki"
```

---

## 📱 MOBILE UI

Form mobile'da ham responsive:
```
✅ Vertical layout
✅ Full-width inputs
✅ Touch-friendly buttons
✅ Collapsible sections
```

---

## 🔄 MIGRATION FLOW

### Eski Ma'lumotlardan Yangi Tizimga

Agar eski Parent'lar bo'lsa (migration'dan oldin):

```sql
-- Eski data (relationship = "father", "mother", "guardian")
-- Yangi data (guardianType = OTHER, customRelationship = "father")
-- Default: guardianType = OTHER
```

**Manual migration** kerak bo'lsa:
```sql
UPDATE "Parent" 
SET 
  "guardianType" = 'FATHER',
  "customRelationship" = NULL
WHERE "relationship" = 'father';

UPDATE "Parent" 
SET 
  "guardianType" = 'MOTHER',
  "customRelationship" = NULL
WHERE "relationship" = 'mother';

UPDATE "Parent" 
SET 
  "guardianType" = 'OTHER',
  "customRelationship" = "relationship"
WHERE "relationship" NOT IN ('father', 'mother');
```

---

## 🎯 ESLATMALAR

### Admin uchun:
```
✅ Kamida 1 ta qarindosh qo'shish majburiy
✅ Faqat 1 ta qarindoshga nazorat huquqi
✅ Telefon raqam to'g'ri formatda (+998...)
✅ "Boshqa" tanlaganda qo'lda yozish
```

### Qarindosh uchun:
```
✅ Login: Telefon raqam
✅ Default parol: Parent123!
✅ Parol o'zgartirish: Kabinet → Sozlamalar
✅ Faqat o'z bolalari ma'lumotlari ko'rinadi
```

---

## 📝 QOLGAN ISHLAR

### Phase 2:
```
🔄 Password change (parent kabinet)
🔄 Multiple students per guardian (if needed)
🔄 Guardian edit form
🔄 Guardian removal (with validation)
🔄 SMS notification (phone number bilan)
```

---

## ✅ COMPLETED TODOS

| # | Task | Status |
|---|------|--------|
| 1 | Database schema o'zgartirish | ✅ DONE |
| 2 | StudentParent hasAccess | ✅ DONE |
| 3 | Validation schema | ✅ DONE |
| 4 | Dynamic guardian form | ✅ DONE |
| 5 | Telefon orqali auth | ✅ DONE |
| 6 | Login page yangilash | ✅ DONE |
| 7 | Access control | ✅ DONE |
| 8 | Testing | 🔄 IN PROGRESS |

---

## 🐛 KNOWN ISSUES

### 1. Phone Uniqueness
**Issue**: Phone field unique emas database'da (tenant per)  
**Workaround**: Application-level validation  
**Fix**: Future migration'da unique constraint qo'shish

### 2. Email Generation
**Issue**: Generated email `parent_{phone}@temp.local` collision mumkin  
**Mitigation**: Database unique constraint check

### 3. Decimal Warning
**Issue**: Prisma Decimal type warning  
**Impact**: Minimal (functionality ishlaydi)  
**Fix**: Convert to Number in components

---

## 📞 SUPPORT

Muammolar bo'lsa:
1. Check terminal errors
2. Check browser console
3. Database connection
4. Prisma client generated

---

**Yozilgan sana**: 2024-yil Dekabr  
**Versiya**: 2.0  
**Holat**: ✅ TAYYOR (Test qilish kerak)

---

🎉 **QARINDOSHLAR TIZIMI YANGILANDI!**

**Keyingi qadam**: Server restart va test qilish

