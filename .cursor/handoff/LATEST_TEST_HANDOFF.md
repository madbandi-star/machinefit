# Latest test handoff — Remove achievement popup snooze checkbox

**Branch:** `main`

## Change

업적 unlock 팝업에서 **오늘 다시 안 보기** 체크박스 제거.

## Test focus

- 업적 페이지 팝업에 snooze 체크박스 없음
- 공유 / 완료 / 닫기 버튼 정상
- 페이지 상단 팝업 설정 토글은 유지

## Fast checks

```bash
npm run build --prefix frontend
```
