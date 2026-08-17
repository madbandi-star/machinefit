# Test handoff — Purge DEMO1 + force catalog delete

## Summary
기구코드 `DEMO1`(로우로우)를 추천·최근이력·운동기록과 함께 DB에서 완전 삭제. 기구관리에서 참조로 비활성화된 경우 **이력 포함 삭제** 확인 다이얼로그 추가 (`?force=true`).

## Already applied
- Production migration `144_purge_catalog_machine_demo1.sql` (DEMO1 gone)

## Test focus
1. 기구관리에서 DEMO1 검색 → 없음
2. 다른 이력 있는 기구 삭제 → 비활성 토스트 후 「이력 포함 삭제」로 완전 삭제

## As-is → To-be
- as-is: DEMO1 비활성만 가능
- to-be: DEMO1 삭제 완료 + force purge UI/API
