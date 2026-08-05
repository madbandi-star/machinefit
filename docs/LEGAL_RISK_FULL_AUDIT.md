# MachineFit 법률 리스크 전수 점검 보고서

> **면책:** 법률 자문이 아닙니다. 코드·제품 기준으로 정리한 엔지니어링 실행 문서입니다.  
> 기준일: 2026-07-25 · 관할 1차: 대한민국(PIPA 등) · 확장: GDPR/CCPA 구조

상태 범례: **높음 / 중간 / 낮음** · 구현: `[x]` 이번 스프린트 · `[~]` 부분 · `[ ]` 후속

---

## 1. 위험도 요약

| ID | 영역 | 위험도 | 요약 | 이번 대응 |
|----|------|--------|------|-----------|
| R1 | 데모 비밀번호 잔존 해시 | 높음 | 과거 `demo1234` 강제 계정 | `096_invalidate_demo_password_hashes.sql`로 해시·리프레시 무효화 `[x]` |
| R2 | 탈퇴 시 PII 잔존 | 높음 | 키·체중·위치 등 잔류 | 탈퇴 시 신체·위치·마케팅 필드 익명화 강화 `[x]` |
| R3 | 위치정보 동의 미기록 | 높음 | GPS→DB 시 동의 로그 없음 | 위치약관·동의 API·GPS 전 동의 UI `[x]` |
| R4 | 개인정보 열람·다운로드 부재 | 높음 | 권리 행사 경로 없음 | Privacy Center + JSON export `[x]` |
| R5 | 문의·민원 채널 부재 | 높음 | 방침만 존재 | 문의 티켓 + 관리자 큐 `[x]` |
| R6 | 자유게시판 신고 mock | 높음 | 실제 DB 미연동 | 신고 API + admin 실DB `[x]` |
| R7 | 전자상거래 고지 부재 | 높음 | 데모결제·환불·청약철회 미고지 | 전자상거래/환불 정책 페이지 + PT 데모 고지 `[x]` |
| R8 | PT·AI 의료 오인 | 중간 | 면책 문구 약함 | PT/AI/추천 면책 컴포넌트 `[x]` |
| R9 | UGC·저작권 정책 약함 | 중간 | 신고·필터 불완전 | 커뮤니티/저작권 정책 + 금칙어 필터 + 신고 `[x]` |
| R10 | 감사 로그 부재 | 중간 | 관리자·로그인 추적 불가 | admin_audit_logs + auth_login_events `[x]` |
| R11 | 약관 버전·국가 분리 | 중간 | 단일 상수 | legal_documents 테이블·지역 코드 `[x]` |
| R12 | 광고 표시 | 낮음 | 스라벨 없음 | 정책 + SponsoredBadge 컴포넌트 `[x]` |
| R13 | 사업자·트레이너 인증 강화 | 중간 | URL만 | 사업자번호 필드·관리자 인증 화면 보강 `[x]` |
| R14 | GDPR/CCPA 본문 | 낮음(현재) | 구조만 필요 | region 기반 문서·동의 타입 `[x]` |

---

## 2. 개선 대상 화면 목록

