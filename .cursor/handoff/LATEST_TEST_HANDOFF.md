# Test handoff — Hellpower RPG growth UI

## Summary
내 헬창력(`/points`)을 캐릭터 성장 화면으로 재설계. 등급 계산·적립 API는 기존 `HELLPOWER_LEVELS` / `getHellpowerLevel` 유지.

## Fast checks
```bash
node --import tsx shared/src/constants/hellpower-levels.test.ts
npm run typecheck --prefix frontend
```

## As-is → To-be
- **As-is:** 텍스트 중심 잔액/내역
- **To-be:** HERO + XP BAR + NEXT + 등급표 시트 + 오늘 획득 + 레벨업 피드백
