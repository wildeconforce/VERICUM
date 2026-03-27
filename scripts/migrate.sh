#!/bin/bash
# Vericum Database Migration Script
# Usage: ./scripts/migrate.sh
#
# Runs all Supabase migrations in order.
# Requires: SUPABASE_DB_URL or supabase CLI configured

set -euo pipefail

MIGRATIONS_DIR="$(dirname "$0")/../supabase/migrations"

echo "=== Vericum Database Migration ==="
echo ""

# Check if supabase CLI is available
if command -v supabase &> /dev/null; then
  echo "Using Supabase CLI..."
  supabase db push
  echo ""
  echo "Migration complete!"
  exit 0
fi

# Fallback: use psql directly
if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "ERROR: Neither 'supabase' CLI nor SUPABASE_DB_URL found."
  echo ""
  echo "Option 1: Install supabase CLI and run 'supabase db push'"
  echo "Option 2: Set SUPABASE_DB_URL and re-run this script"
  echo ""
  echo "  export SUPABASE_DB_URL='postgresql://postgres:password@db.xxx.supabase.co:5432/postgres'"
  echo "  ./scripts/migrate.sh"
  exit 1
fi

echo "Using psql with SUPABASE_DB_URL..."
echo ""

for migration in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  filename=$(basename "$migration")
  echo "  Running: $filename"
  psql "$SUPABASE_DB_URL" -f "$migration" -q 2>&1 | while read -r line; do
    # Suppress NOTICE messages, show errors
    if echo "$line" | grep -qi "error"; then
      echo "    ERROR: $line"
    fi
  done
done

echo ""
echo "All migrations applied!"
