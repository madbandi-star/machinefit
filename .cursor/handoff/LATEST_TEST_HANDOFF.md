# Test handoff — Hellpower ladder rename

## Summary
헬창력 30단계 이모지·칭호만 교체. 점수 구간/계산 로직 변경 없음.

## Fast checks
```bash
node --import tsx shared/src/constants/hellpower-levels.test.ts
npm run build --prefix shared
```

## As-is → To-be
- **As-is:** 전투영웅·헬창의 신 등 RPG 칭호
- **To-be:** 득근 중·헬창 만렙 등 생활형 칭호
