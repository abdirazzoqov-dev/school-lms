#!/usr/bin/env node
// Build script: generate Prisma client + compile Next.js.
// Schema sync intentionally skipped here — done in start.js after deploy
// to avoid "too many clients" on Railway's free-tier Postgres.
'use strict'

const { execSync } = require('child_process')

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' })
}

// Ensure DIRECT_URL fallback
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  console.log('[build] DIRECT_URL not set — using DATABASE_URL as fallback')
  process.env.DIRECT_URL = process.env.DATABASE_URL
}

console.log('[build] Generating Prisma Client...')
run('npx prisma generate')

console.log('[build] Building Next.js...')
run('npx next build')
