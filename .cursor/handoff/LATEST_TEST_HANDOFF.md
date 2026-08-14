# Test handoff ? Fortune share footer under advice box

## Summary
헬창운세 공유 카드의 좌측 로고·우측 해시태그를 카드 맨 아래가 아니라 **한줄조언 박스 바로 아래**로 붙임.

## Git
- Branch: `main`
- Commit: _1aa90d44_

## Test focus
공유 PNG에서 조언 박스 직후 로고(좌)·태그(우) 위치 확인

## As-is → To-be
- **As-is:** 하단 여백에 떠 있음 (`H - 96`)
- **To-be:** `quoteY + quoteH + 44`
