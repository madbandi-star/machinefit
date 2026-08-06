# i18n 전면 점검 결과 리포트

생성일: 2026-08-06  
브랜치: `cursor/i18n-full-audit-35b3`

## 1. 수정된 파일 목록 (요약)

- `frontend/src/i18n/index.ts` — fallback / missing-key / 전체 ja·zh 로드 / equipment NS
- `frontend/src/i18n/locales/{ja,zh}/*` — 전 네임스페이스 패리티 (en→ja/zh 동기화 + UI 오버레이)
- `frontend/src/i18n/locales/*/equipment.json` — Owner 기구관리 NS
- `frontend/src/i18n/overlays/ja|zh.common.overlay.json`
- `frontend/src/utils/localeFormat.ts`, `apiErrorCatalog.ts`, `localizedName.ts`, `getApiErrorMessage.ts`
- `frontend/src/store/settings.store.ts` — 최초 브라우저 언어
- `frontend/src/layouts/DashboardLayout.tsx`, `EquipmentHubPage.tsx` — 하드코딩 제거
- `frontend/src/pages/settings/SettingsPage.tsx` — 언어 설정 섹션
- `frontend/src/components/admin/LocalizedStringFields/*`
- `scripts/i18n-audit.mjs`, `scripts/i18n-deep-merge.mjs`
- `database/migrations/101_content_i18n_translations.sql`
- `backend/server/utils/localize.util.ts`
- `docs/I18N.md`, `package.json` build hooks

## 2. 번역 누락 수정 내역

| 항목 | Before | After |
|------|--------|-------|
| ja/zh namespaces | common 43키만 | ko와 동일 11 NS, leaf key 패리티 0 missing |
| Runtime fallback | ko only | current → en → ko |
| Build gate | 없음 | `i18n:audit` on build |

## 3. 하드코딩 제거 목록

- Owner `DashboardLayout` 기구관리 네비 (ko → `equipment:*`)
- `EquipmentHubPage` 카드 타이틀/설명
- (잔여) 개별 Equipment* 페이지 본문은 `equipment` NS로 점진 이관 예정 — 네비/허브부터 차단

## 4. 추가된 Key

- `common.errors.{networkError,unauthorized,forbidden,unknown,emailExists,invalidCredentials,tokenExpired}`
- `common.settings.languageDesc`
- `equipment.*` (nav/hub/common) × 4 locales

## 5. 삭제된 Key

없음 (additive).

## 6. DB 변경

- Migration `101_content_i18n_translations.sql` — 공지/FAQ용 generic translation 테이블
- Catalog는 기존 JSONB `LocalizedString` 유지 (확장성·쿼리 단순)

## 7. 관리자 기능

- `LocalizedStringFields` — ko/en/ja/zh 동시 편집 컴포넌트 추가
- 기존 catalog 폼에 점진 연결 가능

## 8. 번역 품질

- ja/zh UI 오버레이: nav/actions/errors/auth/share/Premium 등 현지 표현
- 기구 영문명(Chest Press 등)은 en 관용어 유지 (직역 지양)

## 9. 테스트

- `node scripts/i18n-audit.mjs` → **missing keys: 0**
- shared/backend build OK (후속 typecheck)

## 10. 확장성 (es/de/fr)

`LOCALES` + locale 디렉터리 + `fallbackLng` + audit sync 로 추가 가능.  
상세: `docs/I18N.md`.
