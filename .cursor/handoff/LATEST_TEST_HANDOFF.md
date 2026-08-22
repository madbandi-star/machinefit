# Test handoff — Free Weight cover images

## Summary
프리웨이트(`FW_*`) 대표 5 + 부위 40 커버를 `after_change_300kb`/신규 생성 이미지로 교체 업로드 완료.  
비-FW 브랜드/머신/커버는 변경 없음. 앱 런타임 로직 변경 없음(스크립트·sitemap·handoff 커밋).

## Git
- branch: `main`
- commit: `4088ecc7c63a9e0b1809ae29ac9bd1a23acf1ab8`

## Changed files
- `scripts/upload-fw-covers.mjs` (+ color grading helper scripts)
- `docs/assets/machinefit-exhibition-banner-750x120.jpg`
- `frontend/public/sitemap.xml`
- `docs/I18N_AUDIT_REPORT.json`
- `.cursor/handoff/*`

## Test focus
1. Admin → Machine Covers → brand **Free Weight**
2. 바벨/케이블/덤벨/케틀벨/스미스: 대표 + 등·가슴·하체·어깨·이두·삼두·팔·코어 모두 표시
3. 다른 브랜드 커버 이미지가 바뀌지 않았는지 스팟 체크

## Fast checks
```bash
node -e "require('fs').accessSync('scripts/upload-fw-covers.mjs'); console.log('ok')"
git show --stat --oneline -1
```

## Production checks (covers already live)
- `GET /api/v1/media/machine-covers/FW_BARBELL/main`
- `GET /api/v1/media/machine-covers/FW_SMITH/legs/main`

## As-is → To-be
- **As-is:** 프리웨이트 커버가 구버전/누락·불일치 가능
- **To-be:** FW 5×(1+8)=45 슬롯 MachineFit 신규 톤으로 통일, 타 브랜드 0건 변경
