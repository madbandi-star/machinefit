# Test handoff — Guide copy readability UI

## Summary
안내글 **문구는 그대로** 두고, 문단 분리·줄간격·제목 구분·주의 박스만 적용했습니다. 약관/개인정보/설정 안내/푸터 쿠키 고지가 한 덩어리로 보이지 않아야 합니다.

## Test focus
1. `/terms`, `/privacy`, `/commerce` — 문장 내용은 동일, 문단이 나뉨, 주의 문장은 왼쪽 강조 박스
2. 설정 → 회원탈퇴 확인 — `•` 항목이 목록, 왼쪽 정렬
3. 페이지 하단 쿠키 안내 — 2~3문단, 좌우 여백
4. 모바일 폭에서 본문이 화면 끝에 붙지 않고 line-height가 넉넉함

## Fast checks
```
npx tsx frontend/src/utils/splitGuideBlocks.test.ts
rg GuideProse frontend/src/pages/legal frontend/src/components/content/GuideProse
```

## as-is → to-be
- as-is: 안내글이 한 덩어리 `<p>` (line-height 1.55)
- to-be: 같은 문구를 GuideProse가 문단/목록/주의박스로 보여 줌
