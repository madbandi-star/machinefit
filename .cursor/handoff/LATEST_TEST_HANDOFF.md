# Latest test handoff — Share card layout & typography fixes

**Branch:** `main` · **Commit:** pending

## Change

누적무게 공유 카드 시각 개선 (`liftedShareCard.ts`):

- U형 대칭 **월계관** (잎 8쌍 + 베지어 가지)
- 전체 **글자 크기 확대**, 좌우 여백 축소 (POSTER_MARGIN 22, POSTER_PAD 28)
- KG 172px, 헤드라인 38px, 슬로건/비교/푸터 타이포 확대
- 본문 **수직 중앙 정렬** (푸터는 하단 고정)
- **MachineFit 로고 + 슬로건** 2줄 분리 (겹침 제거)
- 비교 카드("이 무게는 어느 정도?") 중앙 배치

## Test

누적무게 → **공유 카드 만들기** → 1080×1920 PNG 확인

```bash
npm run build --prefix frontend
```

## as-is → to-be

- **as-is:** 월계관 이상, 작은 글자, 넓은 여백, 비교 박스 상단 쏠림, 푸터 겹침
- **to-be:** 정상 월계관, 큰 가독성, 중앙 정렬, 분리된 푸터
