# Production Deployment Checklist

# Migration: Add onDelete Protection for Session

## Pre-Deployment

### 1. Backup ✓

-   [ ] Create full database backup
    ```bash
    pg_dump -h HOST -U USER -d DATABASE > backup_$(date +%Y%m%d_%H%M%S).sql
    ```
-   [ ] Verify backup file is not corrupted
    ```bash
    head -n 20 backup_*.sql
    ```
-   [ ] Store backup in safe location

### 2. Code Review ✓

-   [ ] Review middleware.js changes (OdooSession fix)
-   [ ] Review schema.prisma changes (onDelete: Restrict)
-   [ ] Review migration SQL file
-   [ ] Test in staging environment (if available)

### 3. Data Integrity Check ✓

-   [ ] Check for orphan products (session_id = NULL)
    ```sql
    SELECT COUNT(*) FROM "Product" WHERE session_id IS NULL;
    ```
-   [ ] Check sessions with products
    ```sql
    SELECT COUNT(*) FROM "Session" s
    INNER JOIN "Product" p ON p.session_id = s.id;
    ```
-   [ ] Document any anomalies

### 4. Maintenance Window ✓

-   [ ] Schedule maintenance window (if needed)
-   [ ] Notify users about deployment
-   [ ] Prepare rollback plan

---

## Deployment Steps

### 1. Stop Application (Optional)

```bash
# If you need zero downtime, skip this
pm2 stop your-app-name
```

### 2. Pull Latest Code

```bash
git pull origin main
git log --oneline -5  # Verify commits
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Check Migration Status

```bash
npx prisma migrate status
```

### 5. Deploy Migration

```bash
# Option A: Using script (recommended)
./scripts/production-migrate.sh

# Option B: Manual
npx prisma migrate deploy
npx prisma generate
```

### 6. Start Application

```bash
pm2 start your-app-name
# or
pm2 restart your-app-name
```

---

## Post-Deployment Verification

### 1. Application Health ✓

-   [ ] Application starts without errors
-   [ ] Check application logs
    ```bash
    pm2 logs your-app-name --lines 50
    ```
-   [ ] No database connection errors

### 2. Migration Verification ✓

-   [ ] Verify constraint is applied
    ```sql
    SELECT conname, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = 'Product'::regclass
      AND conname = 'Product_session_id_fkey';
    ```
-   [ ] Expected: `... ON DELETE RESTRICT ...`

### 3. Functional Testing ✓

-   [ ] Login/Logout works
-   [ ] Scanning products works
-   [ ] Session creation works
-   [ ] Product-Session relationship intact
-   [ ] No session_id becoming NULL

### 4. Database Integrity ✓

-   [ ] Check for new orphan products
    ```sql
    SELECT COUNT(*) FROM "Product"
    WHERE session_id IS NULL
      AND created_at > NOW() - INTERVAL '1 hour';
    ```
-   [ ] Should be 0 (or same as before)

---

## Monitoring (First 24 Hours)

### Metrics to Watch

-   [ ] Application error rate
-   [ ] Database query performance
-   [ ] Orphan products count
-   [ ] Failed login attempts
-   [ ] Session creation rate

### Queries for Monitoring

```sql
-- Orphan products created after deployment
SELECT COUNT(*), DATE(created_at)
FROM "Product"
WHERE session_id IS NULL
  AND created_at > 'DEPLOYMENT_TIME'
GROUP BY DATE(created_at);

-- Sessions without products (should decrease over time)
SELECT COUNT(*)
FROM "Session" s
LEFT JOIN "Product" p ON p.session_id = s.id
WHERE p.id IS NULL;
```

---

## Rollback Plan (If Needed)

### Signs You Need to Rollback

-   Application won't start
-   Database errors in logs
-   Data integrity issues
-   Critical feature broken

### Rollback Steps

1. **Stop Application**

    ```bash
    pm2 stop your-app-name
    ```

2. **Restore Database Backup**

    ```bash
    psql -h HOST -U USER -d DATABASE < backup_TIMESTAMP.sql
    ```

3. **Revert Code**

    ```bash
    git revert HEAD
    # or
    git checkout <previous-commit>
    ```

4. **Reinstall Dependencies**

    ```bash
    npm install
    npx prisma generate
    ```

5. **Start Application**

    ```bash
    pm2 start your-app-name
    ```

6. **Verify**
    - Check application starts
    - Check logs
    - Test critical features

---

## Success Criteria

✅ Migration deployed successfully
✅ No data loss
✅ Application running normally
✅ No increase in orphan products
✅ onDelete: Restrict constraint active
✅ Middleware fix preventing session deletion

---

## Contact Information

**Deployment Lead:** ******\_******
**Database Admin:** ******\_******
**On-Call Support:** ******\_******
**Escalation Contact:** ******\_******

---

## Notes

**Deployment Date:** ******\_******
**Deployment Time:** ******\_******
**Backup Location:** ******\_******
**Issues Encountered:** ******\_******
**Resolution:** ******\_******
