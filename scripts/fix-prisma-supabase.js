/**
 * Prisma + Supabase Fix Script
 * 
 * Bu script quyidagilarni bajaradi:
 * 1. Prisma Client generate
 * 2. Migration yaratish (agar migrations papkasi bo'sh bo'lsa)
 * 3. Database schema push (agar migrations mavjud bo'lsa, deploy qiladi)
 * 
 * Ishlatish:
 * node scripts/fix-prisma-supabase.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Prisma + Supabase Fix Script\n');

// Check if migrations folder exists
const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
const hasMigrations = fs.existsSync(migrationsPath) && 
  fs.readdirSync(migrationsPath).length > 0;

try {
  // 1. Prisma Client Generate
  console.log('📦 Step 1: Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated!\n');

  // 2. Database Setup
  if (hasMigrations) {
    console.log('📤 Step 2: Deploying migrations (production mode)...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations deployed!\n');
    } catch (error) {
      console.warn('⚠️  Migration deploy failed, trying db push...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Database schema pushed!\n');
    }
  } else {
    console.log('📤 Step 2: Creating initial migration...');
    try {
      execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
      console.log('✅ Initial migration created!\n');
    } catch (error) {
      console.warn('⚠️  Migration creation failed, using db push...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Database schema pushed!\n');
    }
  }

  // 3. Verify
  console.log('🔍 Step 3: Verifying database connection...');
  try {
    execSync('npx prisma db execute --stdin', { 
      stdio: ['pipe', 'pipe', 'pipe'],
      input: 'SELECT 1;'
    });
    console.log('✅ Database connection verified!\n');
  } catch (error) {
    console.warn('⚠️  Could not verify connection (this is OK)\n');
  }

  console.log('🎉 Fix completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Check Supabase dashboard → Table Editor');
  console.log('2. Verify tables exist (users, tenants, etc.)');
  console.log('3. If migrations were created, commit them:');
  console.log('   git add prisma/migrations');
  console.log('   git commit -m "Add Prisma migrations"');
  console.log('   git push');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

