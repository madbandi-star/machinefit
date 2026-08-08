# Test handoff: Records card detail affordance (chevron cues)

## Summary
기록 카드의 기구 이미지·이름에 작은 chevron/밑줄 affordance를 넣어 상세기록으로 이동 가능함을 텍스트 없이 드러냈습니다.

## Git
- Branch: `main`
- Commit: `ef944380`

## Test focus
1. 기록 카드 썸네일 우하단에 ? 칩 표시
2. 기구 이름에 얇은 밑줄 + ? 표시
3. 탭 시 상세기록 페이지 이동 유지
4. 화면 문구 추가 없음(aria만)

## Fast checks
```bash
rg -n "thumb-cue|title-cue|openDetailAria" frontend/src/components/records/HistoryRecordCard frontend/src/styles/records.css frontend/src/styles/history-premium.css frontend/src/i18n/locales/ko/machines.json
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 이미지/이름이 링크처럼 안 보임 | chevron·밑줄로 상세 이동 가능 |
