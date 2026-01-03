# LMS Delete Operations Guide

Bu hujjatda barcha Delete/Deactivate operations, xavfsizlik choralari va best practices haqida to'liq ma'lumot.

## 📁 Yaratilgan Fayllar

### Server Actions (Delete functions)
```
app/actions/
  ├── tenant.ts    → deleteTenant()
  ├── student.ts   → deleteStudent(), deactivateStudent()
  ├── teacher.ts   → deleteTeacher(), deactivateTeacher()
  ├── class.ts     → deleteClass()
  └── payment.ts   → deletePayment()
```

### UI Components
```
components/
  ├── ui/alert-dialog.tsx       # Radix UI Alert Dialog
  ├── delete-button.tsx         # Reusable Delete Button
  └── deactivate-button.tsx     # Reusable Deactivate Button
```

---

## 🎯 Delete Strategy

### 1. **Hard Delete** (Actual database deletion)
Faqat ma'lumot yo'q yoki juda kam bog'lanishlar bo'lsa:

✅ **Class** - agar o'quvchilar yo'q bo'lsa  
✅ **Payment** - agar PENDING yoki FAILED bo'lsa  
✅ **Tenant** - agar ma'lumotlar bo'sh bo'lsa  

### 2. **Soft Delete** (Status o'zgartirish)
Ma'lumotlar saqlanadi, faqat status o'zgaradi:

🔶 **Student** → status: EXPELLED (sinfdan chiqarish)  
🔶 **Teacher** → user.isActive: false (login disable)

### 3. **Prevention** (O'chirishga ruxsat berilmaydi)
Bog'liq ma'lumotlar mavjud bo'lsa:

🚫 **Student** - baholar, davomat, to'lovlar bilan  
🚫 **Teacher** - sinflar, fanlar, baholar bilan  
🚫 **Class** - o'quvchilar bilan  
🚫 **Payment** - COMPLETED status bilan  
🚫 **Tenant** - users, students, teachers bilan  

---

## 1️⃣ Super Admin - Delete Tenant

### Server Action
```typescript
deleteTenant(tenantId: string)
```

### Logic
```typescript
// 1. Check if tenant has data
_count: {
  students, teachers, users
}

// 2. Prevent if has any data
if (students > 0 || teachers > 0 || users > 0) {
  return error: "Ma'lumotlar mavjud"
}

// 3. Safe to delete
await db.tenant.delete()
```

### Usage Example
```tsx
import { deleteTenant } from '@/app/actions/tenant'

<DeleteButton
  itemId={tenant.id}
  itemName={tenant.name}
  itemType="tenant"
  onDelete={deleteTenant}
/>
```

### Recommendations
- ❌ **Odatda o'chirilmaydi** - juda xavfli
- ✅ **Alternative**: Status'ni BLOCKED qiling
- ⚠️ Agar o'chirish kerak bo'lsa, avval barcha ma'lumotlarni export qiling

---

## 2️⃣ Admin - Student Delete/Deactivate

### Server Actions
```typescript
deleteStudent(studentId: string)      // Hard delete
deactivateStudent(studentId: string)  // Soft delete
```

### Deactivate Logic (Recommended)
```typescript
// Status o'zgartirish
status: 'EXPELLED'
classId: null  // Remove from class

// Baholar, davomat, to'lovlar saqlanadi
```

### Delete Logic (Restrictive)
```typescript
// 1. Check related data
_count: { grades, attendance, payments }

// 2. Prevent if has data
if (grades > 0 || attendance > 0 || payments > 0) {
  return error: "Use deactivate instead"
}

// 3. Delete relations
await db.studentParent.deleteMany()

// 4. Delete student
await db.student.delete()
```

### Usage Example
```tsx
import { deleteStudent, deactivateStudent } from '@/app/actions/student'

// Recommended: Deactivate
<DeactivateButton
  itemId={student.id}
  itemName={student.user?.fullName}
  itemType="student"
  onDeactivate={deactivateStudent}
/>

// Only if no data:
<DeleteButton
  itemId={student.id}
  itemName={student.user?.fullName}
  itemType="student"
  onDelete={deleteStudent}
/>
```

### Recommendations
- ✅ **Use Deactivate** - ma'lumotlarni saqlash uchun
- ❌ **Delete faqat** - yangi qo'shilgan, ma'lumoti yo'q o'quvchilar uchun
- 📊 **Deactivated students** - statistikada ko'rsatish mumkin

---

## 3️⃣ Admin - Teacher Delete/Deactivate

### Server Actions
```typescript
deleteTeacher(teacherId: string)      // Hard delete
deactivateTeacher(teacherId: string)  // Soft delete
```

### Deactivate Logic (Recommended)
```typescript
// User account disable
user.isActive: false

// O'qituvchi login qila olmaydi
// Barcha ma'lumotlar saqlanadi (grades, classes, etc)
```

### Delete Logic (Restrictive)
```typescript
// 1. Check related data
_count: { classSubjects, classesAsClassTeacher, grades }

// 2. Prevent if has data
if (classSubjects > 0 || classesAsClassTeacher > 0 || grades > 0) {
  return error: "Has assignments, use deactivate"
}

// 3. Delete teacher & user
await db.teacher.delete()
await db.user.delete()
```

