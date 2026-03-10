#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#  Migrate Database from Neon → AWS RDS
#  Usage: ./migrate-db.sh <RDS_ENDPOINT> <RDS_PASSWORD>
# ═══════════════════════════════════════════════════════════════════════════════

set -e

RDS_ENDPOINT=$1
RDS_PASSWORD=$2
RDS_USERNAME="spacetoon_admin"
RDS_DB="spacetoon_pocket"

if [ -z "$RDS_ENDPOINT" ] || [ -z "$RDS_PASSWORD" ]; then
    echo "Usage: ./migrate-db.sh <RDS_ENDPOINT> <RDS_PASSWORD>"
    echo "Example: ./migrate-db.sh spacetoon-pocket-db.xxx.me-south-1.rds.amazonaws.com mypassword123"
    exit 1
fi

# Source (Neon)
NEON_URL="postgresql://neondb_owner:npg_bKtkL8EyCeX7@ep-crimson-wildflower-agqvsts7.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Target (RDS)
RDS_URL="postgresql://${RDS_USERNAME}:${RDS_PASSWORD}@${RDS_ENDPOINT}:5432/${RDS_DB}?sslmode=require"

echo "══════════════════════════════════════════════════════════"
echo "  🗄️  Database Migration: Neon → AWS RDS"
echo "══════════════════════════════════════════════════════════"

# Step 1: Export from Neon
echo ""
echo "📤 Step 1: Exporting from Neon..."
pg_dump "${NEON_URL}" --no-owner --no-acl --clean --if-exists > /tmp/neon_dump.sql
echo "  ✓ Export complete: $(wc -l < /tmp/neon_dump.sql) lines"

# Step 2: Import to RDS
echo ""
echo "📥 Step 2: Importing to RDS..."
psql "${RDS_URL}" < /tmp/neon_dump.sql
echo "  ✓ Import complete"

# Step 3: Run Prisma migrations (in case of schema differences)
echo ""
echo "🔄 Step 3: Running Prisma migrations..."
DATABASE_URL="${RDS_URL}" npx prisma migrate deploy
echo "  ✓ Migrations applied"

# Step 4: Verify
echo ""
echo "✅ Step 4: Verifying..."
TABLES=$(psql "${RDS_URL}" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
echo "  ✓ Tables in RDS: ${TABLES}"

# Cleanup
rm -f /tmp/neon_dump.sql

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  ✅ Migration Complete!"
echo ""
echo "  🗄️  New DATABASE_URL:"
echo "  ${RDS_URL}"
echo ""
echo "  📝 Update your .env and EC2 container with this URL"
echo "══════════════════════════════════════════════════════════"
