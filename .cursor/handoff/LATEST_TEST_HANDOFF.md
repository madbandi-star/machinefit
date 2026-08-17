# Test handoff ??Production boot crash fix

## Summary
`ServiceUnavailableScreen` used `useLocation()` outside `RouterProvider` ??blank `machine-fit.com`. Switched path check to `window.location.pathname`.

## Test focus
1. https://machine-fit.com/ loads (not blank `#root`)
2. Console??`useLocation() may be used only in the context of a <Router>` ?†ìŒ
3. ???¤ë”?ì„œ ?™ê¸°ë¶€???Œì•…Â·?™ì˜??ë²„íŠ¼ ?œì‹œ

## As-is ??To-be
- as-is: ?¬ì´???„ì²´ ??ê²€ ë¹??”ë©´
- to-be: ???•ìƒ ë¶€??
**Commit:** 
