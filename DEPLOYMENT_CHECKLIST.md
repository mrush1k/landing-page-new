# Deployment Checklist

## Pre-Deployment Steps

### 1. Generate Prisma Migration
```bash






npx prisma generate
npx prisma migrate dev --name add_performance_indexes
```

### 2. Test Locally
```bash
# Install dependencies (if needed)
npm install

# Build the application
npm run build

# Test in development
npm run dev
```

### 3. Verify Changes
- [ ] Dashboard loads quickly
- [ ] Navigation between tabs is instant
- [ ] All invoices display correctly
- [ ] Customer list loads fast
- [ ] Settings page works
- [ ] PDF preview works (test on invoice/new page)
- [ ] Chatbot still loads (lazy loaded)
- [ ] Tutorial system works

---

## Production Deployment

### Step 1: Backup Database
```bash
# Backup your production database before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Deploy Code
```bash
# Push to your repository
git add .
git commit -m "Performance optimization: lazy loading, caching, database indexes"
git push origin main
```

### Step 3: Run Migration
```bash
# On production/staging environment
npx prisma migrate deploy
```

### Step 4: Verify Production
- [ ] Check application logs for errors
- [ ] Test main user flows:
  - [ ] Login/Signup
  - [ ] Create invoice
  - [ ] View customers
  - [ ] Generate reports
  - [ ] Settings page
- [ ] Monitor performance metrics
- [ ] Check database query times

---

## Rollback Plan (If Needed)

### If Application Has Issues:
```bash
# Revert code changes
git revert HEAD
git push origin main
```

### If Database Has Issues:
```bash
# Database indexes are non-destructive
# They can stay, or be removed with:
DROP INDEX IF EXISTS "users_email_idx";
DROP INDEX IF EXISTS "users_createdAt_idx";
# ... etc for all indexes
```

---

## Monitoring

### Key Metrics to Watch:
1. **Page Load Time**: Should be < 1.5 seconds
2. **API Response Time**: Should be < 100ms
3. **Database Query Time**: Should be < 50ms
4. **Error Rate**: Should be < 0.1%

### Tools:
- Next.js Analytics
- Browser DevTools (Network tab)
- Database query logs
- Application logs

---

## Post-Deployment

### Week 1:
- [ ] Monitor error logs daily
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Fix any issues quickly

### Week 2:
- [ ] Review analytics data
- [ ] Identify further optimization opportunities
- [ ] Document any issues found

---

## Common Issues & Solutions

### Issue: "prisma generate" fails
**Solution:**
```bash
npm install @prisma/client@latest
npx prisma generate
```

### Issue: Build fails with lazy component errors
**Solution:**
- Check import paths in `lazy-components.tsx`
- Ensure all exported components exist
- Clear `.next` folder and rebuild

### Issue: Database migration fails
**Solution:**
- Check database connection
- Verify DATABASE_URL is correct
- Run migration manually with SQL script

### Issue: Performance not improved
**Solution:**
- Clear browser cache
- Check if caching is enabled
- Verify indexes were created: `\di` in psql

---

## Success Criteria

✅ Dashboard loads in < 1 second
✅ Navigation feels instant
✅ All features work correctly
✅ No console errors
✅ Database queries < 50ms
✅ API responses < 100ms
✅ No user complaints

---

## Need Help?

1. Check `PERFORMANCE_OPTIMIZATION.md` for details
2. Review error logs in browser console
3. Check database logs for slow queries
4. Verify all migrations ran successfully

---

**Ready to Deploy! 🚀**
