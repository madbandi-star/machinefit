# [MachineFit 의료행위 리스크 검사 결과]

Date: 2026-08-10  
Scope: Frontend / Backend / Admin / catalog seeds / i18n / fortune / “AI” heuristics  
Note: 법률적 확정 판단이 아니며, **위험 가능성이 있는 표현**을 보수적으로 완화함.

## 1. 🔴 수정 필수 → 조치 완료

| 항목 | 파일 | 이유 | 수정 |
|---|---|---|---|
| 기구 주의사항(수술·통증·전문가) | `database/catalog/machines/*.json`, seeds, `catalog.generated.ts`, migration `113` | 임상 트리아지/수술력 전제처럼 읽힘 | 불편감·부하/자세 재확인 문구로 완화 + prod UPDATE |
| 목표 라벨 `재활`/`체형 교정` | `common.json` `auth.workoutGoals` | 의료·교정 서비스로 오인 가능 | `가벼운 적응` / `자세·가동 중심` |
| 목표 팁 “통증 없는 범위” | `recommendation-personalization.ts` | 통증 기반 처방 톤 | 편안한 가동범위(참고) |
| 성장 “과부하 징후가 보입니다” | `common.json` growth tips | 진단형 단정 | 수행량 급증 패턴 + 고려 제안 |

## 2. 🟡 수정 권장 → 조치 완료/일부

| 항목 | 파일 | 조치 |
|---|---|---|
| Easy Mode 경고 노출 | `EasyWizardPage.tsx` | fitnessNote + health banner |
| 추천 결과 면책 | `RecommendationResultPage.tsx` | health + ai banner |
| PT 질문/답변 | Ask/Question pages | `variant="pt"` banner |
| PT 전문분야 placeholder | `online-pt.json` | `자세교정` 제거 |
| Lifter DNA 휴식/자세 팁 | `lifter-dna-catalog.ts` | 추정·참고 톤 |
| 관리자 팁 CMS | `AdminMachineTipsPage` + i18n | 의료문구 등록 금지 안내 |
| health 면책 문구 | `compliance.disclaimer.health` | 피트니스 참고·비의료 명확화 |

## 3. 🟢 문제 없음

- 운동기록 CRUD, 횟수 세기, 휴식 타이머 로직 자체
- 헬창운세 엔터테인먼트 + 기존 disclaimer
- 질환명(디스크/당뇨/고혈압/회전근개 등) 제품 카피 미검출
- LLM system prompt 없음 (규칙 기반 “AI” 분석만 존재)
- 사용자 질환/진단 DB 컬럼 없음 (키·체중·운동목표 enum만)

## 4. AI 관련 위험

- **LLM AI 기능: 없음**
- 규칙 기반 추천/Lifter DNA/성장 분석이 “AI”로 브랜딩됨 → 면책 유지, 진단형 카피 완화
- 의료 Q&A 자동응답 엔진 없음 → 추가 prompt 방어 불필요 (향후 LLM 도입 시 필수)

## 5. 건강/질환 정보 수집

| 항목 | 저장 | 관리자 | 개선 |
|---|---|---|---|
| 키/체중/성별/경험/목표 | users | 프로필·추천 사용 | 목표 라벨만 완화 (enum 유지) |
| 생년월일/시 | fortune | 운세 | 이미 비의료 고지 |
| 질환/증상 자유입력 필드 | 없음 | — | 추가 수집 금지 권고 |
| 기구 `machine_faults.symptom` | 장비 고장 | 헬스장 운영 | 인체 건강정보 아님 |

파괴적 삭제/스키마 제거는 **미실행** (승인 필요).

## 6. 약관/면책

- 기존: `/legal/ai-disclaimer`, terms, fortune disclaimer, `LegalDisclaimerBanner`
- 추가: health 문구 강화 + 추천/이지모드/PT 화면 노출
- 약관 전문 전면 개편은 하지 않음

## 기능별 요약 (A–O)

| 기능 | 위험 | 비고 |
|---|---|---|
| A 머신 설정 | 🟡→완화 | how_to 관절정렬 표현 완화 |
| B 기구 추천 | 🔴→완화 | warnings + 목표 팁 |
| C 루틴 | 🟢 | — |
| D/E 분석·볼륨 | 🟡→완화 | growth/DNA 카피 |
| F 기록 | 🟢 | — |
| G 운세 | 🟢 | disclaimer 유지 |
| H AI | 🟡 | LLM 없음; 브랜딩+면책 |
| I 커뮤니티/PT | 🟡→완화 | PT 면책·placeholder |
| J/K/N 팁·TTS·CMS | 🔴→완화 | 카탈로그+관리자 안내 |
| L 카운트 | 🟢 | — |
| M 사용법 | 🟡→완화 | how_to |
| O 입력 추천 | 🔴→완화 | rehab/posture 라벨·팁 |
