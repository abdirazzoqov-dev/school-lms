const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if admin exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@school.com' }
    })

    if (existingUser) {
      console.log('Admin user already exists')
      return
    }

    // Check if tenant exists
    let tenant = await prisma.tenant.findFirst({
      where: { slug: 'default' }
    })
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default School',
          slug: 'default',
          status: 'ACTIVE'
        }
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12)

    // Create admin user
    await prisma.user.create({
      data: {
        email: 'admin@school.com',
        fullName: 'Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        phone: '+998901234567',
        tenantId: tenant.id
      }
    })

    console.log('Default admin user created: admin@school.com / admin123')
  } catch (error) {
    console.error('Seeding error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()