# Test handoff: Motivation music X closes and stops playback

## Summary
동기부여 음악 플레이어 우측 상단 X는 소형으로 접히지 않고 재생을 중지한 뒤 플레이어를 닫습니다. 최소화(Minimize) 버튼은 기존처럼 소형 플레이어로 전환합니다.

## Git
- Branch: `main`
- Commit: `f0df99ee`

## Test focus
1. 음악 전체 패널에서 X → 음악 중지 + 패널 닫힘 (소형으로 안 바뀜)
2. 전체 패널 Minimize → 소형 플레이어 + 재생 유지
3. 소형 플레이어 X → 음악 중지 + 소형 UI 닫힘

## Fast checks
```bash
rg -n "dismissMusicPanel|stopMusic\(\)" frontend/src/components/motivation/MotivationMediaControls/MotivationMediaControls.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 전체 패널 X → 소형 전환 + 음악 계속 재생 | X → 음악 종료 + 플레이어 종료 (Minimize만 소형 유지) |
