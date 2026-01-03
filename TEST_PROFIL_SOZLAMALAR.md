# 🧪 PROFIL VA SOZLAMALAR - TEST QILISH

## ✅ Hozir Test Qiling!

### 1️⃣ Settings Sahifasiga Kirish

```bash
1. Browser: http://localhost:3000
2. Login: admin@demo-maktab.uz / Admin123!
3. Sidebar → "Sozlamalar" bosing
4. Settings sahifasi ochilishi kerak ✅
```

**Ko'rinishi kerak:**
- ✅ Maktab ma'lumotlari (nom, slug, status)
- ✅ Profil ma'lumotlari (ism, email, role)
- ✅ "Profilni Tahrirlash" tugmasi
- ✅ "Maktab Sozlamalari" tugmasi
- ✅ "Parolni O'zgartirish" tugmasi

---

### 2️⃣ Profilni Tahrirlash

```bash
1. Settings → "Profilni Tahrirlash" bosing
2. Ism o'zgartiring: "Test Admin Ismi"
3. Telefon qo'shing: "+998901234567"
4. "Saqlash" bosing
5. Settings sahifasiga qaytadi
```

**Natija:**
- ✅ Header'da yangi ism ko'rinadi
- ✅ Settings'da yangi ma'lumotlar
- ✅ Toast notification: "Profil muvaffaqiyatli yangilandi"

---

### 3️⃣ Maktab Logosini Yuklash

```bash
1. Settings → "Maktab Sozlamalari" bosing
2. Logo fayl tanlang (< 2MB, PNG/JPG)
3. Preview ko'rinishini tekshiring
4. Maktab nomini o'zgartiring (ixtiyoriy)
5. "Saqlash" bosing
```

**Natija:**
- ✅ Logo yuklandi
- ✅ Header'da yangi logo ko'rinadi
- ✅ Settings'da yangi logo
- ✅ Toast: "Maktab ma'lumotlari yangilandi"

---

### 4️⃣ Email O'zgartirish

```bash
1. Settings → "Profilni Tahrirlash"
2. Email o'zgartiring: "newadmin@demo-maktab.uz"
3. "Saqlash" bosing
4. Chiqing (Logout)
5. Yangi email bilan kiring
```

**Natija:**
- ✅ Eski email bilan kira olmaysiz
- ✅ Yangi email bilan kirish mumkin
- ✅ Barcha ma'lumotlar saqlanadi

---

### 5️⃣ Parol O'zgartirish

```bash
1. Settings → "Parolni O'zgartirish" bosing
2. Joriy parol: Admin123!
3. Yangi parol: NewPassword123!
4. Tasdiqlash: NewPassword123!
5. "Parolni O'zgartirish" bosing
6. Chiqing
7. Yangi parol bilan kiring
```

**Natija:**
- ✅ Eski parol bilan kira olmaysiz
- ✅ Yangi parol bilan kirish mumkin
- ✅ Toast: "Parol muvaffaqiyatli o'zgartirildi"

---

### 6️⃣ Yangi Maktab Test

```bash
1. Super Admin: admin@schoollms.uz / SuperAdmin123!
2. Maktablar → Yangi Maktab
3. Nom: "Test Maktab"
4. Slug: "test-maktab"
5. Yaratish
6. Chiqish
7. Yangi admin: admin@test-maktab.uz / Admin123!
```

**Test:**
- ✅ Settings → Faqat o'z maktab ma'lumotlari
- ✅ Profil → To'g'ri ma'lumotlar
- ✅ Logo yuklash → O'z maktab logosi
- ✅ Dashboard → Faqat o'z maktab statistikasi

---

## 🎯 Tekshirish Checklisti

### Profil
- [ ] Profilni tahrirlash sahifasi ochiladi
- [ ] Ism o'zgaradi va barcha joyda ko'rinadi
- [ ] Email o'zgaradi va login yangilanadi
- [ ] Telefon saqlanadi
- [ ] Session avtomatik yangilanadi

### Maktab
- [ ] Maktab sozlamalari sahifasi ochiladi
- [ ] Logo yuklash ishlaydi
- [ ] Logo preview ko'rsatiladi
- [ ] Logo barcha joyda ko'rinadi
- [ ] Maktab ma'lumotlari yangilanadi

### Parol
- [ ] Parol o'zgartirish sahifasi ochiladi
- [ ] Joriy parol tekshiriladi
- [ ] Yangi parol validatsiya qilinadi
- [ ] Parol o'zgaradi
- [ ] Keyingi login yangi parol bilan

### Tenant Isolation
- [ ] Har bir admin faqat o'z ma'lumotlarini ko'radi
- [ ] Logo yuklash o'z maktabiga tegishli
- [ ] Profil o'zgartirish faqat o'ziga ta'sir qiladi
- [ ] Boshqa maktab ma'lumotlari ko'rinmaydi

---

## ⚠️ Agar Muammo Bo'lsa

### Logo Yuklanmasa:
```bash
1. public/uploads/ papka mavjudmi?
2. Fayl hajmi < 2MB?
3. Format: PNG, JPG, WebP?
4. Browser console'da xato bormi?
```

### Profil Saqlanmasa:
```bash
1. /api/user/profile route mavjudmi?
2. Network tab'da request jo'natilganmi?
3. Response nima qaytarmoqda?
4. Console'da xato bormi?
```

### Session Yangilanmasa:
```bash
1. Sahifani refresh qiling (F5)
2. Browser cache tozalang
3. Chiqib qayta kiring
4. /admin/debug'ga o'ting va session'ni tekshiring
```

---

## 🎉 Hammasi Tayyor!

**Yangi funksiyalar:**
1. ✅ Profil tahrirlash (ism, email, telefon)
2. ✅ Logo yuklash (PNG, JPG, WebP)
3. ✅ Maktab sozlamalari
4. ✅ Email o'zgartirish (sinxron)
5. ✅ Parol o'zgartirish (xavfsiz)
6. ✅ Session auto-update
7. ✅ Tenant isolation (har biri o'z ma'lumotlari)

**Test qilib ko'ring va natijalarni xabar bering!** 🚀

