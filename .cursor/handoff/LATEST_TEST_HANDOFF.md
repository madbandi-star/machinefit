# Latest test handoff — gender recommend weight

**Branch:** `cursor/gender-recommend-weight-35b3`  
**Scope:** shared + backend

## Change
Cold-start 추천 중량에 성별 보정 추가 (`GENDER_WEIGHT_BIAS`: female 0.72 vs male 1.0).
근거: Miller/Leyk 등 동일 체중·신장에서 여성 절대근력 약 65–75%.

- `applyPersonalizationToWeight`에 `gender` 전달 (progressive 기록 기반은 기존처럼 스킵)
- body reference는 성별 중복 적용 방지를 위해 중립 산출 → 최종 단계에서 1회 적용
- workout insights 참조 체중은 `genderWeightFactor` 공통 상수 사용

## Deploy
- Frontend: Pages (간접)
- **Backend/shared: Render Manual Deploy**
