# Test handoff — Easy mode picker favorite hearts

## Summary
이지모드 「기구찾기」 목록에 검색 페이지 추천머신과 동일한 ♥ 즐겨찾기 버튼을 표시.

## Test focus
1. 이지모드 → 기구찾기
2. 목록 각 행 오른쪽에 ♥ 표시
3. ♥ 탭 → 추가/해제 (행 클릭과 분리)
4. 행 본문 탭 → 상세는 기존과 동일

## Fast checks
```
rg -n "showFavorite|useFavoritesList|favoriteByCode" frontend/src/components/easy-mode/EasyMachinePicker.tsx
```

## As-is → To-be
- **as-is**: 이지모드 기구찾기 목록에 하트 없음 (`onSelect` 시 `showFavorite` 기본 false)
- **to-be**: `showFavorite` + favorites 시드로 검색과 동일 UX

## Deploy note
Frontend only (Pages).
