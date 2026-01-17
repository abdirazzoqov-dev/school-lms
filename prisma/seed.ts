import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create Super Admin
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@schoollms.uz'
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!'

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  })

  const hashedPassword = await bcrypt.hash(superAdminPassword, 12)

  if (existingSuperAdmin) {
    // Update password and ensure role is correct (idempotent)
    await prisma.user.update({
      where: { email: superAdminEmail },
      data: {
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        fullName: existingSuperAdmin.fullName || 'Super Administrator',
      },
    })
    console.log('✅ Super Admin updated (password refreshed)')
  } else {
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        fullName: 'Super Administrator',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    })
    console.log('✅ Super Admin created')
  }

  console.log(`   Email: ${superAdminEmail}`)
  console.log(`   Password: ${superAdminPassword}`)

  // Create Demo Tenant (Maktab)
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-maktab' },
    update: {},
    create: {
      name: 'Demo Maktab #1',
      slug: 'demo-maktab',
      email: 'demo@maktab.uz',
      phone: '+998 90 123 45 67',
      address: 'Toshkent shahar, Yunusobod tumani',
      status: 'TRIAL',
      subscriptionPlan: 'BASIC',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      maxStudents: 50,
      maxTeachers: 10,
    },
  })
  console.log('✅ Demo Tenant created:', demoTenant.name)

  // Create Admin User for Demo Tenant
  const adminPassword = 'Admin123!'
  const adminEmail = 'admin@demo-maktab.uz'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12)

    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'Maktab Administratori',
        passwordHash: hashedAdminPassword,
        role: 'ADMIN',
        tenantId: demoTenant.id,
        isActive: true,
      },
    })

    console.log('✅ Demo Admin created')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
  }

  // Create Demo Teachers
  const teacherPassword = 'Teacher123!'
  const demoTeachers = [
    {
      email: 'teacher1@demo-maktab.uz',
      fullName: 'Aziza Karimova',
      specialization: 'Matematika',
      education: 'Toshkent Davlat Pedagogika Universiteti',
      experienceYears: 5,
    },
    {
      email: 'teacher2@demo-maktab.uz',
      fullName: 'Botir Rahmonov',
      specialization: 'Fizika',
      education: 'O\'zbekiston Milliy Universiteti',
      experienceYears: 8,
    },
    {
      email: 'teacher3@demo-maktab.uz',
      fullName: 'Dilnoza Yusupova',
      specialization: 'Ona tili',
      education: 'Samarqand Davlat Universiteti',
      experienceYears: 3,
    },
  ]

  for (let i = 0; i < demoTeachers.length; i++) {
    const teacherData = demoTeachers[i]
    const existingTeacher = await prisma.user.findUnique({
      where: { email: teacherData.email },
    })

    if (!existingTeacher) {
      const hashedTeacherPassword = await bcrypt.hash(teacherPassword, 12)

      const teacherUser = await prisma.user.create({
        data: {
          email: teacherData.email,
          fullName: teacherData.fullName,
          passwordHash: hashedTeacherPassword,
          role: 'TEACHER',
          tenantId: demoTenant.id,
          isActive: true,
        },
      })

      await prisma.teacher.create({
        data: {
          tenantId: demoTenant.id,
          userId: teacherUser.id,
          teacherCode: `T${String(i + 1).padStart(3, '0')}`,
          specialization: teacherData.specialization,
          education: teacherData.education,
          experienceYears: teacherData.experienceYears,
        },
      })

      console.log(`✅ Demo Teacher ${i + 1} created: ${teacherData.fullName}`)
    }
  }
  
  console.log(`   Password for all teachers: ${teacherPassword}`)

  // Create Demo Parent
  const parentPassword = 'Parent123!'
  const parentEmail = 'parent@demo-maktab.uz'

  const existingParent = await prisma.user.findUnique({
    where: { email: parentEmail },
  })

  if (!existingParent) {
    const hashedParentPassword = await bcrypt.hash(parentPassword, 12)

    const parentUser = await prisma.user.create({
      data: {
        email: parentEmail,
        fullName: 'Jamshid Aliyev',
        passwordHash: hashedParentPassword,
        role: 'PARENT',
        tenantId: demoTenant.id,
        isActive: true,
      },
    })

    await prisma.parent.create({
      data: {
        tenantId: demoTenant.id,
        userId: parentUser.id,
        guardianType: 'FATHER',
        occupation: 'Tadbirkor',
      },
    })

    console.log('✅ Demo Parent created')
    console.log(`   Email: ${parentEmail}`)
    console.log(`   Password: ${parentPassword}`)
  }

  // Create Demo Subjects
  const subjects = [
    { name: 'Matematika', code: 'MATH', color: '#3B82F6' },
    { name: 'Fizika', code: 'PHYS', color: '#10B981' },
    { name: 'Ona tili', code: 'UZB', color: '#F59E0B' },
    { name: 'Ingliz tili', code: 'ENG', color: '#EF4444' },
    { name: 'Tarix', code: 'HIST', color: '#8B5CF6' },
  ]

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: {
        tenantId_code: {
          tenantId: demoTenant.id,
          code: subject.code,
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        name: subject.name,
        code: subject.code,
        color: subject.color,
      },
    })
  }
  console.log('✅ Demo Subjects created')

  // Create Demo Class
  const demoClass = await prisma.class.upsert({
    where: {
      id: 'demo-class-7a',
    },
    update: {},
    create: {
      id: 'demo-class-7a',
      tenantId: demoTenant.id,
      name: '7-A',
      gradeLevel: 7,
      academicYear: '2024-2025',
      maxStudents: 30,
      roomNumber: '101',
    },
  })
  console.log('✅ Demo Class created:', demoClass.name)

  // Create Demo Students with Parents
  const demoStudents = [
    {
      studentCode: 'STD24001',
      fullName: 'Aliyev Ali Akbarovich',
      dateOfBirth: '2010-05-15',
      gender: 'MALE',
      monthlyTuitionFee: 2000000,
      guardianName: 'Aliyev Akbar Aminovich',
      guardianPhone: '+998901234567',
    },
    {
      studentCode: 'STD24002',
      fullName: 'Akbarov Anvar Alievich',
      dateOfBirth: '2010-08-22',
      gender: 'MALE',
      monthlyTuitionFee: 2500000,
      guardianName: 'Akbarov Ali Azimovich',
      guardianPhone: '+998901234568',
    },
  ]

  for (const studentData of demoStudents) {
    // Check if student already exists
    const existingStudent = await prisma.student.findUnique({
      where: {
        tenantId_studentCode: {
          tenantId: demoTenant.id,
          studentCode: studentData.studentCode,
        },
      },
    })

    if (!existingStudent) {
      // Create student user
      const studentEmail = `${studentData.studentCode.toLowerCase()}@student.local`
      const studentUserExists = await prisma.user.findUnique({
        where: { email: studentEmail },
      })

      let studentUser
      if (!studentUserExists) {
        const studentPasswordHash = await bcrypt.hash('Student123!', 12)
        studentUser = await prisma.user.create({
          data: {
            email: studentEmail,
            fullName: studentData.fullName,
            passwordHash: studentPasswordHash,
            role: 'STUDENT',
            tenantId: demoTenant.id,
            isActive: true,
          },
        })
      } else {
        studentUser = studentUserExists
      }

      // Create parent user
      const parentEmail = `${studentData.guardianPhone.replace(/\D/g, '')}@parent.local`
      let parentUser = await prisma.user.findUnique({
        where: { email: parentEmail },
      })

      if (!parentUser) {
        const parentPasswordHash = await bcrypt.hash('Parent123!', 12)
        parentUser = await prisma.user.create({
          data: {
            email: parentEmail,
            fullName: studentData.guardianName,
            phone: studentData.guardianPhone,
            passwordHash: parentPasswordHash,
            role: 'PARENT',
            tenantId: demoTenant.id,
            isActive: true,
          },
        })
      }

      // Create parent record
      let parent = await prisma.parent.findFirst({
        where: {
          userId: parentUser.id,
          tenantId: demoTenant.id,
        },
      })

      if (!parent) {
        parent = await prisma.parent.create({
          data: {
            tenantId: demoTenant.id,
            userId: parentUser.id,
          },
        })
      }

      // Create student
      const student = await prisma.student.create({
        data: {
          tenantId: demoTenant.id,
          userId: studentUser.id,
          studentCode: studentData.studentCode,
          dateOfBirth: new Date(studentData.dateOfBirth),
          gender: studentData.gender as any,
          classId: demoClass.id,
          status: 'ACTIVE',
          monthlyTuitionFee: studentData.monthlyTuitionFee,
          paymentDueDay: 5,
        },
      })

      // Link parent to student
      await prisma.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          hasAccess: true, // ✅ Only hasAccess field exists
        },
      })

      console.log(`✅ Demo Student created: ${studentData.fullName}`)
    }
  }

  // Create Global Subscription Plans
  const plans = [
    {
      planType: 'BASIC',
      name: 'BASIC',
      displayName: 'Asosiy',
      price: 500000,
      description: 'Kichik maktablar uchun',
      maxStudents: 50,
      maxTeachers: 10,
      features: [
        '50 ta o\'quvchi',
        '10 ta o\'qituvchi',
        'Asosiy funksiyalar',
        'Email qo\'llab-quvvatlash'
      ],
      isActive: true,
      isPopular: false,
      displayOrder: 1,
    },
    {
      planType: 'STANDARD',
      name: 'STANDARD',
      displayName: 'Standart',
      price: 1500000,
      description: 'O\'rta maktablar uchun',
      maxStudents: 200,
      maxTeachers: 30,
      features: [
        '200 ta o\'quvchi',
        '30 ta o\'qituvchi',
        'Barcha funksiyalar',
        'Telefon qo\'llab-quvvatlash',
        'Hisobotlar va statistika'
      ],
      isActive: true,
      isPopular: true,
      displayOrder: 2,
    },
    {
      planType: 'PREMIUM',
      name: 'PREMIUM',
      displayName: 'Premium',
      price: 3000000,
      description: 'Katta maktablar uchun',
      maxStudents: 9999,
      maxTeachers: 9999,
      features: [
        'Cheksiz o\'quvchi',
        'Cheksiz o\'qituvchi',
        'Barcha funksiyalar',
        '24/7 qo\'llab-quvvatlash',
        'Maxsus integratsiyalar',
        'Shaxsiy menejer'
      ],
      isActive: true,
      isPopular: false,
      displayOrder: 3,
    },
  ]

  for (const plan of plans) {
    await prisma.globalSubscriptionPlan.upsert({
      where: { planType: plan.planType as any },
      update: {},
      create: plan as any,
    })
  }
  console.log('✅ Global Subscription Plans created')

  // Create Global Settings
  const existingSettings = await prisma.globalSettings.findFirst()
  if (!existingSettings) {
    await prisma.globalSettings.create({
      data: {
        platformName: 'School LMS',
        platformDescription: 'Maktablar uchun zamonaviy boshqaruv tizimi',
        supportPhone: '+998 71 123 45 67',
        defaultLanguage: 'uz',
        timezone: 'Asia/Tashkent',
      },
    })
    console.log('✅ Global Settings created')
  }

  console.log('\n🎉 Seed completed successfully!\n')
  console.log('📝 Login Credentials:')
  console.log('━'.repeat(50))
  console.log('\n🔐 Super Admin:')
  console.log(`   Email: ${superAdminEmail}`)
  console.log(`   Password: ${superAdminPassword}`)
  console.log('\n👤 Demo Admin:')
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Password: ${adminPassword}`)
  console.log('\n👨‍🏫 Demo Teachers:')
  console.log(`   Email: teacher1@demo-maktab.uz, teacher2@demo-maktab.uz, ...`)
  console.log(`   Password: ${teacherPassword}`)
  console.log('\n👨‍👩‍👧 Demo Parent:')
  console.log(`   Email: ${parentEmail}`)
  console.log(`   Password: ${parentPassword}`)
  console.log('\n' + '━'.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

