# Test handoff — Profile consent required-row cards

## Summary
지역·헬스장(및 동일 블록) 필수 동의 3행을 캡처처럼 카드형으로 바꿨습니다. 문구·로직은 그대로입니다.

## Test focus
1. 설정 → 지역·헬스장 저장 전 동의 영역
2. 목적 / 보유·파기 / 권리 3행: 체크 · 필수 · 문구 · 우측 아이콘
3. 체크 시 초록 하이라이트
4. 신체/출생 동의 블록도 같은 스타일인지

## Fast checks
```
rg profile-consent__row-icon frontend/src/styles/profile-data-consent.css
rg "FileText|CalendarDays|ShieldUser" frontend/src/components/settings/ProfileDataConsentBlock/ProfileDataConsentBlock.tsx
```

## as-is → to-be
- as-is: 단순 체크+배지+텍스트
- to-be: 테두리 카드 + 우측 아이콘(문서/달력/방패)
