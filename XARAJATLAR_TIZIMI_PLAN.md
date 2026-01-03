# 💰 XARAJATLAR BOSHQARUVI TIZIMI

## 🎯 MAQSAD

Maktab xarajatlarini nazorat qilish va limitlar bilan boshqarish tizimi.

---

## 📋 TALABLAR

### 1. Xarajat Turlari (Expense Categories)

Admin yaratadi:
- ✅ Xarajat nomi (masalan: Soliq, Maosh, Kommunal, Remont)
- ✅ Limit miqdori (masalan: 5,000,000 so'm)
- ✅ Muddat (kun, hafta, oy, yil)
- ✅ Ranglar (UI uchun)
- ✅ Status (active/inactive)

**Misol:**
```
Nomi: Soliq xarajati
Limit: 5,000,000 so'm
Muddat: Oylik
```

---

### 2. Xarajatlar Kiritish (Expenses)

Admin xarajat kiritadi:
- ✅ Xarajat turi (dropdown - yuqoridagi ro'yxatdan)
- ✅ Miqdor (masalan: 500,000 so'm)
- ✅ Sana
- ✅ To'lov usuli (CASH, BANK, CARD)
- ✅ Izoh (nima uchun)
- ✅ Chek/Hujjat raqami
- ✅ Kim to'ladi (receivedBy)

---

### 3. Warning System 🚨

Avtomatik nazorat:

#### Progress Bar:
```
Limit: 5,000,000 so'm
Sarflangan: 4,200,000 so'm
Qoldi: 800,000 so'm
Progress: 84% ⚠️
```

#### Warning Levels:
- **0-70%** - ✅ Yashil (Normal)
- **71-85%** - ⚠️ Sariq (Diqqat)
- **86-100%** - 🚨 Qizil (Xavfli)
- **100%+** - ⛔ Limit oshdi!

#### Alert Messages:
- "Etiborli! Soliq xarajati limiti 84% ishlatilgan"
- "Xavfli! Maosh xarajati limiti oshib ketmoqda"
- "⛔ Kommunal xarajati limiti oshdi! Qo'shimcha mablag' kerak"

---

## 🗄️ DATABASE SCHEMA

### ExpenseCategory Model:
```prisma
model ExpenseCategory {
  id          String    @id @default(cuid())
  tenant      Tenant    @relation(fields: [tenantId], references: [id])
  tenantId    String
  
  name        String    // Soliq, Maosh, Kommunal
  description String?
  limitAmount Decimal   @db.Decimal(12, 2)
  period      ExpensePeriod  // DAILY, WEEKLY, MONTHLY, YEARLY
  color       String?   // #FF5733
  isActive    Boolean   @default(true)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  expenses    Expense[]
  
  @@index([tenantId])
  @@index([isActive])
}

enum ExpensePeriod {
  DAILY    // Kunlik
  WEEKLY   // Haftalik
  MONTHLY  // Oylik
  YEARLY   // Yillik
}
```

### Expense Model:
```prisma
model Expense {
  id              String           @id @default(cuid())
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  tenantId        String
  
  category        ExpenseCategory  @relation(fields: [categoryId], references: [id])
  categoryId      String
  
  amount          Decimal          @db.Decimal(12, 2)
  date            DateTime         @db.Date
  paymentMethod   PaymentMethod    // CASH, BANK, CARD
  receiptNumber   String?
  description     String?          @db.Text
  
  receivedBy      User?            @relation(fields: [receivedById], references: [id])
  receivedById    String?
  
  attachments     Json?            // Chek rasmlari
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@index([tenantId])
  @@index([categoryId])
  @@index([date])
  @@index([tenantId, date])
}
```

---

## 📄 SAHIFALAR (Pages)

### 1. Admin - Xarajat Turlari
**Path:** `/admin/expenses/categories`

**Features:**
- ✅ Xarajat turlarini ro'yxati
- ✅ Yangi tur qo'shish
- ✅ Tahrirlash
- ✅ O'chirish
- ✅ Limit va muddat sozlash

---

### 2. Admin - Xarajatlar Ro'yxati
**Path:** `/admin/expenses`

**Features:**
- ✅ Barcha xarajatlar ro'yxati
- ✅ Filter (tur, sana, miqdor)
- ✅ Search
- ✅ Yangi xarajat qo'shish
- ✅ Tahrirlash
- ✅ O'chirish
- ✅ PDF export
- ✅ Excel export

---

### 3. Dashboard Widget
**Location:** Admin dashboard

**Features:**
- ✅ Oylik xarajatlar jami
- ✅ Eng ko'p xarajat turlari
- ✅ Limit warning'lar
- ✅ Progress bar'lar
- ✅ Chart (pie/bar)

---

## 🎨 UI COMPONENTS

### 1. ExpenseLimitCard
```tsx
<Card>
  <CardHeader>
    <div className="flex justify-between">
      <h3>Soliq xarajati</h3>
      <Badge variant={getWarningLevel()}>84%</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <Progress value={84} className="mb-2" />
    <div className="flex justify-between text-sm">
      <span>Sarflangan: 4,200,000 so'm</span>
      <span>Limit: 5,000,000 so'm</span>
    </div>
    {warning && (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Diqqat! Limit 84% ishlatilgan
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
</Card>
```

---

## 📊 STATISTICS & REPORTS

### Dashboard'da ko'rsatiladigan:
1. **Jami xarajatlar** (bugun, shu hafta, shu oy)
2. **Eng ko'p xarajat turlari** (top 5)
3. **Limit warnings** (kritik holatlar)
4. **Xarajatlar trendi** (chart)

### Reports:
1. **Oylik hisobot** (PDF)
2. **Yillik hisobot** (PDF)
3. **Xarajat turi bo'yicha** (Excel)
4. **Limit oshgan xarajatlar** (PDF)

---

## 🔔 NOTIFICATIONS

### Admin uchun:
- ✅ Limit 80% ga yetsa - warning notification
- ✅ Limit 95% ga yetsa - danger notification
- ✅ Limit oshsa - critical alert

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Database (1-2 soat)
1. ✅ Prisma schema yaratish
2. ✅ Migration run qilish
3. ✅ Seed data

### Phase 2: Backend (2-3 soat)
1. ✅ Server actions (CRUD)
2. ✅ Validations
3. ✅ Limit calculation logic
4. ✅ Warning logic

### Phase 3: Frontend (3-4 soat)
1. ✅ Categories page
2. ✅ Expenses page
3. ✅ Forms
4. ✅ Dashboard widgets
5. ✅ Charts

### Phase 4: Testing (1 soat)
1. ✅ CRUD operations
2. ✅ Limit warnings
3. ✅ Calculations
4. ✅ UI/UX

---

## 💡 EXAMPLE SCENARIOS

### Scenario 1: Normal Holat
```
Soliq xarajati:
- Limit: 5,000,000 so'm (oylik)
- Sarflangan: 2,500,000 so'm
- Qoldi: 2,500,000 so'm
- Progress: 50% ✅ (Yashil)
```

### Scenario 2: Warning
```
Maosh xarajati:
- Limit: 10,000,000 so'm (oylik)
- Sarflangan: 8,500,000 so'm
- Qoldi: 1,500,000 so'm
- Progress: 85% ⚠️ (Sariq)
- Alert: "Diqqat! Limit 85% ishlatilgan"
```

### Scenario 3: Danger
```
Kommunal xarajati:
- Limit: 3,000,000 so'm (oylik)
- Sarflangan: 3,200,000 so'm
- Qoldi: -200,000 so'm
- Progress: 107% 🚨 (Qizil)
- Alert: "XAVFLI! Limit 200,000 so'm oshdi!"
```

---

## ✅ TODO LIST

Quyidagilar yaratiladi:

### Database:
- [ ] ExpenseCategory model
- [ ] Expense model
- [ ] ExpensePeriod enum
- [ ] Migration
- [ ] Seed data

### Backend:
- [ ] Expense category actions (CRUD)
- [ ] Expense actions (CRUD)
- [ ] Limit calculation helper
- [ ] Warning level helper
- [ ] Validations

### Frontend:
- [ ] `/admin/expenses/categories` page
- [ ] `/admin/expenses/categories/create` form
- [ ] `/admin/expenses` page
- [ ] `/admin/expenses/create` form
- [ ] Dashboard expense widget
- [ ] ExpenseLimitCard component
- [ ] ExpenseChart component

### Reports:
- [ ] PDF export
- [ ] Excel export

---

**Tayyor bo'lishingiz bilan boshlaymiz!** 🚀

Davom etaylikmi?

