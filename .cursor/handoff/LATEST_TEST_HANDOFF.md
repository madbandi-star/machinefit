# Test handoff — MEMBER 헬창력 30단 등급

## Summary
MEMBER 작성자만 헬창력 30단계 이모지를 이름 옆에 표시합니다. 클릭 시 칭호 + 상위% 팝오버. Premium은 **⚜️** 고정. 프로필/헬창력 페이지에 등급·점수·상위%·다음 등급을 표시합니다.

## Source of truth
`shared/src/constants/hellpower-levels.ts` → `HELLPOWER_LEVELS` / `getHellpowerLevel` / `getAuthorBadgeEmoji`

## Fast checks
```bash
npx tsx shared/src/constants/hellpower-levels.test.ts
```

## As-is → To-be
- **As-is:** member ⚔️, premium 🔱
- **To-be:** member = 🥚…🌈 (점수 구간), premium = ⚜️, 게시판에 점수 숫자 숨김

## Deploy
Frontend Pages + Render (shared/backend)
