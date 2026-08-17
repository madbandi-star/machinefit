# Test handoff — Motivation media player stability

## Summary
동기부여 음악/동영상: 플레이어 UI 즉시 표시 + `await play()` 성공 확인, 실패 시 원인별 Toast. 싱글톤 Audio + Media Session, unmount 시 pause 제거.

## Test focus
1. 음악 버튼 → 패널 즉시 표시
2. 재생 실패 Toast (네트워크 OFF 등)
3. 페이지 이동 중 음악 유지
4. 동영상 버튼 → 오버레이 즉시 + YouTube 재생

## As-is → To-be
- as-is: play 실패 시 무반응/상태 불일치
- to-be: UI 유지 + 실제 재생 상태 + Toast
