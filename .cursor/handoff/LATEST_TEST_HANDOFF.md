# Test handoff — My Page section rename

## Summary
My Page section title `myPage.explore` is now 커뮤니티 (Community / コミュニティ / 社区), not 더보기.

## Test focus
1. My Page: heading under account/explore block reads 커뮤니티
2. EN locale: Community

## as-is → to-be
- as-is: 더보기
- to-be: 커뮤니티

## Fast checks
```
rg "explore" frontend/src/i18n/locales/ko/common.json
```
