# 🛡️ SUPER ADMIN - BLOKLASH VA O'CHIRISH TIZIMI

## ✅ YARATILGAN YANGI FUNKSIYALAR

### 1. **Maktabni Bloklash** 🚫

**Funksiya:** `blockTenant(tenantId)`

**Nima qiladi:**
- ✅ Tenant statusini `BLOCKED` ga o'zgartiradi
- ✅ **BARCHA xodimlarni deaktiv qiladi** (isActive = false)
- ✅ Hech kim login qila olmaydi
- ✅ Ma'lumotlar saqlanadi

**Qachon ishlatiladi:**
- Maktab to'lovni to'lamagan
- Qoidalarni buzgan
- Vaqtincha bloklash kerak

**Qaytarish mumkin:** ✅ Ha, unblockTenant() bilan

---

### 2. **Maktabni Blokdan Chiqarish** ✅

**Funksiya:** `unblockTenant(tenantId)`

**Nima qiladi:**
- ✅ Tenant statusini `ACTIVE` ga o'zgartiradi
- ✅ **BARCHA xodimlarni faollashtiradi** (isActive = true)
- ✅ Login qilish imkoniyati qaytadi
- ✅ Barcha ma'lumotlar saqlanadi

**Qachon ishlatiladi:**
- To'lov qilingan
- Muammo hal qilingan
- Bloklashni bekor qilish kerak

---

### 3. **Maktabni Butunlay O'chirish** ⚠️

**Funksiya:** `deleteTenantWithData(tenantId)`

**Nima qiladi:**
- ❌ Tenant va **BARCHA** ma'lumotlarni o'chiradi
- ❌ Qaytarish MUMKIN EMAS!

**O'chiriladigan ma'lumotlar:**
```
1. Activity Logs
2. Notifications
3. Messages
4. Announcements
5. Materials
6. Assignment Submissions
7. Assignments
8. Grades
9. Attendances
10. Schedules
11. Payments
12. Payment Plans
13. Subscription Payments
14. Student-Parent relationships
15. Parents
16. Students
17. Teachers
18. Subjects
19. Classes
20. Users
21. Tenant
```

**JAMI: 21ta table'dan ma'lumotlar o'chiriladi!**

**Qachon ishlatiladi:**
- Maktab to'liq yopilgan
- Test ma'lumotlarni tozalash
- **DIQQAT:** Bu amal qaytarilmaydi!

---

## 🎨 UI COMPONENTS

### 1. **TenantActionsDropdown Component**

**Fayl:** `components/tenant-actions-dropdown.tsx`

**Imkoniyatlar:**
- ⋮ Dropdown menu (3 nuqta)
- 🚫 Bloklash (agar active)
- ✅ Blokdan chiqarish (agar blocked)
- 🗑️ Butunlay o'chirish

**Confirmation Dialogs:**

#### Bloklash Dialog
```
⚠️ Bu amal quyidagilarni amalga oshiradi:
  - Maktab statusini BLOCKED ga o'zgartiradi
  - Barcha xodimlar (X ta) deaktiv qilinadi
  - Hech kim login qila olmaydi
  - Ma'lumotlar saqlanadi

Keyinchalik blokdan chiqarish mumkin.
```

#### Blokdan Chiqarish Dialog
```
✅ Bu amal quyidagilarni amalga oshiradi:
  - Maktab statusini ACTIVE ga o'zgartiradi
  - Barcha xodimlar (X ta) faollashtiriladi
  - Login qilish imkoniyati qaytadi
```

#### O'chirish Dialog
```
⚠️ DIQQAT! Bu amal qaytarib bo'lmaydi:
  - Maktab va BARCHA ma'lumotlar o'chiriladi
  - X ta o'quvchi
  - X ta o'qituvchi
  - X ta xodim
  - To'lovlar, baholar, davomat - HAMMASI!

Bu amalni qaytarish MUMKIN EMAS!
```

---

## 💻 QANDAY ISHLAYDI

### 1. Maktablar Ro'yxati

```
/super-admin/tenants

╔════════════════════════════════╗
║ [Maktab Nomi]                  ║
║ Status: ACTIVE                 ║
║ O'quvchilar: 100               ║
║ ┌─────────┬──────────┬───┐    ║
║ │Ko'rish  │Tahrirlash│ ⋮ │    ║
║ └─────────┴──────────┴───┘    ║
╚════════════════════════════════╝
                           ↑
                     Actions Menu
```

### 2. Actions Dropdown

```
Click on ⋮
↓
╔═══════════════════════╗
║ Harakatlar            ║
║ ─────────────────────║
║ 🚫 Bloklash          ║  (agar active)
║   yoki               ║
║ ✅ Blokdan chiqarish ║  (agar blocked)
║ ─────────────────────║
║ 🗑️ Butunlay o'chirish║
╚═══════════════════════╝
```

