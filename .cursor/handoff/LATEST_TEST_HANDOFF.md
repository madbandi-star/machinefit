# Test handoff: Traditional-structure Helchang Fortune engine (v2)

## Summary
생년월일·탄생시·오늘 날짜로 전통 운세 요소(엔터테인먼트 구조형)를 계산한 뒤, **핵심 기운 1개** → 스토리 → 운동운/추천으로 파생하도록 엔진을 교체했습니다. UI에 기운 흐름 스트립·세부 점수·「운세 자세히」를 추가했습니다.

## Git
- Branch: `main`
- Commit: `PENDING`

## Test focus
1. 동일 birth+date → 동일 `coreTheme` / narrative
2. `RECOVERY_RESET`인데 PR_DAY + 높은 PR운이 나오지 않음
3. `/fortune/today`에 기운 흐름·핵심 기운·자세히 보기 표시
4. volume/focus/change 점수 존재, 추천이 테마와 모순되지 않음
5. 운동 로그 없어도 운세 생성

## Fast checks
```bash
npx tsx shared/src/fortune/traditional/traditional.test.ts
cd shared && npm run build
cd frontend && npx tsc -p tsconfig.json --noEmit
node scripts/i18n-audit.mjs --sync
```

## Production checks
- Frontend Pages + **Render backend** 재배포 후 `/fortune/today` 확인 (narrative API 필드 필요)

## as-is → to-be
- as-is: 카탈로그 독립 RNG, 전통 계층 없음
- to-be: 전통 구조 → 핵심 기운 1개 → 일관된 운동 운세
