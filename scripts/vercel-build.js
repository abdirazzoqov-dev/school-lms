const { execSync } = require('child_process')

console.log('Running seed script...')
try {
  execSync('node scripts/seed.js', { stdio: 'inherit' })
} catch (seedError) {
  console.log('Seed script failed, continuing build:', seedError.message)
}
console.log('Build setup completed.')
