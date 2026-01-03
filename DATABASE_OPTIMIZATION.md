# Database Optimization Guide

## 🚀 Eng Muhim Indexlar (ALBATTA qo'shish kerak!)

### Muammo
Hozir database indexlari yo'q. 1000+ yozuv bo'lganda sahifalar **juda sekin** yuklanadi (5-10 soniya).

### Yechim
Quyidagi indexlarni qo'shing:

---

## 📝 Prisma Schema ga Qo'shish Kerak

`prisma/schema.prisma` fayliga quyidagilarni qo'shing:

### 1. User Model
```prisma
model User {
  // ... mavjud maydonlar ...
  
  @@index([email])
  @@index([tenantId])
  @@index([role])
  @@index([isActive])
  @@index([createdAt])
  @@index([tenantId, role])
  @@index([tenantId, isActive])
}
```

### 2. Tenant Model
```prisma
model Tenant {
  // ... mavjud maydonlar ...
  
  @@index([slug])
  @@index([status])
  @@index([subscriptionPlan])
  @@index([createdAt])
  @@index([status, subscriptionPlan])
}
```

### 3. Student Model
```prisma
model Student {
  // ... mavjud maydonlar ...
  
  @@index([tenantId])
  @@index([userId])
  @@index([classId])
  @@index([studentCode])
  @@index([status])
  @@index([enrollmentDate])
  @@index([tenantId, status])
  @@index([tenantId, classId])
  @@index([tenantId, createdAt])
}
```

### 4. Teacher Model
```prisma
model Teacher {
  // ... mavjud maydonlar ...
  
  @@index([tenantId])
  @@index([userId])
  @@index([teacherCode])
  @@index([tenantId, createdAt])
}
```

### 5. Parent Model
```prisma
model Parent {
  // ... mavjud maydonlar ...
  
  @@index([tenantId])
  @@index([userId])
  @@index([tenantId, createdAt])
}
```

### 6. Class Model
```prisma
model Class {
  // ... mavjud maydonlar ...
  
  @@index([tenantId])
  @@index([classTeacherId])
  @@index([gradeLevel])
  @@index([academicYear])
  @@index([tenantId, academicYear])
  @@index([tenantId, gradeLevel])
}
```

### 7. Payment Model
```prisma
model Payment {
  // ... mavjud maydonlar ...
  
  @@index([tenantId])
  @@index([studentId])
  @@index([parentId])
  @@index([status])
  @@index([dueDate])
  @@index([paidDate])
  @@index([invoiceNumber])
  @@index([paymentType])
  @@index([tenantId, status])
  @@index([tenantId, dueDate])
  @@index([tenantId, paymentType])
  @@index([studentId, status])
}
```

### 8. Attendance Model
```prisma
model Attendance {
  // ... mavjud maydonlar ...
  
  @@index([studentId])
  @@index([classId])
  @@index([date])
  @@index([status])
  @@index([classId, date])
  @@index([studentId, date])
  @@index([classId, date, status])
}
```

### 9. Grade Model
```prisma
model Grade {
  // ... mavjud maydonlar ...
  
  @@index([studentId])
  @@index([classSubjectId])
  @@index([semester])
  @@index([academicYear])
  @@index([studentId, semester])
  @@index([studentId, academicYear])
  @@index([classSubjectId, semester])
}
```

### 10. Message Model
```prisma
model Message {
  // ... mavjud maydonlar ...
  
  @@index([senderId])
  @@index([receiverId])
  @@index([isRead])
  @@index([createdAt])
  @@index([receiverId, isRead])
  @@index([senderId, createdAt])
  @@index([receiverId, createdAt])
}
```

### 11. Announcement Model
```prisma
model Announcement {
  // ... mavjud maydonlar ...
  
  @@index([tenantId])
  @@index([authorId])
  @@index([targetRole])
  @@index([publishDate])
  @@index([tenantId, publishDate])
  @@index([tenantId, targetRole])
}
```

---

## 🔧 Qo'llash

### 1. Indexlarni qo'shing
`prisma/schema.prisma` fayliga yuqoridagi indexlarni qo'shing.

### 2. Database ga push qiling
```bash
npm run db:push
```

yoki

```bash
npx prisma db push
```

### 3. Natijani tekshiring
```bash
npx prisma studio
```

---

## 📊 Kutilayotgan Natijalar

### Indexlarsiz:
- 1000 o'quvchi: 5-10 soniya
- 10,000 o'quvchi: 30-60 soniya ⛔
- Search: Har safar juda sekin

### Indexlar bilan:
- 1000 o'quvchi: 0.5-1 soniya ✅
- 10,000 o'quvchi: 1-2 soniya ✅
- Search: Tez ⚡

---

## 🎯 Connection Pooling

### Database URL sozlash
`.env` fayliga qo'shing:

```env
# Connection pooling
DATABASE_URL="postgresql://user:password@host:5432/dbname?connection_limit=20&pool_timeout=10"

# Serverless uchun (Vercel, Lambda)
DIRECT_URL="postgresql://user:password@host:5432/dbname"
```

### Prisma Schema
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## 💾 Database Backup

### Supabase da
1. Project Settings > Database > Backups
2. Avtomatik 7 kunlik backup (bepul)
3. Manual backup: SQL dump download

### Manual Backup
```bash
# Backup yaratish
pg_dump -h hostname -U username -d dbname > backup.sql

# Restore qilish
psql -h hostname -U username -d dbname < backup.sql
```

---

## 🔍 Query Optimization

### N+1 Problem oldini olish

#### ❌ Yomon (N+1 Problem):
```typescript
// Har bir student uchun alohida query!
const students = await db.student.findMany()
for (const student of students) {
  const user = await db.user.findUnique({ where: { id: student.userId }})
}
```

#### ✅ Yaxshi:
```typescript
// Bitta query!
const students = await db.student.findMany({
  include: {
    user: true,
    class: true,
  }
})
```

### Select faqat kerakli maydonlar

#### ❌ Yomon:
```typescript
// Barcha maydonlarni oladi (sekin)
const users = await db.user.findMany()
```

#### ✅ Yaxshi:
```typescript
// Faqat kerakli maydonlar
const users = await db.user.findMany({
  select: {
    id: true,
    fullName: true,
    email: true,
  }
})
```

---

## 📈 Monitoring

### Query Performance ko'rish
```bash
# Prisma query log
DATABASE_URL="...?log=query"
```

### Slow Query Log (PostgreSQL)
```sql
-- 1 soniyadan sekin querylarni ko'rsatish
SET log_min_duration_statement = 1000;
```

---

## 🚨 Muhim Ogohlantirish

1. **Indexlar ko'p joy egallaydi**: Har bir index ~10-20% qo'shimcha joy
2. **Write operations sekinlashadi**: Insert/Update biroz sekinroq bo'ladi
3. **Faqat kerakli indexlar**: Har bir maydon uchun emas!

---

## ✅ Checklist

- [ ] User model indexlari qo'shildi
- [ ] Tenant model indexlari qo'shildi  
- [ ] Student model indexlari qo'shildi
- [ ] Teacher model indexlari qo'shildi
- [ ] Payment model indexlari qo'shildi
- [ ] Attendance model indexlari qo'shildi
- [ ] Grade model indexlari qo'shildi
- [ ] Message model indexlari qo'shildi
- [ ] `npm run db:push` bajarildi
- [ ] Test qilindi (tezlik oshdi)
- [ ] Connection pooling sozlandi
- [ ] Backup strategiya tayyor

---

Bu optimizatsiyalar **ALBATTA** kerak ertaga production ga chiqish uchun!

