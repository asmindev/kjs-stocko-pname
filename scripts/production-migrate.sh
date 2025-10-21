#!/bin/bash

# Production Migration Script
# Safely migrate Prisma schema changes to production

set -e  # Exit on error

echo "🚀 Starting Production Migration Process..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

echo ""
echo "📊 Step 1: Pre-Migration Checks"
echo "--------------------------------"

# Check if database is accessible
echo "Checking database connection..."
npx prisma db execute --stdin <<EOF > /dev/null 2>&1 && echo -e "${GREEN}✓ Database connected${NC}" || { echo -e "${RED}✗ Database connection failed${NC}"; exit 1; }
SELECT 1;
EOF

# Check pending migrations
echo "Checking migration status..."
MIGRATION_STATUS=$(npx prisma migrate status 2>&1)
echo "$MIGRATION_STATUS"

echo ""
echo "⚠️  IMPORTANT: Backup Recommendations"
echo "--------------------------------"
echo "Before proceeding, ensure you have:"
echo "1. Full database backup (pg_dump)"
echo "2. Application backup (code snapshot)"
echo "3. Rollback plan ready"
echo ""

# Prompt for confirmation
read -p "Do you want to continue with the migration? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Migration cancelled by user${NC}"
    exit 0
fi

echo ""
echo "🔍 Step 2: Data Integrity Check"
echo "--------------------------------"

# Check for orphan products
echo "Checking for orphan products..."
npx prisma db execute --stdin <<EOF
SELECT
    COUNT(*) as orphan_count,
    CASE
        WHEN COUNT(*) > 0 THEN 'WARNING: Found orphan products with session_id = NULL'
        ELSE 'OK: No orphan products found'
    END as status
FROM "Product"
WHERE session_id IS NULL;
EOF

# Check sessions with products
echo ""
echo "Checking sessions with products..."
npx prisma db execute --stdin <<EOF
SELECT
    COUNT(DISTINCT s.id) as sessions_with_products
FROM "Session" s
INNER JOIN "Product" p ON p.session_id = s.id;
EOF

echo ""
echo "📦 Step 3: Deploying Migration"
echo "--------------------------------"

# Deploy migration
echo "Running migration..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration deployed successfully${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    exit 1
fi

echo ""
echo "🔄 Step 4: Generating Prisma Client"
echo "--------------------------------"

npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${RED}✗ Prisma Client generation failed${NC}"
    exit 1
fi

echo ""
echo "✅ Step 5: Post-Migration Verification"
echo "--------------------------------"

# Verify constraint
echo "Verifying new constraint..."
npx prisma db execute --stdin <<EOF
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'Product'::regclass
  AND conname = 'Product_session_id_fkey';
EOF

echo ""
echo "================================================"
echo -e "${GREEN}✓ Migration completed successfully!${NC}"
echo "================================================"
echo ""
echo "📝 Next Steps:"
echo "1. Restart your application"
echo "2. Monitor logs for any errors"
echo "3. Test critical features"
echo "4. Keep this backup: $BACKUP_FILE (if created)"
echo ""
echo "⚠️  Rollback Instructions (if needed):"
echo "1. Stop application"
echo "2. Restore backup: psql -U user -d database < $BACKUP_FILE"
echo "3. Revert code: git checkout <previous-commit>"
echo "4. Restart application"
echo ""
