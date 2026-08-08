# Test handoff: Draggable full-mode motivation music player

## Summary
동기부여 음악 플레이어 전체 모드에서도 소형(미니)처럼 드래그로 위치를 옮길 수 있게 했습니다. 전체 모드는 상단 타이틀 바를 핸들로 쓰고, 미니와 위치를 공유합니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 전체 모드: 상단 타이틀 바 드래그로 위치 이동·저장
2. 플레이리스트 스크롤은 그대로 동작
3. 미니로 줄였다/펼쳐도 위치 유지(클램프)
4. 버튼(닫기/최소화)은 드래그와 충돌 없음

## Fast checks
```bash
rg -n "musicPanelOpen|top--drag|mf-music-shell" frontend/src/components/motivation/MotivationMediaControls frontend/src/styles/float-drag.css
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 전체 모드 위치 고정 | 상단 바 드래그로 이동 가능 |
