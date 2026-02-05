// Check users in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  console.log('\n🔍 Checking database users...\n');
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\nDatabase is empty. Need to run seed again.\n');
    } else {
      console.log(`✅ Found ${users.length} users:\n`);
      console.log('━'.repeat(80));
      users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.fullName || 'No name'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
        console.log('   ' + '─'.repeat(76));
      });
      console.log('━'.repeat(80));
      
      const superAdmin = users.find(u => u.role === 'SUPER_ADMIN');
      if (superAdmin) {
        console.log('\n🎉 SUPER ADMIN FOUND!');
        console.log(`   Email: ${superAdmin.email}`);
        console.log('   Password: SuperAdmin123!');
        console.log('\n✅ You can login now!\n');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
