#!/bin/bash

# Setup DIRECT_URL if not set
if [ -z "$DIRECT_URL" ] && [ -n "$DATABASE_URL" ]; then
  echo "⚠️  DIRECT_URL not found, using DATABASE_URL as fallback"
  export DIRECT_URL="$DATABASE_URL"
fi

echo "✅ Environment setup complete"

# Run prisma commands
prisma db push --accept-data-loss && prisma generate && next build

