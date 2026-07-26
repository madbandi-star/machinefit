# Latest test handoff — Settings menu reorder

**Branch:** `main`

## Change

마이페이지 설정 메뉴 순서 조정:

1. **음성 카운트** → 중량 난이도 **위**로 이동
2. **휴식 시간** → 음성 카운트 **아래**로 이동

신체 정보·지역 설정 아래 순서: **음성 카운트 → 휴식 시간 → 중량 난이도 → 단위 설정 → …**

(이전 handoff: 운동 목표를 신체 정보에 통합 — 미커밋 시 함께 포함)

## Test focus

1. 설정 페이지 섹션 순서 확인
2. 각 섹션 내용·저장 동작 변화 없음

## Fast checks

```bash
npm run build --prefix frontend
```
