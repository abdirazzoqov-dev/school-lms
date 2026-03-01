#!/bin/bash
set -e

# Setup DIRECT_URL if not set
if [ -z "$DIRECT_URL" ] && [ -n "$DATABASE_URL" ]; then
  export DIRECT_URL="$DATABASE_URL"
fi

echo "🔄 Applying database schema..."

# Limit to 1 connection for schema sync to avoid saturating the pool
strip_qs() { echo "$1" | sed 's/[?&]connection_limit=[^&]*//g' | sed 's/[?&]pool_timeout=[^&]*//g'; }

RAW="$(strip_qs "$DATABASE_URL")"
SEP=$(echo "$RAW" | grep -q '?' && echo '&' || echo '?')
export DATABASE_URL="${RAW}${SEP}connection_limit=1&pool_timeout=30"

if [ -n "$DIRECT_URL" ]; then
  RAW2="$(strip_qs "$DIRECT_URL")"
  SEP2=$(echo "$RAW2" | grep -q '?' && echo '&' || echo '?')
  export DIRECT_URL="${RAW2}${SEP2}connection_limit=1&pool_timeout=30"
fi

# Retry up to 5 times with increasing back-off
for attempt in 1 2 3 4 5; do
  prisma db push --accept-data-loss --skip-generate && break
  echo "⚠️  Attempt $attempt failed. Waiting $((attempt * 10))s..."
  sleep $((attempt * 10))
  if [ "$attempt" -eq 5 ]; then
    echo "❌ Schema sync failed after 5 attempts — starting server anyway (schema may already be in sync)"
  fi
done

echo "🚀 Starting Next.js server..."
exec npx next start
