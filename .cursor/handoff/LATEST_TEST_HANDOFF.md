# Test handoff — Standard image caption + first-time onboarding

## Summary
공통 사진에 **항상 보이는 한 줄** 캡션을 추가하고, 처음 보일 때만 안내 다이얼로그를 띄웁니다.

## Fast checks
```bash
cd frontend && npx vitest run src/utils/standardMachineImageOnboarding.test.ts src/utils/catalogAssets.resolveMachineImageUrl.test.ts
```

## Manual
1. `localStorage.removeItem('machinefit.seenStandardImageHint')` 후 새로고침
2. 공통 사진이 있는 홈/검색 → 안내 모달 1회
3. 확인 후 재방문 시 모달 없음, 캡션은 유지

## As-is → To-be
- **As-is:** 배지만 (툴팁은 길게 누르기 불가)
- **To-be:** 캡션 상시 노출 + 첫 1회 온보딩
