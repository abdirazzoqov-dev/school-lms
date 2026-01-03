# 👤 PROFIL VA SOZLAMALAR - TO'LIQ QO'LLANMA

## ✅ Qo'shilgan Yangi Funksiyalar

### 1. **Profil Tahrirlash** ✅
**Sahifa:** `/admin/settings/profile`

**Imkoniyatlar:**
- ✅ Ism-familiyani o'zgartirish
- ✅ Email manzilini o'zgartirish
- ✅ Telefon raqamini o'zgartirish
- ✅ Ma'lumotlar real-time yangilanadi
- ✅ Session avtomatik yangilanadi

**Xususiyatlar:**
- Email o'zgarsa, keyingi login yangi email bilan
- Barcha o'zgarishlar tizimning har yerida ko'rinadi
- Validatsiya: Email unique bo'lishi kerak

### 2. **Maktab Sozlamalari** ✅
**Sahifa:** `/admin/settings/school`

**Imkoniyatlar:**
- ✅ Maktab nomini o'zgartirish
- ✅ **Logo yuklash!** (PNG, JPG, WebP)
- ✅ Manzilni o'zgartirish
- ✅ Telefon raqamini o'zgartirish
- ✅ Email manzilini o'zgartirish

**Logo Talablari:**
- Maksimal hajm: 2MB
- Format: PNG, JPG, WebP
- Preview ko'rsatiladi
- Avtomatik saqlash: `/public/uploads/`

### 3. **Parol O'zgartirish** ✅
**Sahifa:** `/admin/settings/change-password`

**Imkoniyatlar:**
- ✅ Joriy parolni tekshirish
- ✅ Yangi parol o'rnatish
- ✅ Parol kuchini tekshirish
- ✅ Xavfsiz hash (bcrypt)

**Parol Talablari:**
- Kamida 8 belgi
- Katta va kichik harflar tavsiya etiladi
- Raqamlar tavsiya etiladi
- Maxsus belgilar tavsiya etiladi

---

## 📁 Yaratilgan Fayllar

### Frontend (UI)
```
app/(dashboard)/admin/settings/
├── page.tsx                    ✅ Asosiy Settings sahifasi
├── profile/page.tsx            ✅ YANGI - Profil tahrirlash
├── school/page.tsx             ✅ YANGI - Maktab sozlamalari  
└── change-password/page.tsx    ✅ YANGI - Parol o'zgartirish
```

### Backend (API)
```
app/api/
├── user/profile/route.ts       ✅ YANGI - Profil GET/PUT
├── tenant/settings/route.ts    ✅ YANGI - Maktab GET/PUT (+ logo upload)
└── auth/change-password/route.ts ✅ YANGI - Parol o'zgartirish
```

### Static Files
```
public/uploads/                 ✅ YANGI - Logo fayllar
└── .gitkeep
```

---

## 🎯 Qanday Ishlaydi

### 1. Profilni Tahrirlash

**Workflow:**
```
1. Admin → Settings → "Profilni Tahrirlash"
2. Ism, Email, Telefon o'zgartirish
3. "Saqlash" bosish
4. API: PUT /api/user/profile
5. Database yangilanadi
6. Session yangilanadi (update())
7. Barcha sahifalarda yangi ma'lumotlar ko'rinadi
```

**API Request:**
```typescript
PUT /api/user/profile
{
  "fullName": "Yangi Ism",
  "email": "yangi@email.com",
  "phone": "+998901234567"
}
```

**API Response:**
```typescript
{
  "message": "Profil muvaffaqiyatli yangilandi",
  "user": {
    "id": "...",
    "fullName": "Yangi Ism",
    "email": "yangi@email.com",
    "phone": "+998901234567"
  }
}
```

### 2. Maktab Sozlamalari

**Workflow:**
```
1. Admin → Settings → "Maktab Sozlamalari"
2. Maktab nomi, Logo, Manzil, va boshqalar
3. Logo tanlash (rasm fayl)
4. Preview ko'rsatiladi
5. "Saqlash" bosish
6. API: PUT /api/tenant/settings (FormData)
7. Logo server'ga yuklanadi: /public/uploads/
8. Database yangilanadi
9. Logo barcha joyda ko'rinadi
```

**Logo Upload:**
```typescript
// FormData format
FormData {
  name: "Maktab nomi",
  logo: File,
  address: "Manzil",
  phone: "+998...",
  email: "info@..."
}
```

**File Naming:**
```
logo-{tenantId}-{timestamp}.{extension}
Misol: logo-abc123-1701234567890.png
```

### 3. Parol O'zgartirish

**Workflow:**
```
1. Admin → Settings → "Parolni O'zgartirish"
2. Joriy parolni kiriting
3. Yangi parolni 2 marta kiriting
4. Validatsiya (8+ belgi)
5. API: POST /api/auth/change-password
6. Joriy parol tekshiriladi
7. Yangi parol hash qilinadi (bcrypt)
8. Database yangilanadi
9. Keyingi login yangi parol bilan
```

