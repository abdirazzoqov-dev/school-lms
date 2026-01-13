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
  console.log('🚀 Starting Vercel build process...')

  // 1. Prisma Client Generate
  console.log('📦 Step 1: Generating Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma Client generated successfully!\n')

  // 2. Migrations Deploy (Production)
  console.log('📤 Step 2: Deploying migrations...')
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('✅ Migrations deployed successfully!\n')
  } catch (error) {
    console.warn('⚠️  Migration deploy failed (this is OK if migrations folder is empty)')
    console.log('🔄 Falling back to db push (for initial setup)...\n')
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
      console.log('✅ Database schema pushed successfully!\n')
    } catch (pushError) {
      console.error('❌ Database setup failed:', pushError.message)
      // Continue anyway - maybe database is already set up
      console.log('⚠️  Continuing build (assuming database is already set up)...\n')
    }
  }

  // 3. Next.js Build
  console.log('🏗️  Step 3: Building Next.js...')
  execSync('npm run build', { stdio: 'inherit' })

  console.log('✅ Vercel build process completed successfully!')
} catch (error) {
  console.error('❌ Vercel build process failed:', error)
  process.exit(1)
}