| 화면 | 경로 | 변경 |
|------|------|------|
| 이용약관 | `/terms` | 버전·지역 메타 유지 |
| 개인정보처리방침 | `/privacy` | 보관·권리·문의 경로 보강 |
| 위치정보 이용약관 | `/legal/location` | **신규** |
| 전자상거래·환불 | `/legal/commerce` | **신규** |
| 커뮤니티·UGC | `/legal/community` | **신규** |
| 저작권 | `/legal/copyright` | **신규** |
| AI·건강 면책 | `/legal/ai-disclaimer` | **신규** |
| 내 정보·권리 센터 | `/settings/privacy-rights` | **신규** |
| 문의하기 | `/support` | **신규** |
| 문의 상세 | `/support/:ticketId` | **신규** |
| 설정 | `/settings` | 위치동의·마케팅·탈퇴·권리센터 링크 |
| 위치 선택 | LocationPicker | GPS 전 위치동의 확인 |
| 회원가입 | `/register` | 위치동의(선택) 체크 |
| 추천 결과 | recommend result | AI 참고용 배너 |
| Lifter DNA / Growth | my-page/* | AI 면책 |
| 온라인 PT | ask/detail/purchase | 의료·데모결제·트레이너 책임 고지 |
| 자유게시판 상세 | posts/:id | 신고 버튼 |
| 관리자 컴플라이언스 | `/admin/compliance` | **신규** |
| 관리자 문의 | `/admin/support` | **신규** |
| 관리자 감사로그 | `/admin/audit-logs` | **신규** |

---

## 3. 개선 대상 기능 목록

1. 동의 타입 확장: terms / privacy / marketing / location / push_service  
2. 위치 좌표 저장 시 location 동의 검증(좌표 있을 때만)  
3. 개인정보 요약 열람 API  
4. 개인정보 JSON 내보내기  
5. 탈퇴 시 PII 필드·위치 행 정리  
6. 문의 티켓 생성·답변·상태  
7. 자유게시판 신고(실DB) + 관리자 처리  
8. 간단한 금칙어/음란 키워드 필터(게시·댓글)  
9. 로그인 이벤트 기록  
10. 관리자 주요 작업 감사 로그  
11. 지역별 법적 문서 카탈로그 API  
12. PT·AI·추천 면책 UI (로직 변경 없음)  
13. 데모 결제·환불·청약철회 정책 노출  
14. 사업자등록번호(선택) 저장·관리자 표시  

---

## 4. DB 설계 (migration 074)

- `users.location_opt_in`, `users.push_service_opt_in`  
- `user_consents`: `region_code`, `ip_address`, `user_agent`, `source`  
- `legal_documents` (region, doc_type, version, title, summary, effective_at, is_active)  
- `support_tickets`, `support_ticket_messages`  
- `admin_audit_logs`  
- `auth_login_events`  
- `user_sanctions` (경고/일시정지 메타 — 로그인 차단은 is_active와 병행)  
- `owner_applications.business_registration_number` (있으면 ALTER)

---

## 5. 관리자 기능 설계

| 기능 | 설명 |
|------|------|
| 컴플라이언스 허브 | 문서 버전·동의 통계·빠른 링크 |
| 동의 이력 조회 | userId / type / version |
| 문의 관리 | open→in_progress→resolved |
| 감사 로그 | actor, action, target, meta, IP |
| 신고(자유게시판) | 실DB resolve + 게시글 숨김 |
| 제재 기록 | sanction 생성/해제 기록 |

---

## 6. 사용자 동의 화면 설계

1. 가입: 필수 약관·방침 / 선택 마케팅·위치  
2. 설정: 마케팅·위치·서비스푸시 토글 + 철회  
3. GPS 사용 직전: 위치약관 링크 + 동의 확인  
4. 약관 버전 bump 시: 배너로 재확인(강제 차단 없음 — 비즈니스 비침습)  
5. Privacy Rights: 열람·수정 링크·다운로드·탈퇴·문의  

---

## 7. 정책 문구

i18n `legal.*` / `compliance.*` / `support.*` (ko·en).  
문서 버전: `LEGAL_DOC_VERSION` (bump 시 동의 재기록).

---

## 8. API 설계

| Method | Path | 설명 |
|--------|------|------|
| GET | `/legal/documents` | region·type별 활성 문서 |
| GET | `/privacy/me` | 내 개인정보 요약 |
| GET | `/privacy/me/export` | JSON 내보내기 |
| GET | `/privacy/me/consents` | 동의 이력 |
| PATCH | `/privacy/me/consents` | 선택 동의 갱신 |
| POST | `/support/tickets` | 문의 생성 |
| GET | `/support/tickets` | 내 문의 |
| GET | `/support/tickets/:id` | 상세 |
| POST | `/support/tickets/:id/messages` | 추가 메시지 |
| POST | `/community/posts/:id/report` | 게시글 신고 |
| POST | `/community/comments/:id/report` | 댓글 신고 |
| GET | `/admin/compliance/overview` | 통계 |
| GET | `/admin/compliance/consents` | 동의 검색 |
| GET | `/admin/compliance/documents` | 문서 목록 |
| POST | `/admin/compliance/documents` | 문서 등록 |
| GET | `/admin/support/tickets` | 문의 큐 |
| PATCH | `/admin/support/tickets/:id` | 상태·답변 |
| GET | `/admin/audit-logs` | 감사 로그 |

---

## 9. 글로벌 확장 구조

- `region_code`: `KR` 기본, 향후 `EU`/`US-CA` 등  
- 동의 타입·문서 타입 enum 확장 가능  
- GDPR/CCPA: export + delete + consent withdraw가 DSAR 기반; Do-Not-Sell은 marketing/location 철회로 매핑 가능  
- 본문 전문은 CMS성 `legal_documents`로 교체 가능(현재 시드+i18n 병행)

---

## 10. 명시적 비변경(비즈니스 로직)

- 추천 알고리즘·중량 계산·세트 기록 흐름 불변  
- 온라인 PT 구매는 계속 `paymentMethod: 'demo'` — **고지 UI만 추가**  
- 푸시 발송 대상 필터는 기존 marketing 필터 유지 + 문서화  
- 친구/라이브/거래 핵심 권한 로직 불변  

---

## 11. 후속 권고 (운영)

1. 프로덕션 DB에서 `demo1234` 해시 사용자 강제 재설정  
2. 변호사 검토 후 약관 전문을 `legal_documents.body_md`로 교체  
3. 실결제 PG 연동 시 영수증·현금영수증·통신판매업 신고번호 노출  
4. UGC 이미지 오브젝트 스토리지 TTL  
5. XSS용 HTML sanitize(게시 본문에 HTML 도입 시)