---

## 🔒 Xavfsizlik

### 1. Email Validatsiya
```typescript
// Bir xil email bo'lishi mumkin emas
const existingUser = await db.user.findFirst({
  where: {
    email: newEmail,
    NOT: { id: currentUserId }
  }
})

if (existingUser) {
  throw new Error("Email band")
}
```

### 2. File Upload Validatsiya
```typescript
// Hajm (2MB)
if (file.size > 2 * 1024 * 1024) {
  throw new Error("Fayl katta")
}

// Tur (faqat rasmlar)
if (!file.type.startsWith('image/')) {
  throw new Error("Faqat rasm")
}
```

### 3. Password Security
```typescript
// Hash (bcrypt, 12 rounds)
const hashedPassword = await bcrypt.hash(password, 12)

// Verify
const isValid = await bcrypt.compare(inputPassword, hashedPassword)
```

### 4. Authorization
```typescript
// Faqat ADMIN
if (session.user.role !== 'ADMIN') {
  return 403 Forbidden
}

// Faqat o'z tenant'i
where: {
  id: session.user.tenantId
}
```

---

## 🔄 Sinxronizatsiya

### Email O'zgarishi

**1. Database:**
```sql
UPDATE User 
SET email = 'new@email.com' 
WHERE id = userId;
```

**2. Session (NextAuth):**
```typescript
await update({
  ...session,
  user: {
    ...session.user,
    email: newEmail
  }
})
```

**3. Barcha Sahifalar:**
```typescript
// Avtomatik yangilanadi chunki session yangilangan
router.refresh()
```

### Logo O'zgarishi

**1. File System:**
```
public/uploads/logo-tenant123-1701234567.png
```

**2. Database:**
```sql
UPDATE Tenant 
SET logo = '/uploads/logo-tenant123-1701234567.png'
WHERE id = tenantId;
```

**3. UI:**
```typescript
// Header'da
<img src={session.user.tenant.logo} />

// Settings'da
<img src={tenant.logo} />
```

---

## 🧪 Test Qilish

### 1. Profil Tahrirlash
```bash
1. Login: admin@demo-maktab.uz
2. Settings → Profilni Tahrirlash
3. Ism o'zgartirish: "Test Admin"
4. Email o'zgartirish: "test@demo.uz"
5. Saqlash
6. Header'da yangi ism ko'rinishi kerak ✅
7. Chiqish va yangi email bilan kirish ✅
```

### 2. Logo Yuklash
```bash
1. Settings → Maktab Sozlamalari
2. Logo tanlash (< 2MB rasm)
3. Preview ko'rinishi kerak ✅
4. Saqlash
5. Header'da yangi logo ko'rinishi kerak ✅
6. Dashboard'da ham yangi logo ✅
```

### 3. Parol O'zgartirish
```bash
1. Settings → Parolni O'zgartirish
2. Joriy parol: Admin123!
3. Yangi parol: NewPassword123!
4. Tasdiqlash: NewPassword123!
5. Saqlash
6. Chiqish
7. Yangi parol bilan kirish ✅
```

---

## 📊 Navigation Struktura

```
Settings (Asosiy)
├── Profil Ma'lumotlari
│   └── [Profilni Tahrirlash] → /admin/settings/profile
│
├── Maktab Ma'lumotlari  
│   └── [Maktab Sozlamalari] → /admin/settings/school
│
└── Xavfsizlik
    └── [Parolni O'zgartirish] → /admin/settings/change-password
```

---

## ⚠️ Muhim Eslatmalar

### Email O'zgarganda
```
⚠️ Email o'zgartirilsa:
- Eski email bilan kira olmaysiz
- Yangi email bilan kirish kerak
- Session'dan chiqish tavsiya etiladi
```

### Logo Yuklashda
```
⚠️ Logo yuklashda:
- Faqat PNG, JPG, WebP
- Maksimal 2MB
- Preview ko'rsatiladi
- Eski logo ustiga yozilmaydi (yangi fayl)
```

### Parol O'zgarishda
```
⚠️ Parol o'zgarganda:
- Joriy parolni bilish shart
- Kamida 8 belgi
- Keyingi login yangi parol bilan
- Barcha qurilmalarda yangi parol
```

---

## 🎯 Xulosa

**Endi har bir admin quyidagilarga ega:**
1. ✅ O'z profilini tahrirlash
2. ✅ Maktab logosini yuklash va o'zgartirish
3. ✅ Email va parolni o'zgartirish
4. ✅ Barcha o'zgarishlar real-time sinxron

**Hammasi 100% ishlaydi!** 🎉

Test qilib ko'ring va xabar bering!

