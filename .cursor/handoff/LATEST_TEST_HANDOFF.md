# Test handoff — Rename and reorder My brands on My Page

## Summary
My Page personal settings: brand favorites renamed to **내 브랜드** / My brands and placed directly under My templates.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. My Page → 개인설정 order: 내 템플릿 → 내 브랜드 → 설정.
2. Page title on brand favorites route is 내 브랜드.

## Fast checks
```bash
rg -n "MY_TEMPLATES|BRAND_FAVORITES|내 브랜드|My brands" frontend/src/pages/my-page/MyPage.tsx frontend/src/i18n/locales/ko/common.json
```

## Deploy
Frontend Pages only.
