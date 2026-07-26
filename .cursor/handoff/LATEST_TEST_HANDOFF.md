# Latest test handoff — Per-page editable voice coach pickers

**Branch:** `main`  
**Scope:** frontend

## Change

기록 카드·추천 결과 페이지 음성 카운트 picker 다시 **터치·스크롤 편집 가능**.

- 카운트 시작 시 **해당 카드/페이지 picker 값** 사용 (설정값 아님)
- 목표 횟수 / 카운트 간격 / 원모어 / 버텨 시간 → 패널별 로컬 state
- 마이페이지 > 설정은 **최초 표시 기본값**만 (picker 변경은 설정에 저장 안 함)

## Test focus

1. 기록 카드에서 picker 스크롤 → 카운트 시작 → 변경값 반영
2. 추천 결과 페이지에서도 동일
3. 설정에서 다른 값으로 바꿔도 **이미 열린 카드 picker는 유지**
4. 서로 다른 기록 카드는 picker 값 독립

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: 변경 없음
