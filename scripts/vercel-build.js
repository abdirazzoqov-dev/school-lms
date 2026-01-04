const { execSync } = require('child_process')

try {
  console.log('Running Prisma db push...')
  execSync('npx prisma db push', { stdio: 'inherit' })
  console.log('Running seed script...')
  execSync('node scripts/seed.js', { stdio: 'inherit' })
  console.log('Database synced.')
} catch (error) {
  console.error('Migration failed:', error)
  process.exit(1)
}
