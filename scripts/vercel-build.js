const { execSync } = require('child_process')

try {
  console.log('Running Prisma migrate deploy...')
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  console.log('Migration completed.')
} catch (error) {
  console.error('Migration failed:', error)
  process.exit(1)
}
