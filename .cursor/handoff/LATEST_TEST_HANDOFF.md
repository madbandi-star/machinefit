# Test handoff — Template share YouTube / Instagram fields

## Summary
내 템플릿 공유 시 **유튜브 URL · 유튜브 채널 이름 · 인스타그램 ID** 입력 가능.  
공유관 목록/게시글 상세에서 확인 가능.

## Git
- branch: `main`
- commit: `4876e208`

## Migration
`database/migrations/128_template_share_creator_links.sql` — **Render DB 적용 필요**

## Test focus
1. 마이페이지 > 내 템플릿 > 공유하기: 3개 소셜 필드
2. 공개 후 공유관 상세: 크리에이터 링크 섹션 (채널명 / URL 링크 / @인스타)
3. 공유관 목록 행에 채널·@ID 요약 표시
4. 「공유 정보 수정」 시 기존 값 프리필

## Fast checks
```
rg -n "youtubeUrl|instagramId|youtube_url" shared/src backend/server/repositories/template-share.repository.ts frontend/src/pages/template-share
```

## Production
**Pages FE + Render BE + migration 128**

## As-is → To-be
- **As-is:** 소셜 필드 없음
- **To-be:** 공유 시 입력 · 게시글에서 확인
