# 🔧 Vercel Environment Variables Xatolik - Yechim

## ❌ XATOLIK

```
Error: Environment variable not found: DATABASE_URL
```

Bu xatolik shuni anglatadiki, Vercel dashboard da environment variables qo'shilmagan.

---

## ✅ YECHIM: Environment Variables Qo'shish

### BOSQICH 1: Vercel Dashboard ga Kiring

1. [https://vercel.com/dashboard](https://vercel.com/dashboard) ga kiring
2. Sizning project ni tanlang (`school` yoki repository nomi)

### BOSQICH 2: Settings ga Kiring

1. Project dashboard da **Settings** tugmasini bosing (yuqorida)
2. Chap menyudan **Environment Variables** ni tanlang

### BOSQICH 3: Environment Variables Qo'shish

Quyidagi variables larni **barchasini** qo'shing:

---

#### 1️⃣ DATABASE_URL (MUHIM!)

```
Key: DATABASE_URL
Value: postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Qayerdan olish:**
- Supabase dashboard → Project Settings → Database
- Connection string → URI
- Pooling mode tanlang
- Copy qiling va `[PASSWORD]` o'rniga parolingizni qo'ying

**Environment:**
- ✅ Production
- ✅ Preview  
- ✅ Development

**Add** tugmasini bosing!

---

#### 2️⃣ DIRECT_URL (Migrations uchun)

```
Key: DIRECT_URL
Value: postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:5432/postgres
```

**Qayerdan olish:**
- Xuddi DATABASE_URL, lekin direct mode (port 5432)

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Add** tugmasini bosing!

---

#### 3️⃣ NEXTAUTH_URL

```
Key: NEXTAUTH_URL
Value: https://school-xxxxx.vercel.app
```

⚠️ **Hozircha noto'g'ri URL** - deploy bo'lgandan keyin to'g'rilaymiz!

**Environment:**
- ✅ Production

**Add** tugmasini bosing!

---

#### 4️⃣ NEXTAUTH_SECRET

**Yangi secret yaratish:**

Terminal da (local):
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Yoki online: [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)

```
Key: NEXTAUTH_SECRET
Value: [32-xonali-random-string]
```

**Misol:**
```
a3f8d9c2b5e7f1a4c6d8e9f2b3c5d7e8f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5
```

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Add** tugmasini bosing!

---

#### 5️⃣ SUPER_ADMIN_EMAIL (Optional)

```
Key: SUPER_ADMIN_EMAIL
Value: admin@schoollms.uz
```

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Add** tugmasini bosing!

---

#### 6️⃣ SUPER_ADMIN_PASSWORD (Optional)

```
Key: SUPER_ADMIN_PASSWORD
Value: SuperAdmin123!
```

⚠️ **XAVFSIZLIK:** Production da kuchliroq parol ishlating!

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Add** tugmasini bosing!

---

#### 7️⃣ NODE_ENV (Optional)

```
Key: NODE_ENV
Value: production
```

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Add** tugmasini bosing!

---

### BOSQICH 4: Saqlash va Redeploy

1. Barcha variables qo'shilganini tekshiring (kamida 4 ta: DATABASE_URL, DIRECT_URL, NEXTAUTH_URL, NEXTAUTH_SECRET)
2. **Deployments** tab ga kiring
3. Eng so'nggi deploy ni toping
4. **...** (3 nuqta) tugmasini bosing
5. **Redeploy** tugmasini bosing

Yoki yangi deploy yaratish:

1. **Deployments** tab
2. **Create Deployment** tugmasini bosing (agar mavjud bo'lsa)

⏳ **Kutish:** 3-5 daqiqa

---

## ✅ TEKSHIRISH

Deploy muvaffaqiyatli bo'lgandan keyin:

1. **Deployments** tab da build log ni ko'ring
2. Xatoliklar yo'qligini tekshiring
3. Site URL ni oching va test qiling

---

## 🎯 MINIMAL (Eng Kam)

Agar faqat test qilmoqchi bo'lsangiz, kamida quyidagilar kerak:

1. ✅ DATABASE_URL (majburiy)
2. ✅ NEXTAUTH_URL (majburiy)
3. ✅ NEXTAUTH_SECRET (majburiy)
4. ✅ DIRECT_URL (majburiy - migrations uchun)

---

## ⚠️ MUHIM ESDA TUTISH

1. **Barcha variables qo'shishdan OLDIN deploy qilmaslik kerak!**
2. **DATABASE_URL da pooling mode ishlatish kerak** (`?pgbouncer=true`)
3. **NEXTAUTH_SECRET har bir environment uchun bir xil bo'lishi kerak**
4. **Parollarni ehtiyotkorlik bilan kiritish kerak** (hech kimga ko'rsatmang!)

---

## 🆘 AGAR SUPABASE YO'Q BO'LSA

Agar sizda Supabase database yo'q bo'lsa:

1. [https://supabase.com](https://supabase.com) ga kiring
2. Account yarating (bepul)
3. New Project yarating
4. Database Password yarating va saqlang!
5. Connection string ni oling
6. Yuqoridagi qadamlarni bajarish

Yoki boshqa PostgreSQL provider ishlatishingiz mumkin:
- Neon.tech (bepul)
- Railway (bepul tier mavjud)
- Render (bepul tier mavjud)

---

**Yordam kerakmi?** Vercel Support ga murojaat qiling yoki qo'llanmalarni ko'ring.

