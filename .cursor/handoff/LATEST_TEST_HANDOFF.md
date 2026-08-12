# Test handoff — Footer support contact UI

## Summary
페이지 하단 고객센터 이메일을 표 형태 박스에서 메일 아이콘 칩으로 바꿨습니다. 탭하면 mailto입니다.

## Test focus
1. 비관리자 푸터: 고객센터 + 이메일이 한 줄 칩
2. 관리자: 사업자 정보 카드 안에 같은 칩
3. 클릭 시 메일 앱

## Fast checks
```
rg legal-footer__support frontend/src/components/layout/LegalFooter/LegalFooter.tsx frontend/src/styles/legal.css
```

## as-is → to-be
- as-is: 고객센터 | 이메일이 dl 2열 박스
- to-be: 메일 아이콘 + 라벨 + 주소 칩
