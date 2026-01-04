const { execSync } = require('child_process')

try {
  console.log('Running Prisma db push...')
  execSync('npx prisma db push', { stdio: 'inherit' })
  console.log('Running seed script...')
  try {
    execSync('node scripts/seed.js', { stdio: 'inherit' })
  } catch (seedError) {
    console.log('Seed script failed, continuing build:', seedError.message)
  }
  console.log('Database synced.')
} catch (error) {
  console.error('Migration failed:', error)
  process.exit(1)
}
