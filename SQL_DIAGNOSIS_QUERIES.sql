-- ============================================
-- PRISMA USERS TABLE DIAGNOSIS - SQL QUERIES
-- ============================================
-- Supabase SQL Editor'da ketma-ket bajaring
-- ============================================

-- 1️⃣ Qaysi DB va User'ga ulanganini tekshirish
SELECT 
  current_database() as database_name,
  current_user as current_user_name,
  version() as postgres_version,
  current_schema() as current_schema_name;

-- 2️⃣ public.users bor-yo'qligini tekshirish
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'users';

-- 3️⃣ users nomiga o'xshash jadvallarni barcha schema'lardan qidirish
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE LOWER(table_name) LIKE '%user%'
ORDER BY table_schema, table_name;

-- 4️⃣ Barcha schema'lar bo'yicha jadval sonini chiqarish (36 to'g'riligini tekshirish)
SELECT 
  table_schema,
  COUNT(*) as table_count,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as table_names
FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- 5️⃣ Prisma migrations mavjudligini tekshirish
-- 5a. _prisma_migrations jadvali bor-yo'qligini tekshirish
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = '_prisma_migrations'
) as migrations_table_exists;

-- 5b. Prisma migrations ro'yxati (agar jadval bor bo'lsa)
SELECT 
  migration_name,
  finished_at,
  applied_steps_count,
  started_at
FROM _prisma_migrations 
ORDER BY finished_at DESC 
LIMIT 10;

-- ============================================
-- QO'SHIMCHA TEKSHIRUVLAR
-- ============================================

-- Case-sensitive tekshiruv (User vs users)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('User', 'user', 'users', 'USER');

-- auth.users va public.users farqi (agar ikkalasi ham bor bo'lsa)
-- Eslatma: Bu xato beradi agar public.users yo'q bo'lsa
SELECT 
  'auth.users' as table_name,
  COUNT(*) as row_count
FROM auth.users
UNION ALL
SELECT 
  'public.users' as table_name,
  COUNT(*) as row_count
FROM public.users;

-- Barcha public schema jadvallari ro'yxati
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

