# Latest test handoff — Easy mode / lifted weight / history date UI

**Branch:** `main`

## Change

1. **이지모드 3/3 기록** — 세트 수 스테퍼가 화면 밖으로 나가지 않도록 레이아웃 수정
2. **누적 무게** — `[나][헬스장][전체]` 탭을 **누적 무게** 타이틀 우측으로 이동
3. **기록 페이지** — 일자 하루 선택 시 **일자조회** 좌측 날짜·요일·부위 문구 제거

## Test focus

1. Easy mode → 3단계 → 세트 수 +/- 가 한 화면 안에 표시
2. `/my-page/lifted-weight` — `누적 무게 [나][헬스장][전체]` 헤더
3. `/records?tab=history` — 날짜 1일 선택 → 일자조회 왼쪽 텍스트 없음

## Fast checks

```bash
npm run build --prefix frontend
npm run test:smoke:changed
```

## as-is → to-be

| Area | As-is | To-be |
|------|-------|-------|
| Easy step 3 | Set count overflows right | Fits in toolbar grid |
| Lifted weight | Mode tabs below header | Tabs beside title |
| History date filter | `2026년 7월 26일(일) 가슴 등` before 일자조회 | Empty (button only) |
