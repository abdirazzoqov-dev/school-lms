# 🔧 IPv4 Muammosi - Aniq Yechim

## ❌ MUAMMO:
Modal da **"Not IPv4 compatible"** warning ko'rinayapti.

## ✅ YECHIM:
**"Pooler settings"** tugmasini bosing yoki **Method** ni **"Connection pooling"** ga o'zgartiring.

---

# ✅ ANIQ QADAMLAR

## BOSQICH 1: METHOD NI O'ZGARTIRISH (30 soniya)

### Modal da:

1. **Method** dropdown ni bosing
2. **"Connection pooling"** ni tanlang (Direct connection emas!)

### Connection string o'zgaradi:

**Oldin (Direct - IPv4 muammosi):**
```
postgresql://postgres:[YOUR_PASSWORD]@db.pgkzjfacqntzsgcoqvhk.supabase.co:5432/postgres
```

**Keyin (Pooling - IPv4 compatible):**
```
postgresql://postgres.pgkzjfacqntzsgcoqvhk:[YOUR_PASSWORD]@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true
```

📋 **Bu connection string ni copy qiling!**

---

## BOSQICH 2: .ENV FAYLNI YANGILASH (1 daqiqa)

`.env` faylga quyidagilarni qo'ying:

```env
# Supabase Connection (Pooling - IPv4 compatible)
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"

# Super Admin
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**MUHIM:**
- `Just2003` o'rniga Supabase parolingizni qo'ying
- `pgkzjfacqntzsgcoqvhk` o'rniga sizning project ID
- Port `6543` (pooler)
- `?pgbouncer=true` parametri

---

## BOSQICH 3: PRISMA DB PUSH (30 soniya)

```powershell
npx prisma db push
```

✅ **Ishlaydi!** Port 6543 IPv4 compatible.

---

# ✅ ALTERNATIV: "POOLER SETTINGS" TUGMASI

Agar "Pooler settings" tugmasi ko'rinayotgan bo'lsa:

1. **"Pooler settings"** tugmasini bosing
2. Connection pooling string ko'rinadi
3. **Copy** qiling
4. `.env` faylga qo'ying

---

# ✅ FINAL CHECKLIST

- [ ] Method: "Connection pooling" tanlandi
- [ ] Connection string port 6543
- [ ] `?pgbouncer=true` parametri bor
- [ ] .env fayl yangilandi
- [ ] db:push ishlayapti

---

**Eng muhimi: Method ni "Connection pooling" ga o'zgartiring!** 😊

