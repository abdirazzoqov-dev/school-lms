#!/usr/bin/env node

/**
 * Setup environment variables for build
 * If DIRECT_URL is not set, copy DATABASE_URL to DIRECT_URL
 */

if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  console.log('⚠️  DIRECT_URL not found, using DATABASE_URL as fallback')
  process.env.DIRECT_URL = process.env.DATABASE_URL
}

console.log('✅ Environment setup complete')

