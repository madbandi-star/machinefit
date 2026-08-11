# Test handoff — Privacy copy + admin audit + refresh token disclosure

## Summary
Privacy policy now discloses SMTP/Resend, banner click user_id, and refresh token storage (HttpOnly cookie + sessionStorage). Admin mutations for user role, banners, notices, and coupons write `admin_audit_logs`. Security notice matches actual refresh storage (not cookie-only).

## Test focus
1. /privacy s1 mentions banner events + sessionStorage refresh; s4 mentions SMTP/Resend
2. /legal/security s2 describes memory access token + cookie + sessionStorage fallback
3. Admin PATCH user role → admin_audit_logs action `admin.user.update`
4. Admin create/delete banner, notice, coupon → matching audit actions
5. Existing users with privacyVersion 2026-08-11 are prompted to re-accept privacy (version 2026-08-12)

## as-is → to-be
- as-is: processors/token storage omitted; role/banner/notice/coupon unaudited; security said HttpOnly-only
- to-be: disclosed; audited; docs match Pages→Render cookie fallback

## Fast checks
`rg -n "writeAdminAudit|admin.user.update|SMTP 또는 Resend|sessionStorage" backend frontend/src/i18n/locales/ko/common.json`
