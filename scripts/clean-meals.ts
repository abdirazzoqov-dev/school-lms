import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning all meals from database...')
  
  const deleted = await prisma.meal.deleteMany({})
  
  console.log(`✅ Deleted ${deleted.count} meals`)
  console.log('Database is now clean and ready for new meal structure!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
