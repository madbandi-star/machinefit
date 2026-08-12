# Test handoff — My Page menu: points under templates

## Summary
마이페이지에서 내 헬창력을 개인설정의 내 템플릿 아래로 이동. 템플릿 공유관 아이콘을 `share`로 변경(기구요청 `dumbbell`과 구분).

## Test focus
1. 개인설정: 내 템플릿 → 내 헬창력 → 설정…
2. 둘러보기: 템플릿 공유관 아이콘 ≠ 기구요청

## Fast checks
```
rg -n "MY_TEMPLATES|POINTS|TEMPLATE_SHARE" frontend/src/pages/my-page/MyPage.tsx
```
