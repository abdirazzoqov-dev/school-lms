# 🚀 Avtomatik Deployment - Barcha Maktablar Uchun

## 🎯 SIZNING EHTIYOJINGIZ

**Muammo:** Har safar o'zgarish qilsam, barcha maktablarga qo'lda update qilish kerakmi?

**Javob:** YO'Q! ❌

**Yechim:** Git push → Avtomatik deploy → Barcha maktablar yangilanadi ✅

---

# 📊 ARXITEKTURA (SaaS Model)

```
                      ┌─────────────────┐
                      │   SIZNING PC    │
                      │   (Developer)   │
                      └────────┬────────┘
                               │
                          git push
                               │
                               ▼
                      ┌─────────────────┐
                      │     GITHUB      │
                      │  (Source Code)  │
                      └────────┬────────┘
                               │
                      Avtomatik trigger
                               │
                               ▼
                      ┌─────────────────┐
                      │     VERCEL      │
                      │   (Auto Build)  │
                      └────────┬────────┘
                               │
                         Deploy (30 sec)
                               │
                               ▼
                      ┌─────────────────┐
                      │  PRODUCTION     │
                      │  school-lms.uz  │
                      └────────┬────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         Maktab #1        Maktab #2        Maktab #3
        (tenant 1)       (tenant 2)       (tenant 3)
```

**1 ta codebase → Barcha maktablar!** 🎉

---

# ✅ VERCEL AVTOMATIK DEPLOYMENT (Default!)

Vercel ga bir marta deploy qilgandan keyin:

## Har safar git push qilsangiz:

```bash
# 1. O'zgarish qilasiz (masalan, yangi feature)
# 2. Git ga commit qilasiz
git add .
git commit -m "Yangi feature: SMS notifications"
git push

# 3. VERCEL AVTOMATIK:
# ✅ Pull code from GitHub
# ✅ Install dependencies
# ✅ Run build
# ✅ Deploy
# ✅ 30 soniyadan keyin LIVE!

# 4. BARCHA MAKTABLAR yangi versiyaga o'tadi!
```

**Siz hech narsa qo'shimcha qilmaysiz!** ✅

---

# 🔄 DATABASE MIGRATION (Xavfsiz!)

## Muammo: Database schema o'zgarsa nima bo'ladi?

Misol: Yangi column qo'shsangiz:

```prisma
model Student {
  // ... mavjud fieldlar
  middleName  String?  // ← YANGI!
}
```

## Yechim: Prisma Migrations

### Development da:

```bash
# 1. Schema o'zgartiring (prisma/schema.prisma)
# 2. Migration yarating
npx prisma migrate dev --name add_middle_name

# 3. Test qiling
npm run dev

# 4. Git push qiling
git add .
git commit -m "Add middle name field"
git push
```

### Production da (Avtomatik):

**Variant 1: Vercel Build Command**

`package.json` ga qo'shing:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**Vercel avtomatik:**
1. ✅ Prisma generate
2. ✅ Migration run qiladi
3. ✅ Build qiladi
4. ✅ Deploy qiladi

**Variant 2: Vercel Deploy Hook**

`vercel.json` yarating:

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && npm run build",
  "installCommand": "npm install"
}
```

---

# 🎯 TO'LIQ WORKFLOW (Amalda)

## 1. DEVELOPMENT (Sizning PC)

```bash
# Yangi feature qo'shish
cd c:\lms

# 1. Yangi feature code yozish
# 2. Database schema o'zgartirish (agar kerak bo'lsa)
npx prisma migrate dev --name new_feature

# 3. Test qilish
npm run dev
# http://localhost:3001 da test

# 4. Commit
git add .
git commit -m "Feature: Add SMS notifications"
git push origin main
```

## 2. VERCEL (Avtomatik)

```
⏳ Building... (GitHub push detected)
   ├─ Installing dependencies
   ├─ Running prisma generate
   ├─ Running prisma migrate deploy
   ├─ Building Next.js
   └─ Deploying...
