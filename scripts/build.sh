#!/bin/bash
set -e

# Setup DIRECT_URL if not set
if [ -z "$DIRECT_URL" ] && [ -n "$DATABASE_URL" ]; then
  echo "⚠️  DIRECT_URL not found, using DATABASE_URL as fallback"
  export DIRECT_URL="$DATABASE_URL"
fi

echo "✅ Environment setup complete"

# ── Build only (no DB connection needed) ───────────────────────────────────────
# Schema sync (prisma db push) is intentionally NOT run here because:
#   - The build phase in Railway shares the Postgres connection pool with other
#     concurrent build workers, quickly hitting the free-tier "too many clients" limit.
#   - Schema is applied in the Start Command (scripts/start.sh) which runs after
#     the build in a clean, single-process environment.
echo "🔨 Building Next.js app..."
prisma generate && next build
