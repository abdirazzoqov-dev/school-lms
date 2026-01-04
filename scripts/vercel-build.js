const { execSync } = require('child_process')

// Optimize for connection pooling if using Supabase/PgBouncer
if (process.env.DATABASE_URL) {
  let url = process.env.DATABASE_URL
  if (url.includes('supabase.com') || url.includes('pooler')) {
    const hasQuery = url.includes('?')
    if (!url.includes('pgbouncer=true')) {
      url += (hasQuery ? '&' : '?') + 'pgbouncer=true'
    }
    if (!url.includes('connection_limit')) {
      url += '&connection_limit=1'
    }
    process.env.DATABASE_URL = url
    console.log('Optimized DATABASE_URL for connection pooling during build')
  }
}

try {
  console.log('Starting custom Vercel build process...')

  // 1. Database synchronization
  try {
    console.log('Running Prisma db push...')
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' })
  } catch (error) {
    console.error('Prisma db push failed, but continuing:', error.message)
  }

  // 2. Seeding
  try {
    console.log('Running seed script...')
    execSync('node scripts/seed.js', { stdio: 'inherit' })
  } catch (error) {
    console.error('Seeding failed, but continuing:', error.message)
  }

  // 3. The actual Next.js build
  console.log('Running Next.js build...')
  execSync('npm run build', { stdio: 'inherit' })

  console.log('Vercel build process completed successfully.')
} catch (error) {
  console.error('Vercel build process failed:', error)
  process.exit(1)
}