### 3. Transaction Flow

**Bloklash:**
```typescript
db.$transaction([
  // 1. Update tenant status
  db.tenant.update({
    where: { id },
    data: { status: 'BLOCKED' }
  }),
  
  // 2. Deactivate all users
  db.user.updateMany({
    where: { tenantId: id },
    data: { isActive: false }
  })
])
```

**O'chirish:**
```typescript
db.$transaction(async (tx) => {
  // Delete in correct order (respecting foreign keys)
  await tx.activityLog.deleteMany({ where: { tenantId } })
  await tx.notification.deleteMany({ where: { tenantId } })
  // ... 19 more delete operations
  await tx.tenant.delete({ where: { id: tenantId } })
})
```

---

## 🔒 XAVFSIZLIK

### 1. Authorization
```typescript
// Faqat SUPER_ADMIN
if (session.user.role !== 'SUPER_ADMIN') {
  return { error: 'Ruxsat berilmagan' }
}
```

### 2. Confirmation Required
```typescript
// User confirmation dialog
// 2-step process:
// 1. Click action
// 2. Confirm in dialog
```

### 3. Transaction Safety
```typescript
// All operations in transaction
await db.$transaction([...])

// If one fails, all rollback
```

### 4. Logging
```typescript
// All actions logged
console.error('Delete tenant error:', error)

// Activity log in database
await tx.activityLog.create({...})
```

---

## 📊 USE CASES

### 1. Bloklash Scenariosi

**Holat:** Maktab to'lovni to'lamagan

```bash
1. Super Admin login
2. Tenants sahifasiga o'tish
3. Maktabni topish
4. ⋮ → "Bloklash" click
5. Confirmation dialog:
   - Xodimlar soni ko'rsatiladi
   - Ogohlantirish
6. "Ha, bloklash" confirm
7. ✅ Blocked!

Natija:
- Maktab: status = BLOCKED
- Barcha users: isActive = false
- Login qila olmaydilar
```

### 2. Blokdan Chiqarish

**Holat:** To'lov qilingan

```bash
1. Super Admin login
2. Blocked maktabni topish
3. ⋮ → "Blokdan chiqarish"
4. Confirm
5. ✅ Aktivlashdi!

Natija:
- Maktab: status = ACTIVE
- Barcha users: isActive = true
- Login qila oladilar
```

### 3. Butunlay O'chirish

**Holat:** Test maktabni tozalash

```bash
1. Super Admin login
2. Test maktabni topish
3. ⋮ → "Butunlay o'chirish"
4. XAVFLI dialog ko'rsatiladi
5. Ma'lumotlar statistikasi
6. "Ha, BUTUNLAY o'chirish" confirm
7. ❌ O'chirildi!

Natija:
- Maktab va barcha ma'lumotlar yo'q
- Qaytarib bo'lmaydi
```

---

## 🧪 TEST QILISH

### 1. Bloklash Testi

```bash
1. Test maktab yarating
2. Admin bilan login qiling - ishlaydi ✅
3. Super Admin → Bloklash
4. Admin bilan login qilishga harakat - ERROR ✅
5. Super Admin → Blokdan chiqarish
6. Admin bilan login qiling - ishlaydi ✅
```

### 2. O'chirish Testi

```bash
1. Test maktab yarating
2. Ma'lumotlar qo'shing (o'quvchi, teacher, etc)
3. Super Admin → Butunlay o'chirish
4. Confirm
5. Database'da tekshiring - yo'q ✅
6. Tenants list'da yo'q ✅
```

---

## 📝 XULOSA

**Yaratilgan:**
- ✅ `blockTenant()` - Bloklash + users deactivate
- ✅ `unblockTenant()` - Faollashtirish + users activate
- ✅ `deleteTenantWithData()` - Butunlay o'chirish (21 table)
- ✅ `TenantActionsDropdown` - UI component
- ✅ Confirmation dialogs
- ✅ Error handling
- ✅ Toast notifications

**Xususiyatlar:**
- ✅ Bloklash → Barcha xodimlar deaktiv
- ✅ Blokdan chiqarish → Barcha xodimlar aktiv
- ✅ O'chirish → Barcha ma'lumotlar o'chadi
- ✅ Transaction safety
- ✅ Authorization (SUPER_ADMIN only)

**Qo'llanish:**
- ✅ To'lov muammolari
- ✅ Qoidalar buzilishi
- ✅ Test ma'lumotlar tozalash
- ✅ Maktab yopilganda

**HOZIR TEST QILING!** 🚀

