# Test handoff — 80개 공통 머신 주의사항·사용팁 교체

## Summary
80개 공통 기구의 주의사항 3줄·사용팁 6줄(한/영)을 기존 카탈로그 문구 대신 이번에 주신 내용으로만 넣었습니다.

## Test focus
1. 체스트 프레스 추천 결과: 주의 3개, 사용팁 6개, 첫 주의가 시트/손잡이 가슴 중간 높이
2. 랫풀다운: 바를 목 뒤로 당기지 않는다
3. 스미스/파워랙/하프랙도 새 주의·팁이 보임
4. 예전 사이벡스식 긴 주의문구는 더 이상 나오지 않음
5. **Render migrate 151 + backend 재배포 필요** (프론트만으로는 DB 카탈로그가 안 바뀜. 백엔드 상수는 재배포 후 바로 적용)

## Fast checks
- `npx tsx shared/src/constants/standard-machine-coaching.test.ts`
- `database/migrations/151_replace_standard_machine_coaching.sql` contains `STD_CHEST_PRESS`
- `shared/src/constants/standard-machine-coaching.ts` contains `시트를 조절해 손잡이가 가슴 중간 높이에 오도록 한다.`

## As-is → To-be
- as-is: 브랜드별 긴 카탈로그 주의/팁 또는 빈 값
- to-be: 제출하신 80개 공통 문구만 표시

**Branch:** `main`  
**Commit:** pending
