-- ================================================
-- RAILWAY DATABASE CHECK
-- ================================================
-- Railway -> Database -> Data -> Query'da run qiling!

-- 1️⃣ USER TABLE'NI TEKSHIRISH
SELECT 
  id, 
  email, 
  "fullName", 
  role, 
  "isActive",
  "createdAt"
FROM "User" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- 2️⃣ SUPER ADMIN BORMI?
SELECT 
  email, 
  "fullName", 
  role 
FROM "User" 
WHERE role = 'SUPER_ADMIN';

-- 3️⃣ BARCHA USER'LAR SONI
SELECT COUNT(*) as total_users FROM "User";

-- 4️⃣ ROLE BO'YICHA STATISTICS
SELECT 
  role, 
  COUNT(*) as count 
FROM "User" 
GROUP BY role;
