-- Run this in Railway Query or using psql

INSERT INTO "User" (
  id,
  email,
  "fullName",
  "passwordHash",
  role,
  "tenantId",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'admin@schoollms.uz',
  'Super Administrator',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'SUPER_ADMIN',
  NULL,
  true,
  NOW(),
  NOW()
);

-- Check if inserted
SELECT email, "fullName", role FROM "User" WHERE email = 'admin@schoollms.uz';
