# 💰 Xarajatlar Boshqaruvi Tizimi (Expense Management)

## 📋 Umumiy Ma'lumot

Bu tizim Admin profiliga xarajatlarni boshqarish va moliyaviy balansni kuzatish imkoniyatini beradi. Kirim va xarajatlarni hisoblab, real vaqtda balansni ko'rsatadi.

---

## 🎯 Asosiy Xususiyatlar

### 1. **Xarajat Turlari (Expense Categories)**
Admin avval xarajat turlarini yaratadi:

#### Malumotlar:
- **Nom**: Xarajat turi nomi (misol: Soliq, Maosh, Kommunal, Remont)
- **Izoh**: Qisqacha tavsif
- **Limit Miqdori**: Maksimal xarajat chegarasi (so'm)
- **Muddat**: Limit qaysi davr uchun (Kunlik, Haftalik, Oylik, Yillik)
- **Rang**: UI'da ko'rsatish uchun rang
- **Holat**: Faol/Nofaol

#### Misol:
```
Xarajat Turi: "Soliq Xarajati"
Limit: 5,000,000 so'm
Muddat: Oylik
Rang: Qizil
```

---

### 2. **Xarajatlar (Expenses)**
Admin xarajatlarni kiritadi:

#### Malumotlar:
- **Xarajat Turi**: Oldindan yaratilgan turlardan tanlash (dropdown)
- **Miqdor**: Xarajat summasi (so'm)
- **Sana**: Xarajat qilingan sana
- **To'lov Usuli**: Naqd, Click, Payme, Uzum
- **Chek Raqami**: (Ixtiyoriy) Hujjat/chek raqami
- **Izoh**: Xarajat haqida qisqacha ma'lumot

#### Misol:
```
Xarajat Turi: Soliq Xarajati
Miqdor: 2,000,000 so'm
Sana: 2025-01-15
To'lov: Naqd
Izoh: Yanvar oyi uchun soliq to'lovi
```

---

### 3. **Limit Monitoring (Ogohlantirish Tizimi)**

Xarajatlar limitga nisbatan nazorat qilinadi va rang kodlari bilan ko'rsatiladi:

| Foiz | Holat | Rang | Tavsif |
|------|-------|------|---------|
| 0-69% | ✅ Xavfsiz | Yashil | Hammasi yaxshi |
| 70-84% | ⚠️ Ehtiyot | Sariq | Diqqat talab qiladi |
| 85-99% | ⚠️ Ogohlantr | Apelsin | Limitga yaqinlashmoqda! |
| 100%+ | 🚨 Xavfli | Qizil | Limit oshdi! |

#### Progress Bar:
Har bir xarajat turi uchun vizual progress bar ko'rsatiladi:
```
━━━━━━━━━━━━━━━━━━━━ 75%
2,000,000 / 5,000,000 so'm
```

---

### 4. **Balans Hisoblash (Dashboard)**

Admin dashboard'da **Moliyaviy Hisobot** qismi qo'shildi:

#### Kartalar:
1. **Kirim (Bu oy)** 🟢
   - To'lovlardan tushgan daromad
   - Misol: +10,000,000 so'm

2. **Xarajatlar (Bu oy)** 🔴
   - Sarflangan xarajatlar
   - Misol: -3,500,000 so'm
   - Link: Xarajatlarni ko'rish

3. **Balans (Bu oy)** 🔵
   - Formula: `Kirim - Xarajat = Balans`
   - Misol: 6,500,000 so'm
   - Ranglar: Musbat (ko'k), Manfiy (qizil)

#### Vizual Ko'rinish:
```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 🟢 Kirim (Bu oy)        │  │ 🔴 Xarajatlar (Bu oy)   │  │ 🔵 Balans (Bu oy)       │
│                         │  │                         │  │                         │
│ +10,000,000             │  │ -3,500,000              │  │ 6,500,000               │
│ To'lovlardan daromad    │  │ Xarajatlarni ko'rish →  │  │ Kirim - Xarajat         │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

## 🗂️ Ma'lumotlar Bazasi

### Models:

#### 1. ExpenseCategory
```prisma
model ExpenseCategory {
  id          String         @id @default(cuid())
  tenantId    String
  name        String         // Soliq, Maosh
  description String?
  limitAmount Decimal        // 5,000,000
  period      ExpensePeriod  // DAILY, WEEKLY, MONTHLY, YEARLY
  color       String?        // #FF5733
  icon        String?
  isActive    Boolean        @default(true)
  expenses    Expense[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}
```

#### 2. Expense
```prisma
model Expense {
  id            String          @id @default(cuid())
  tenantId      String
  categoryId    String
  amount        Decimal         // 2,000,000
  date          DateTime
  paymentMethod PaymentMethod   // CASH, CLICK, PAYME
  receiptNumber String?
  description   String?
  paidById      String?
  attachments   Json?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}
```

#### 3. Enum
```prisma
enum ExpensePeriod {
  DAILY    // Kunlik
  WEEKLY   // Haftalik
  MONTHLY  // Oylik
  YEARLY   // Yillik
}
```

---

## 📁 Fayl Strukturasi

```
📦 Xarajatlar Tizimi
├── 📂 prisma/
│   └── schema.prisma                  ✅ ExpenseCategory, Expense models
│
├── 📂 lib/validations/
│   └── expense.ts                     ✅ Zod validation schemas
│
├── 📂 app/actions/
│   └── expense.ts                     ✅ Server actions (CRUD)
│
├── 📂 app/(dashboard)/admin/
│   ├── page.tsx                       ✅ Dashboard (Balans ko'rsatish)
│   │
│   ├── 📂 expenses/
│   │   ├── page.tsx                   ✅ Xarajatlar ro'yxati
│   │   │
│   │   ├── 📂 create/
│   │   │   ├── page.tsx               ✅ Yangi xarajat yaratish
│   │   │   └── expense-form.tsx       ✅ Form component
│   │   │
│   │   └── 📂 categories/
│   │       ├── page.tsx               ✅ Xarajat turlari ro'yxati
│   │       │
│   │       └── 📂 create/
│   │           ├── page.tsx           ✅ Yangi tur yaratish
│   │           └── expense-category-form.tsx  ✅ Form
│   │
│   └── layout.tsx                     ✅ Navigation (Xarajatlar linki)
│
└── 📂 components/ui/
    ├── progress.tsx                   ✅ Progress bar component
    └── alert.tsx                      ✅ Alert component (warning)
```

---

## 🚀 Qanday Ishlaydi?

### Ish Oqimi (Workflow):

#### 1️⃣ Admin Xarajat Turini Yaratadi
```
Navigatsiya: Admin → Xarajatlar → Xarajat Turlari → Yangi Tur
```
- Nomini kiriting (misol: "Maosh")
- Limitni belgilang (misol: 15,000,000 so'm)
- Muddatni tanlang (misol: Oylik)
- Rang tanlang
- Saqlang

#### 2️⃣ Admin Xarajatni Kiritadi
```
Navigatsiya: Admin → Xarajatlar → Yangi Xarajat
```
- Xarajat turini tanlang (dropdown: "Maosh")
- Miqdorni kiriting (misol: 5,000,000 so'm)
- Sanani tanlang
- To'lov usulini tanlang
- Izoh yozing
- Saqlang

#### 3️⃣ Tizim Avtomatik Hisoblaydi
- Xarajat limitga nisbatan foizni hisoblaydi
- Progress bar yangilanadi
- Agar limit oshsa, qizil alert ko'rsatiladi
- Dashboard'da balans yangilanadi

#### 4️⃣ Dashboard'da Balans Ko'rsatiladi
```
Kirim (to'lovlar):   +10,000,000 so'm
Xarajatlar:          -3,500,000 so'm
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Balans:              6,500,000 so'm ✅
```

---

## 🎨 UI/UX Xususiyatlari

### 1. **Rang Kodlari**
Har bir xarajat turi o'z rangiga ega:
- 🔴 Qizil (#EF4444)
- 🟠 Apelsin (#F59E0B)
- 🟢 Yashil (#10B981)
- 🔵 Ko'k (#3B82F6)
- 🟣 Binafsha (#8B5CF6)

### 2. **Animatsiyalar**
- Card hover: Shadow kuchayadi
- Progress bar: Smooth transition
- Button hover: Rang o'zgaradi

### 3. **Responsive Design**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

---

## 🔐 Xavfsizlik

### Ruxsatlar:
- Faqat **ADMIN** roli xarajatlarni boshqarishi mumkin
- Super Admin xarajatlarni ko'ra olmaydi (tenant-specific)
- Har bir xarajat tenant ID bilan bog'langan

### Validatsiya:
- Miqdor > 0 bo'lishi kerak
- Xarajat turi aktiv bo'lishi kerak
- Tenant ID doimo tekshiriladi

---

## 📊 Hisobotlar va Statistika

### Xarajat Turlari Sahifasida:
1. **Jami Xarajat Turlari**: Barcha turlar soni
2. **Limit Oshdi**: 100% oshgan turlar soni
3. **Warning Holati**: 85%+ ishlatilgan turlar soni

### Xarajatlar Sahifasida:
- Jami xarajatlar summasi
- Kategoriya bo'yicha filterlash
- Sana oralig'i bo'yicha filterlash
- Jadvalda barcha xarajatlar

### Dashboard'da:
- Bu oylik kirim
- Bu oylik xarajat
- Bu oylik balans (+ yoki -)

---

## 🧪 Test Qilish

### Test Stsenariylari:

1. **Xarajat Turi Yaratish**
   - Nom, limit, muddat to'g'ri saqlanganmi?
   - Rang to'g'ri ko'rsatiladimi?

2. **Xarajat Qo'shish**
   - Xarajat to'g'ri saqlanganmi?
   - Progress bar yangilanganmi?
   - Limit warning ko'rsatiladimi?

3. **Balans Hisoblash**
   - Dashboard'da to'g'ri balans ko'rsatiladimi?
   - Ranglar to'g'ri (musbat = ko'k, manfiy = qizil)?

4. **Limit Oshganda**
   - Qizil alert ko'rsatiladimi?
   - Progress bar 100% dan oshganda to'g'ri ishlayaptimi?

---

## 📞 Foydalanish Qo'llanmasi

### Admin Uchun:

#### Xarajat Turini Yaratish:
1. Sidebar → "Xarajatlar"
2. "Xarajat Turlari" tugmasini bosing
3. "Yangi Tur" tugmasini bosing
4. Formani to'ldiring:
   - Nom: "Kommunal Xarajatlari"
   - Limit: 2,000,000 so'm
   - Muddat: Oylik
   - Rang: Ko'k
5. "Saqlash"

#### Xarajatni Kiritish:
1. Sidebar → "Xarajatlar"
2. "Yangi Xarajat" tugmasini bosing
3. Formani to'ldiring:
   - Tur: "Kommunal Xarajatlari"
   - Miqdor: 500,000 so'm
   - Sana: Bugun
   - To'lov: Naqd
   - Izoh: "Elektr va suv"
4. "Saqlash"

#### Balansni Ko'rish:
1. Sidebar → "Dashboard"
2. "Moliyaviy Hisobot" qismiga qarang
3. Kirim, Xarajat va Balans ko'rsatiladi

---

## ✅ Tayyor Funksiyalar

- ✅ Xarajat turlarini CRUD
- ✅ Xarajatlarni CRUD
- ✅ Limit monitoring
- ✅ Progress bar
- ✅ Warning/Alert tizimi
- ✅ Dashboard balans
- ✅ Rang kodlari
- ✅ Responsive design
- ✅ Filterlash
- ✅ Server actions
- ✅ Database indexing
- ✅ Caching (120 seconds)
- ✅ Navigation links

---

## 🎉 Xulosa

Bu tizim adminlarga:
- ✅ Xarajatlarni kategoriyalarga ajratishga
- ✅ Limitlarni belgilashga
- ✅ Real vaqtda balansni kuzatishga
- ✅ Limit oshishidan ogohlantirishga
- ✅ Moliyaviy hisobotlarni ko'rishga

imkon beradi!

**Formulasi:**
```
Kirim (to'lovlar) - Xarajatlar = Balans
```

Balans musbat bo'lsa - yaxshi! Manfiy bo'lsa - ehtiyot! 🚨

---

**Yaratildi**: 2025-12-01
**Versiya**: 1.0
**Holat**: ✅ Tayyor


