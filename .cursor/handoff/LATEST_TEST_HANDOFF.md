# Test handoff — My Page 더보기 photo board order

## Summary
On My Page → 더보기, Photo board is now directly under Free board (then template share / my templates).

## Test focus
1. My Page → 더보기: 자유게시판 바로 아래 사진게시판

## as-is → to-be
- as-is: photo board under my templates
- to-be: photo board under free board

## Fast checks
```
rg "FREE_BOARD" frontend/src/pages/my-page/MyPage.tsx -A 8
```
