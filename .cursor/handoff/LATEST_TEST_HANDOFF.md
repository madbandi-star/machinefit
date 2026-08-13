# Test handoff — Auth landing language segmented switch

## Summary
로그인/게스트 랜딩 언어 선택을 드롭다운 → 한국어|English 세그먼트 토글로 교체. 헤더/설정 compact·default는 기존 유지.

## Test focus
1. `/`·`/login` 우상단: 세그먼트 2버튼, 활성은 흰 필
2. 탭 시 즉시 언어 전환
3. 헤더 언어 피커는 기존 드롭다운 유지

## Fast checks
```
rg -n "language-picker__seg|language-picker--landing" frontend/src/components/settings/LanguageSelector/LanguageSelector.tsx frontend/src/styles/components.css
```

## As-is → To-be
- as-is: 드롭다운 + chevron (한국어 한 줄)
- to-be: 세그먼트 토글 한국어 | English