✅ Deployed! (30-60 seconds)
```

## 3. PRODUCTION (Barcha Maktablar)

```
✅ school-lms.vercel.app yangilandi!
✅ Maktab #1 → Yangi versiya
✅ Maktab #2 → Yangi versiya
✅ Maktab #3 → Yangi versiya
✅ Database migration bajarildi
```

**Hech narsa qo'lda qilmadingiz!** 🎉

---

# 🛡️ XAVFSIZLIK VA ROLLBACK

## Agar xato bo'lsa?

### Vercel Avtomatik Rollback:

1. Vercel > Deployments
2. Oldingi working version ni toping
3. "Promote to Production" bosing
4. ✅ 10 soniyada eski versiyaga qaytadi!

### Yoki Git Revert:

```bash
# Oxirgi commit ni bekor qilish
git revert HEAD
git push

# Vercel avtomatik eski versiyaga deploy qiladi
```

---

# 📊 PREVIEW DEPLOYMENTS (Test Qilish)

## Feature Branch Strategy:

```bash
# 1. Yangi branch yarating
git checkout -b feature/sms-notifications

# 2. O'zgarishlar qiling
# 3. Push qiling
git push origin feature/sms-notifications

# 4. Vercel avtomatik PREVIEW deploy qiladi!
# URL: school-lms-git-feature-sms-xxx.vercel.app

# 5. Test qiling preview URL da
# 6. Agar yaxshi bo'lsa, main ga merge qiling
git checkout main
git merge feature/sms-notifications
git push

# 7. Production ga avtomatik deploy!
```

**Production buzilmaydi!** ✅

---

# 🗄️ DATABASE MIGRATION STRATEGIYASI

## Zero-Downtime Migration

### Xavfli ❌ (Downtime bo'ladi):

```prisma
model Student {
  name String  // ← Remove qilish
}
```

### Xavfsiz ✅ (Zero downtime):

**Step 1:** Yangi field qo'shing (optional)
```prisma
model Student {
  name      String   // Eski
  fullName  String?  // Yangi (optional)
}
```

**Step 2:** Code da ikkisini ham ishlating
```typescript
// Eski va yangi fieldlarni fill qilish
student.name = fullName
student.fullName = fullName
```

**Step 3:** Migration
```bash
npx prisma migrate dev --name add_full_name
git push
```

**Step 4:** Data migration
```typescript
// Barcha mavjud studentlar uchun
await prisma.student.updateMany({
  where: { fullName: null },
  data: { fullName: prisma.raw('name') }
})
```

**Step 5:** Eski fieldni o'chirish (keyinchalik)
```prisma
model Student {
  fullName  String  // Faqat yangi
}
```

---

# 🔔 MONITORING VA ALERTS

## Vercel Slack/Discord Integration

1. Vercel > Settings > Notifications
2. Slack/Discord webhook qo'shing
3. Har deploy da xabar keladi:

```
🚀 Deployed to Production
   Project: school-lms
   Branch: main
   Commit: "Add SMS notifications"
   Status: ✅ Success
   URL: school-lms.vercel.app
```

---

# 📋 CHECKLIST (Har Deploy da)

Quyidagilarni amalga oshiring:

- [ ] Local da test qilding
- [ ] Database migration test qilding
- [ ] Git commit message aniq
- [ ] Agar schema o'zgardi → migration yaratildi
- [ ] Push qildingiz
- [ ] Vercel deploy success bo'ldi
- [ ] Production test qilding
- [ ] Xatolar yo'q (Sentry/Vercel logs)

---

# 🎯 AMALIY MISOL

## Scenario: SMS Notification Feature Qo'shish

### 1. Development (Sizda)

```bash
# 1. Feature branch
git checkout -b feature/sms-notifications

# 2. Schema o'zgartirish
# prisma/schema.prisma
model Notification {
  // ... mavjud
  smsNumber  String?
  smsStatus  String?
}

# 3. Migration
npx prisma migrate dev --name add_sms_fields

# 4. Code yozish
# lib/sms.ts
export async function sendSMS(phone: string, message: string) {
  // SMS logic
}

# 5. Test
npm run dev

# 6. Commit
git add .
git commit -m "Feature: Add SMS notifications"
git push origin feature/sms-notifications
```

### 2. GitHub Pull Request

```
GitHub ga Pull Request yarating
→ Preview deployment avtomatik yaratiladi
→ Test qiling: school-lms-git-feature-xxx.vercel.app
→ Agar OK bo'lsa: Merge to main
```

### 3. Production Deploy (Avtomatik!)

```bash
# GitHub da "Merge" bosgandan keyin:

