-- SUPER ADMIN YARATISH
-- Railway Database -> Data -> Query'da run qiling

-- 1. Super Admin User yaratish
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
  '$2a$10$YourHashedPasswordHere', -- Bu parolni keyinroq o'zgartiring
  'SUPER_ADMIN',
  NULL,
  true,
  NOW(),
  NOW()
);

-- 2. Tenant (Maktab) yaratish
INSERT INTO "Tenant" (
  id,
  name,
  slug,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Test Maktab',
  'test-maktab',
  true,
  NOW(),
  NOW()
);

-- 3. Maktab Admin yaratish (Tenant ID'ni yuqoridagidan oling)
-- Avval tenant ID'ni oling:
-- SELECT id, name FROM "Tenant" ORDER BY "createdAt" DESC LIMIT 1;

-- Keyin admin yaratish:
-- INSERT INTO "User" (
--   id, 
--   email, 
--   "fullName", 
--   password,
--   role, 
--   "tenantId",
--   "isActive",
--   "createdAt", 
--   "updatedAt"
-- ) VALUES (
--   gen_random_uuid(),
--   'admin@testmaktab.uz',
--   'Maktab Admin',
--   '$2a$10$YourHashedPasswordHere',
--   'ADMIN',
--   'TENANT_ID_SHUNGA_QOYING',
--   true,
--   NOW(),
--   NOW()
-- );

-- PAROL HASH YARATISH UCHUN:
-- Node.js console'da:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('yourpassword', 10);
-- console.log(hash);