### Usage Example
```tsx
import { deleteTeacher, deactivateTeacher } from '@/app/actions/teacher'

// Recommended: Deactivate
<DeactivateButton
  itemId={teacher.id}
  itemName={teacher.user.fullName}
  itemType="teacher"
  onDeactivate={deactivateTeacher}
/>

// Only if no assignments:
<DeleteButton
  itemId={teacher.id}
  itemName={teacher.user.fullName}
  itemType="teacher"
  onDelete={deleteTeacher}
/>
```

### Recommendations
- ✅ **Use Deactivate** - o'qituvchi ishdan ketganda
- ❌ **Delete faqat** - xato qo'shilgan o'qituvchilar uchun
- 🔄 **Reactivate** - keyinchalik qo'shish mumkin (isActive: true)

---

## 4️⃣ Admin - Delete Class

### Server Action
```typescript
deleteClass(classId: string)
```

### Logic
```typescript
// 1. Check if has students
_count: { students, classSubjects }

// 2. Prevent if has students
if (students > 0) {
  return error: "Has students, reassign first"
}

// 3. Delete related data
await db.classSubject.deleteMany()
await db.schedule.deleteMany()

// 4. Delete class
await db.class.delete()
```

### Usage Example
```tsx
import { deleteClass } from '@/app/actions/class'

<DeleteButton
  itemId={classItem.id}
  itemName={classItem.name}
  itemType="class"
  onDelete={deleteClass}
/>
```

### Recommendations
- ⚠️ **O'chirish oldin**: O'quvchilarni boshqa sinfga o'tkazing
- 📅 **Academic year** - o'tgan yillar sinflarini arxivlash (keyinroq)
- ✅ **Safe to delete** - bo'sh sinflarni

---

## 5️⃣ Admin - Delete Payment

### Server Action
```typescript
deletePayment(paymentId: string)
```

### Logic
```typescript
// 1. Check payment status
if (status === 'COMPLETED') {
  return error: "Cannot delete completed payment"
}

// 2. Safe to delete PENDING/FAILED
await db.payment.delete()
```

### Usage Example
```tsx
import { deletePayment } from '@/app/actions/payment'

<DeleteButton
  itemId={payment.id}
  itemName={payment.invoiceNumber}
  itemType="payment"
  onDelete={deletePayment}
/>
```

### Recommendations
- ✅ **Delete PENDING/FAILED** - xato kiritilgan to'lovlar
- ❌ **COMPLETED payments** - o'chirib bo'lmaydi
- 🔄 **Alternative**: REFUNDED statusga o'zgartirish (keyinroq)
- 📊 **Audit trail** - o'chirilgan to'lovlar log'lanishi kerak (keyinroq)

---

## 🛡️ Security & Validation

### 1. Permission Checks
```typescript
const session = await getServerSession(authOptions)

// Role check
if (!session || session.user.role !== 'EXPECTED_ROLE') {
  return { success: false, error: 'Ruxsat berilmagan' }
}
```

### 2. Tenant Isolation
```typescript
const tenantId = session.user.tenantId!

// Always filter by tenantId
const item = await db.entity.findFirst({
  where: { id, tenantId }
})
```

### 3. Relationship Checks
```typescript
// Check before delete
include: {
  _count: {
    select: { relatedEntities: true }
  }
}

if (_count.relatedEntities > 0) {
  return { success: false, error: 'Has related data' }
}
```

### 4. Cascade Deletes
```typescript
// Delete relations first
await db.childEntity.deleteMany({ where: { parentId } })

// Then delete parent
await db.parent.delete({ where: { id } })
```

---

## 🎨 UI Components

### DeleteButton Component
```tsx
<DeleteButton
  itemId="entity-id"
  itemName="Entity Name"
  itemType="student" | "teacher" | "class" | "payment" | "tenant"
  onDelete={deleteFunction}
  variant="destructive"  // default | ghost | outline | destructive
  size="sm"              // default | sm | lg | icon
  showIcon={true}
  confirmText="Custom confirmation message"
/>
```

#### Features:
- ✅ Confirmation dialog (AlertDialog)
- ✅ Loading state
- ✅ Success/Error toast notifications
- ✅ Auto refresh after delete
- ✅ Customizable appearance

### DeactivateButton Component
```tsx
<DeactivateButton
  itemId="entity-id"
  itemName="Entity Name"
  itemType="student" | "teacher"
  onDeactivate={deactivateFunction}
  variant="outline"
  size="sm"
/>
```

#### Features:
- ✅ Orange warning color
- ✅ Clear explanation of deactivation
- ✅ Confirmation dialog
- ✅ Loading state

---

## 🎯 Confirmation Dialog