⏳ Vercel detecting changes...
⏳ Building...
   ├─ prisma generate ✅
   ├─ prisma migrate deploy ✅
   ├─ next build ✅
⏳ Deploying...
✅ Live in 45 seconds!
```

### 4. Barcha Maktablar

```
✅ Maktab #1: SMS feature mavjud
✅ Maktab #2: SMS feature mavjud
✅ Maktab #3: SMS feature mavjud
```

**Siz faqat 1 marta code yozdingiz!** 🎉

---

# 💰 XARAJATLAR

## Vercel Hobby (Bepul):
- ✅ Unlimited deployments
- ✅ Automatic deployments
- ✅ Preview deployments
- ✅ 100GB bandwidth/oy

## Vercel Pro ($20/oy) - Agar kerak bo'lsa:
- ✅ 1TB bandwidth
- ✅ Team collaboration
- ✅ Advanced analytics
- ✅ Password protection

---

# 🚀 SETUP (Bir Marta)

## 1. package.json ni Yangilang

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start"
  }
}
```

## 2. vercel.json Yarating

```json
{
  "buildCommand": "npm run vercel-build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

## 3. Git Push

```bash
git add package.json vercel.json
git commit -m "Setup automatic deployments"
git push
```

✅ **TAYYOR!** Endi har git push avtomatik deploy!

---

# 📊 VERSIONING

## Semantic Versioning

```bash
# Major release (breaking changes)
git tag v2.0.0
git push --tags

# Minor release (new features)
git tag v1.1.0
git push --tags

# Patch release (bug fixes)
git tag v1.0.1
git push --tags
```

Vercel har tag uchun alohida deployment yaratadi.

---

# 🎯 BEST PRACTICES

## 1. ✅ Har Doim Test Qiling

```bash
# Local da test
npm run dev

# Build test
npm run build

# Production preview test
# (Preview deployment URL)
```

## 2. ✅ Database Backup

```bash
# Har migration dan oldin
npm run backup  # Script yarating
```

## 3. ✅ Feature Flags

```typescript
// lib/features.ts
export const FEATURES = {
  SMS_NOTIFICATIONS: process.env.FEATURE_SMS === 'true',
  EMAIL_DIGEST: process.env.FEATURE_EMAIL === 'true',
}

// Component da
if (FEATURES.SMS_NOTIFICATIONS) {
  // SMS feature
}
```

Vercel Environment Variables da yoqish/o'chirish!

## 4. ✅ Gradual Rollout

```typescript
// Faqat ba'zi tenantlar uchun
const BETA_TENANTS = ['tenant-id-1', 'tenant-id-2']

if (BETA_TENANTS.includes(tenantId)) {
  // Yangi feature
}
```

---

# 🎊 XULOSA

## Sizning Workflow:

1. **O'zgarish qiling** (code, database, feature)
2. **Test qiling** (local)
3. **Git push qiling**
4. **30 soniyada LIVE!**
5. **Barcha maktablar yangilanadi!**

## Siz HECH QACHON:

- ❌ Qo'lda deploy qilmaysiz
- ❌ Har bir maktabga alohida update qilmaysiz
- ❌ Server sozlamaysiz
- ❌ Database qo'lda migrate qilmaysiz

## Vercel AVTOMATIK:

- ✅ Build qiladi
- ✅ Test qiladi
- ✅ Migrate qiladi
- ✅ Deploy qiladi
- ✅ Rollback (agar kerak bo'lsa)

---

# 🚀 HOZIR NIMA QILISH KERAK?

## 1. package.json Yangilang (2 daqiqa)

```bash
# Faylni oching va script qo'shing
code package.json
```

## 2. Git Push (1 daqiqa)

```bash
git add package.json
git commit -m "Setup auto deployment"
git push
```

## 3. Vercel Tekshiring

1. https://vercel.com/dashboard
2. Project > Settings > Git
3. ✅ "Automatic Deployments" yoniq bo'lishi kerak

✅ **TAYYOR!** Endi har git push avtomatik deploy! 🎉

---

**Ertaga feature qo'shsangiz:**
1. Code yozing
2. Git push qiling
3. ☕ Choy iching (30 soniya)
4. ✅ Barcha maktablarda yangi feature!

**Juda oson!** 🚀

