// Password hash generator for super admin
// Run: node scripts/generate-password-hash.js

const bcrypt = require('bcryptjs');

async function generateHash() {
  // PAROLNI SHUNGA O'ZGARTIRING:
  const password = 'Admin123!';
  
  console.log('Generating password hash...');
  console.log('Password:', password);
  
  const hash = await bcrypt.hash(password, 10);
  
  console.log('\n===========================================');
  console.log('PASSWORD HASH:');
  console.log(hash);
  console.log('===========================================\n');
  
  console.log('SQL query:');
  console.log(`
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
  '${hash}',
  'SUPER_ADMIN',
  NULL,
  true,
  NOW(),
  NOW()
);
  `);
}

generateHash().catch(console.error);
