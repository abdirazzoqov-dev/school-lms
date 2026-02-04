-- ========================================
-- RAILWAY DATABASE FIX
-- ========================================
-- Railway -> Database -> Data -> Query'da run qiling!

-- 1️⃣ SUPER ADMIN YARATISH
-- Parol: Admin123!
INSERT INTO "User" (
  id, 
  email, 
  "fullName", 
  password,
  role, 
  "tenantId",
  "isActive",
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'superadmin@lms.uz',
  'Super Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'SUPER_ADMIN',
  NULL,
  true,
  NOW(),
  NOW()
);

-- NATIJA:
-- ✅ Email: superadmin@lms.uz
-- ✅ Parol: Admin123!
-- ✅ Role: SUPER_ADMIN

-- ========================================
-- 2️⃣ TEKSHIRISH
-- ========================================
SELECT id, email, "fullName", role FROM "User" WHERE role = 'SUPER_ADMIN';

-- ========================================
-- 3️⃣ LOGIN QILING
-- ========================================
-- URL: https://school-lms-production.up.railway.app/login
-- Email: superadmin@lms.uz
-- Parol: Admin123!
