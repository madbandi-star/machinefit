# Latest test handoff — Easy mode duplicate recommendation guard

**Branch:** `main`

## Change

이지모드에서 **오늘 이미 추천한 기구** 중복 선택·추천 차단 (보통 모드와 동일 로직).

- 기구 피커 확인 시 중복 → 토스트 + 피커 유지 → 다른 기구 선택
- 「다음: 추천 보기」 전에도 중복 검사
- `assertNoDuplicateToday` 공통 유틸로 추출

## Test focus

1. 이지모드 → 오늘 추천 완료한 기구 다시 선택 → 차단 메시지
2. 다른 기구 선택 → 정상 진행
3. 보통 모드 추천 중복 차단 회귀 없음

## Fast checks

```bash
npm run build --prefix frontend
npm run test:smoke:changed
```

## as-is → to-be

| As-is | To-be |
|-------|-------|
| Easy mode allows same-machine recommend twice today | Blocked at pick + recommend |
