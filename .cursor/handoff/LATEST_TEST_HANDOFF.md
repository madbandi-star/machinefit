# Test handoff — CASE legal/privacy/ops sweep

## Summary
Remaining CASE rows are closed in code: marketing-gated banners (no user_id), HMAC media URLs, cookie CSRF Origin, unlicensed HS/wordmark PNGs hidden, legal footers on guest/login/easy, admin audit on remaining mutations, banner-event 90-day purge, refund restriction copy, Inter/Lucide + placeholder copyright. Business registration numbers are still blank on purpose (footer pending notice).

## Test focus
1. Guest home + `/login`: legal footer links (terms/privacy/refund/copyright) visible
2. Marketing opt-out: home BannerSlot hidden; opt-in: banners show; click log has no user_id
3. Photo/trade/request image URL without `mexp`/`msig` → 401
4. Hammer Strength catalog tiles use placeholder/SVG, not packaged product PNG
5. Cookie refresh from a foreign Origin → 403 `CSRF_REJECTED`
6. Admin: change user role / create coupon / notice — row in admin audit logs

## as-is → to-be
- as-is: CASE table still “부분/문제” (banner user_id, unauth photos, no guest footer, PNG catalog, thin terms)
- to-be: those items code-closed; 사업자번호 still 운영 기입; 법률 입증(DOB 자가신고) is out of scope

## Fast checks
```
npm run i18n:audit
npx tsx --test backend/server/utils/csrf-origin.util.test.ts backend/server/utils/media-token.util.test.ts backend/server/services/age-verification.service.test.ts
```
