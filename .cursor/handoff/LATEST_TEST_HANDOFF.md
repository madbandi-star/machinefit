# Test handoff — Admin privacy rights process + bulk delete

## Summary
관리자 「개인정보 권리행사 관리」에 단건/다건 선택, 검토중·완료·반려 일괄 처리, 단건/다건 삭제 추가. 완료 시 정정(닉네임) 반영·처리정지 플래그 적용 옵션. API: PATCH bulk, DELETE requests.

## Test focus
1. `/admin/privacy-rights` 목록 체크박스 단건/전체 선택
2. 선택 후 검토중/완료/반려 (결과·반려 사유 입력)
3. 완료 시 정정 반영·처리정지 적용 체크 동작
4. 단건 삭제 / 선택 삭제 (confirm)
5. 유형·상태 필터

## Fast checks
```
rg -n "adminBulkUpdate|adminDeleteRights|deleteByIds|applyCorrection" frontend/src/api/compliance.api.ts backend/server/services/compliance.service.ts backend/server/routes/compliance.routes.ts
rg -n "selectedIds|bulkDelete|apr-table" frontend/src/pages/admin/compliance/AdminPrivacyRightsPage.tsx
```

## As-is → To-be
- as-is: 단건 상태 변경만, 삭제/다건 없음
- to-be: 선택·일괄 처리·삭제 + 완료 시 업무 반영 옵션

## Deploy note
backend/shared 변경 → Render 백엔드 재배포 필요
