# Test handoff — My templates under Personal settings

## Summary
My templates moved from My Page 커뮤니티 to 개인설정, above Settings.

## Test focus
1. 커뮤니티 no longer lists 내 템플릿
2. 개인설정 first item is 내 템플릿, then 설정

## as-is → to-be
- as-is: 내 템플릿 in 커뮤니티
- to-be: 내 템플릿 in 개인설정 above 설정

## Fast checks
```
rg MY_TEMPLATES frontend/src/pages/my-page/MyPage.tsx -B 5 -A 8
```
