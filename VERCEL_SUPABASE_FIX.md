# ✅ Supabase Connection String - Vercel uchun To'g'ri Sozlash

## ⚠️ MUAMMO: IPv4 Compatibility

Sizda "Direct connection" tanlangan va **"Not IPv4 compatible"** xabari ko'rsatilgan.

Vercel IPv4-only platform, shuning uchun **Pooling mode** ishlatish kerak!

---

## ✅ YECHIM: Pooling Mode Tanlash

### BOSQICH 1: Method ni O'zgartirish

Supabase modal da:

1. **Method** dropdown ni oching
2. **"Session Pooler"** yoki **"Connection pooling"** ni tanlang
   - ❌ "Direct connection" emas!
   - ✅ "Session Pooler" yoki "Connection pooling"

### BOSQICH 2: Connection String Olish

Method ni o'zgartirayotganingizda, connection string avtomatik yangilanadi:

**Ko'rinishi:**
```
postgresql://postgres.ewslayzwmgwoapegmejh:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Farqlar:**
- Port: `6543` (6543 - pooling, 5432 - direct)
- Host: `aws-0-singapore.pooler.supabase.com` (pooler bilan)
- Query: `?pgbouncer=true` (qo'shilgan)

📋 **Copy qiling!** Bu `DATABASE_URL` bo'ladi.

---

## 📋 VERCEL ENVIRONMENT VARIABLES

Vercel dashboard ga qaytib, quyidagi variables larni qo'shing:

### 1. DATABASE_URL (Pooling Mode)

```
Key: DATABASE_URL
Value: postgresql://postgres.ewslayzwmgwoapegmejh:[YOUR-PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

⚠️ **MUHIM:** `[YOUR-PASSWORD]` o'rniga Supabase parolingizni qo'ying!

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

---

### 2. DIRECT_URL (Direct Mode - Migrations uchun)

Hali ham "Direct connection" kerak (migrations uchun), lekin Vercel build uchun asosan DATABASE_URL ishlatiladi.

Agar migrations muammosi bo'lsa, quyidagini qo'shing:

```
Key: DIRECT_URL
Value: postgresql://postgres.ewslayzwmgwoapegmejh:[YOUR-PASSWORD]@db.ewslayzwmgwoapegmejh.supabase.co:5432/postgres
```

⚠️ **Eslatma:** Vercel da migrations odatda DATABASE_URL orqali ishlaydi, DIRECT_URL optional.

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

---

### 3. NEXTAUTH_URL

```
Key: NEXTAUTH_URL
Value: https://school-xxxxx.vercel.app
```

⚠️ Hozircha noto'g'ri, deploy bo'lgandan keyin to'g'rilaymiz!

**Environment:**
- ✅ Production

---

### 4. NEXTAUTH_SECRET

```
Key: NEXTAUTH_SECRET
Value: [32-xonali-random-string]
```

PowerShell da yaratish:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

---

### 5. SUPER_ADMIN_EMAIL (Optional)

```
Key: SUPER_ADMIN_EMAIL
Value: admin@schoollms.uz
```

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

---

### 6. SUPER_ADMIN_PASSWORD (Optional)

```
Key: SUPER_ADMIN_PASSWORD
Value: SuperAdmin123!
```

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 🔄 KEYINGI QADAMLAR

1. ✅ Supabase da "Session Pooler" tanlash
2. ✅ Connection string ni copy qilish
3. ✅ Vercel dashboard → Settings → Environment Variables
4. ✅ DATABASE_URL qo'shish (pooling mode)
5. ✅ Qolgan variables qo'shish
6. ✅ Redeploy qilish

---

## ✅ TEKSHIRISH

Deploy bo'lgandan keyin:

1. Build log da `DATABASE_URL` xatoligi bo'lmasligi kerak
2. Site ishlayotganini tekshiring
3. Login qilishni sinab ko'ring

---

**Xatolik bo'lsa:** Build logs ni tekshiring va xatolikni yuboring!

