# Test handoff — Remove ops monitoring from My Page

## Summary
마이페이지 **관리자 도구**에서 **운영 모니터링** 메뉴를 제거했습니다. `/admin/ops` 라우트·관리자 대시보드/사이드바 진입은 그대로입니다.

## Git
- branch: `main`
- commit: (push 후 갱신)

## Changed files
- `frontend/src/pages/my-page/MyPage.tsx`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/common.json` (`opsMonitoring` 키 제거)

## Test focus
1. admin 마이페이지 → 관리자 도구에 운영 모니터링 없음
2. 관리자 대시보드만 표시
3. 관리자 대시보드/사이드바에서 운영 모니터링 접근 가능

## Fast checks
```bash
rg -n "opsMonitoring|ADMIN_OPS" frontend/src/pages/my-page/MyPage.tsx
```
(매치 없어야 함)

## as-is → to-be
- **as-is:** 마이페이지에 운영 모니터링 + 대시보드
- **to-be:** 대시보드만
