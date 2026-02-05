const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('🔧 Creating Super Admin...\n');

  try {
    // Delete existing if any
    await prisma.user.deleteMany({
      where: { email: 'admin@schoollms.uz' }
    });

    // Create new super admin
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@schoollms.uz',
        fullName: 'Super Administrator',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    console.log('✅ SUCCESS! Admin created:\n');
    console.log('   Email:', admin.email);
    console.log('   Password: SuperAdmin123!');
    console.log('   Role:', admin.role);
    console.log('\n🎉 You can login now!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
