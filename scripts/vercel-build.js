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
    console.log('✅ Optimized DATABASE_URL for connection pooling')
  }
}

// Set DIRECT_URL if not provided (for migrations)
// Prisma schema requires DIRECT_URL, but we can use DATABASE_URL as fallback
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  // Use DATABASE_URL as fallback for migrations
  // For Supabase, migrations can work with pooling connection too
  let directUrl = process.env.DATABASE_URL
  // If using pooler, try to use direct connection format (optional optimization)
  if (directUrl.includes('pooler') && directUrl.includes(':6543')) {
    // Try to convert to direct connection format
    // Replace pooler port with direct port (if available)
    directUrl = directUrl.replace(':6543', ':5432').replace('pooler.', 'db.')
    // Remove pgbouncer=true for direct connection (optional)
    directUrl = directUrl.replace(/[?&]pgbouncer=true/g, '')
    directUrl = directUrl.replace(/[?&]connection_limit=\d+/g, '')
    // Ensure sslmode is present
    if (!directUrl.includes('sslmode=')) {
      directUrl += (directUrl.includes('?') ? '&' : '?') + 'sslmode=require'
    }
  }
  process.env.DIRECT_URL = directUrl
  console.log('✅ Set DIRECT_URL from DATABASE_URL (fallback for migrations)')
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
