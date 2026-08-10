# Test handoff — Admin data retention UI polish

## Summary
데이터 보존·삭제 관리 4화면 UI 정리: KPI/칩/구조화 행/상세 패널, 전용 CSS.

## Git
- branch: `main`
- commit: PENDING

## Changed files
- `frontend/src/pages/admin/data-retention/*.tsx` (4)
- `frontend/src/styles/admin-data-retention.css`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/admin.json`

## Test focus
1. 정책 목록 선택 → 상세/기간 변경
2. 삭제 예정 보류 (모바일 포함)
3. 이력·감사 로그 표시

## Fast checks
```bash
rg -n "admin-retention|AdminPanel" frontend/src/pages/admin/data-retention frontend/src/styles/admin-data-retention.css
```

## as-is → to-be
- **as-is:** 조밀한 테이블 + 영문 ON/OFF
- **to-be:** 카드/행 + 뱃지 + 선택 상세 패널

## Note
FE only — Pages deploy.
