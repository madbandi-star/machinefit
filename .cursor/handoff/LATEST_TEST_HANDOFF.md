# Admin privacy-rights nav Korean label

## Summary
Admin sidebar used missing `admin` ns key `compliance.rights.admin.nav` (raw key). Added locale strings so KO shows **개인정보 권리행사 관리**.

## Git
- branch: `main`
- commit: `b55d85b4`

## Test focus
1. Admin → 커뮤니티·서비스: menu label is `개인정보 권리행사 관리`

## Fast checks
```bash
rg -n "개인정보 권리행사 관리" frontend/src/i18n/locales/ko/admin.json
```

## as-is → to-be
- **as-is:** `compliance.rights.admin.nav` raw key
- **to-be:** `개인정보 권리행사 관리`
