const { execSync } = require('node:child_process')

const run = (command) => {
  execSync(command, { stdio: 'inherit' })
}

run('prisma generate')

if (process.env.DATABASE_URL) {
  run('prisma migrate deploy')
} else {
  console.warn('DATABASE_URL not set; skipping prisma migrate deploy.')
}

run('next build')
