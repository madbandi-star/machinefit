# Test handoff — My Page community section order

## Summary
My Page section order is now 머신핏 인사이트 → 커뮤니티 → 개인설정.

## Test focus
1. Scroll My Page: Community sits between Insights and Personal settings

## as-is → to-be
- as-is: Insights → Personal settings → Community
- to-be: Insights → Community → Personal settings

## Fast checks
```
rg "quickLinks|explore|personalSettings" frontend/src/pages/my-page/MyPage.tsx
```
