# Admin category correct/delete for privacy rights

## Summary
Admins can apply member-requested **correction** and **deletion categories** from `/admin/privacy-rights` (Actual apply panel). Members select deletion categories when filing.

## Git
- branch: `main`
- commit: 7529a1db

## How to use (admin)
1. Open `/admin/privacy-rights`
2. Open a `deletion` or `correction` request
3. Use **���� �ݿ�** panel:
   - Deletion: check categories �� Delete selected
   - Correction: field + value �� Apply correction
4. Optionally mark completed

## Fast checks
```bash
rg -n "adminFulfillPrivacyRightsRequest|delete_categories" backend/server frontend/src
```

## As-is �� To-be
- **As-is:** Status-only ticket handling
- **To-be:** Category/field apply against live user data + audit log

## Note
Backend change ? **Render redeploy** required.
