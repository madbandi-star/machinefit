# Test handoff — 세부기구 추천 주의사항 복구

## Summary
공통 머신에 시트/핸들만 넣고 주의사항이 빈 `{}`로 남으면서, 예전에 나오던 주의 문구가 가려졌습니다. 같은 유형의 카탈로그 주의사항을 다시 쓰고, 빈 값은 저장하지 않습니다.

## Test focus
1. 세부기구 추천 결과 페이지 상단에 **주의** 목록이 다시 보이는지
2. 체스트 프레스 공통/브랜드 복사본: 어깨 불편 시 중단 등 기존 주의 문구
3. 스미스 / 파워랙: 카탈로그에 주의가 없으면 숨김 유지
4. 브랜드 전용 주의사항이 있던 머신은 기존 문구 유지
5. **Render migrate 150 + backend 재배포 필요**

## Fast checks
- `npx tsx backend/server/utils/localize.util.test.ts`
- `database/migrations/150_restore_standard_machine_coaching.sql` contains `standard_type_id`
- `backend/server/services/recommendation.service.ts` contains `firstLocalizedRecord`
- `backend/server/repositories/recommendation.repository.ts` contains `findTypeCoaching`

## As-is → To-be
- as-is: 추천 결과에 주의사항 없음 (중량/횟수/가동범위만)
- to-be: 예전에 나오던 기구별 주의사항이 결과 페이지에 다시 표시

**Branch:** `main`  
**Commit:** pending
