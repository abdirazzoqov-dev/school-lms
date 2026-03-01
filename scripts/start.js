#!/usr/bin/env node
// Start script: sync DB schema, then launch Next.js server.
// Using Node.js avoids Windows CRLF line-ending issues in bash scripts.
'use strict'

const { execSync } = require('child_process')

function run(cmd, opts) {
  execSync(cmd, { stdio: 'inherit', ...opts })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  // ── 1. Schema sync with retry ────────────────────────────────────────────
  const maxAttempts = 5
  let synced = false

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      run('npx prisma db push --accept-data-loss --skip-generate')
      synced = true
      break
    } catch {
      if (attempt < maxAttempts) {
        const wait = attempt * 10
        console.log(`[start] Schema sync attempt ${attempt} failed — retrying in ${wait}s...`)
        await sleep(wait * 1000)
      } else {
        console.log('[start] Schema sync failed after all attempts — starting server anyway (schema may already be in sync).')
      }
    }
  }

  if (synced) console.log('[start] Schema in sync.')

  // ── 2. Launch Next.js ────────────────────────────────────────────────────
  console.log('[start] Starting Next.js server...')
  run('npx next start')
}

main().catch(err => {
  console.error('[start] Fatal error:', err)
  process.exit(1)
})
