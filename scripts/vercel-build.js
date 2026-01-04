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

  console.log('Running Next.js build...')
  execSync('npm run build', { stdio: 'inherit' })
} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}