### AlertDialog Structure
```tsx
<AlertDialog>
  <AlertDialogTrigger>
    <Button>O'chirish</Button>
  </AlertDialogTrigger>
  
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertTriangle /> Ishonchingiz komilmi?
      <AlertDialogDescription>
        {itemName} ni o'chirmoqdasiz.
        Bu amalni qaytarib bo'lmaydi!
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <AlertDialogFooter>
      <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Ha, O'chirish
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 📋 Implementation Checklist

### For Each Entity Delete:
- [ ] Server action created
- [ ] Permission check (role + tenantId)
- [ ] Relationship checks implemented
- [ ] Cascade deletes handled
- [ ] Error messages in Uzbek
- [ ] revalidatePath called
- [ ] UI button added to list page
- [ ] UI button added to detail page (optional)
- [ ] Confirmation dialog works
- [ ] Toast notifications work
- [ ] Loading states work
- [ ] Tested with related data
- [ ] Tested with no data

### Additional:
- [ ] Deactivate option (for Student/Teacher)
- [ ] Alternative suggested in error
- [ ] Audit logging (keyinroq)
- [ ] Soft delete option (keyinroq)

---

## 🚨 Error Messages & Handling

### Common Error Messages
```typescript
// Has related data
"O'quvchida baholar, davomat yoki to'lovlar mavjud. 
 Avval statusni o'zgartiring (Deactivate)."

// Has students in class
"Sinfda o'quvchilar mavjud. 
 Avval o'quvchilarni boshqa sinfga o'tkazing."

// Completed payment
"To'langan to'lovni o'chirib bo'lmaydi. 
 Agar xato bo'lsa, REFUNDED statusga o'zgartiring."

// Tenant has data
"Maktabda ma'lumotlar mavjud. 
 Avval barcha ma'lumotlarni o'chiring yoki statusni BLOCKED qiling."

// Teacher assigned
"O'qituvchi sinf yoki fanlarga biriktirilgan. 
 Avval barcha bog'lanishlarni olib tashlang yoki deactivate qiling."
```

### Error Handling Pattern
```typescript
try {
  const result = await deleteEntity(id)
  
  if (result.success) {
    toast({ title: 'Muvaffaqiyatli!' })
    router.refresh()
  } else {
    toast({ 
      title: 'Xato!',
      description: result.error,
      variant: 'destructive' 
    })
  }
} catch (error) {
  toast({ 
    title: 'Xato!',
    description: 'Kutilmagan xatolik',
    variant: 'destructive' 
  })
}
```

---

## 🔄 Alternative Actions

### Instead of Delete:
1. **Student**: Deactivate (EXPELLED status)
2. **Teacher**: Deactivate (isActive: false)
3. **Tenant**: Block (status: BLOCKED)
4. **Payment**: Mark as REFUNDED
5. **Class**: Archive (future feature)

### Reactivation (Future):
- Reactivate student → status: ACTIVE
- Reactivate teacher → isActive: true
- Restore payment → Change status back

---

## 🧪 Testing Scenarios

### Test Cases:

#### 1. Delete Empty Entity
```
- Create new entity
- Don't add any related data
- Try to delete
- Should: Success
```

#### 2. Delete with Related Data
```
- Create entity with related data
- Try to delete
- Should: Error with clear message
```

#### 3. Deactivate Instead
```
- Try deactivate
- Check status changed
- Check data preserved
- Should: Success
```

#### 4. Permission Denied
```
- Login as wrong role
- Try to delete
- Should: "Ruxsat berilmagan"
```

#### 5. Tenant Isolation
```
- Login to tenant A
- Try to delete tenant B's data
- Should: "Not found" or "Ruxsat berilmagan"
```

---

## 🚀 Future Enhancements

### Phase 2
- [ ] Soft delete for all entities (deletedAt field)
- [ ] Restore functionality (undelete)
- [ ] Bulk delete operations
- [ ] Delete confirmation with typed input
- [ ] Audit trail (who deleted what when)

### Phase 3
- [ ] Archive functionality (move to archive table)
- [ ] Scheduled deletion (mark for deletion, delete later)
- [ ] Recycle bin (30 days retention)
- [ ] Export before delete
- [ ] Delete impact preview

### Phase 4
- [ ] Advanced dependency graph
- [ ] Cascade options UI
- [ ] Delete simulation (dry run)
- [ ] Undo delete (within time window)
- [ ] Delete analytics

---

## ✅ Summary

### Created:
- ✅ 5 Delete server actions
- ✅ 2 Deactivate server actions
- ✅ Alert Dialog component
- ✅ DeleteButton component
- ✅ DeactivateButton component
- ✅ Confirmation dialogs
- ✅ Error handling
- ✅ Security checks

### Key Features:
- **Hard Delete** - When safe (no related data)
- **Soft Delete** - Preserve data (status change)
- **Prevention** - Block dangerous deletes
- **Confirmation** - Always ask user
- **Alternatives** - Suggest better options
- **Security** - Role + Tenant isolation
- **UX** - Clear messages, loading states

### Safety Measures:
- 🔒 Permission checks
- 🔗 Relationship validation
- 💬 Clear error messages
- ⚠️ Warning dialogs
- 🔄 Alternative actions suggested
- 📝 Audit ready (future)

---

**Yozilgan sana**: 2024-11-26  
**Versiya**: 1.0  
**Holat**: ✅ Delete Operations Complete

