/**
 * Supabase Database Setup Script
 * 
 * Bu script Prisma schema'ni Supabase'ga yuklaydi.
 * 
 * Ishlatish:
 * 1. .env faylda DATABASE_URL to'g'ri ekanligini tekshiring
 * 2. node scripts/setup-supabase.js
 */

const { execSync } = require('child_process');

console.log('🚀 Supabase Database Setup...\n');

// 1. Prisma Client Generate
console.log('📦 Step 1: Generating Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated successfully!\n');
} catch (error) {
  console.error('❌ Error generating Prisma Client:', error.message);
  process.exit(1);
}

// 2. Database Schema Push
console.log('📤 Step 2: Pushing schema to Supabase...');
try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Schema pushed successfully!\n');
} catch (error) {
  console.error('❌ Error pushing schema:', error.message);
  console.log('\n💡 Tips:');
  console.log('   - Check DATABASE_URL in .env file');
  console.log('   - Verify Supabase password is correct');
  console.log('   - Ensure Supabase project is active');
  process.exit(1);
}

// 3. Seed Data (Optional)
console.log('🌱 Step 3: Seeding database (optional)...');
const seedOption = process.argv[2];
if (seedOption === '--seed') {
  try {
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('✅ Seed data loaded successfully!\n');
  } catch (error) {
    console.warn('⚠️  Seed failed (this is optional):', error.message);
  }
} else {
  console.log('⏭️  Skipping seed (use --seed flag to include seed data)');
}

console.log('\n🎉 Database setup completed!');
console.log('📊 Check your Supabase dashboard to see the tables.');

