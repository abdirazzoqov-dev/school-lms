# ⚡ Tezkor Deploy Checklist - Docker → Vercel

## 📋 QADAM-BA-QADAM (Jami: 1 soat)

### ✅ BOSQICH 1: Docker Export (10 daqiqa)

```bash
# 1. Container status
docker ps

# 2. Backup export
docker exec school_lms_db pg_dump -U postgres school_lms > backup.sql

# 3. Tekshirish
ls -lh backup.sql
```

---

### ✅ BOSQICH 2: Supabase Setup (15 daqiqa)

1. https://supabase.com → Sign up
2. New Project → `school-lms-production`
3. Database password saqlang! 📝
4. Connection strings oling:
   - Pooling: `DATABASE_URL`
   - Direct: `DIRECT_URL`

---

### ✅ BOSQICH 3: Import (15 daqiqa)

```bash
# 1. .env yangilash
DATABASE_URL="postgresql://...?pgbouncer=true"
DIRECT_URL="postgresql://..."

# 2. Schema push
npm run db:generate
npx prisma db push

# 3. Ma'lumotlar import
psql "DIRECT_URL" < backup.sql
```

---

### ✅ BOSQICH 4: GitHub (5 daqiqa)

```bash
git add .
git commit -m "Ready for Vercel"
git push origin main
```

---

### ✅ BOSQICH 5: Vercel (20 daqiqa)

1. https://vercel.com → Import project
2. Environment variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_URL` (3 ta: Production, Preview, Development)
   - `NEXTAUTH_SECRET`
3. Deploy!

---

## 🔑 MUHIM ENVIRONMENT VARIABLES

```env
# Production
DATABASE_URL="postgresql://...?pgbouncer=true"
DIRECT_URL="postgresql://..."
NEXTAUTH_URL="https://your-project.vercel.app"
NEXTAUTH_SECRET="your-secret-key"
```

---

## ⚠️ MUAMMOLAR?

1. **Database connection error**
   → Supabase project active ekanligini tekshiring

2. **Migration failed**
   → `DIRECT_URL` qo'shilganligini tekshiring

3. **Build failed**
   → `NEXTAUTH_SECRET` qo'shilganligini tekshiring

---

**Batafsil:** `DOCKER_TO_VERCEL_DEPLOY.md` 📖

