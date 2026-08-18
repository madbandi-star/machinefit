# Test handoff â ì¸ë¶ê¸°êµ¬ ì¶ì² ì£¼ìì¬í­ ë³µêµ¬

## Summary
ê³µíµ ë¨¸ì ì ìí¸/í¸ë¤ë§ ë£ê³  ì£¼ìì¬í­ì´ ë¹ `{}`ë¡ ë¨ì¼ë©´ì, ìì ì ëì¤ë ì£¼ì ë¬¸êµ¬ê° ê°ë ¤ì¡ìµëë¤. ê°ì ì íì ì¹´íë¡ê·¸ ì£¼ìì¬í­ì ë¤ì ì°ê³ , ë¹ ê°ì ì ì¥íì§ ììµëë¤.

## Test focus
1. ì¸ë¶ê¸°êµ¬ ì¶ì² ê²°ê³¼ íì´ì§ ìë¨ì **ì£¼ì** ëª©ë¡ì´ ë¤ì ë³´ì´ëì§
2. ì²´ì¤í¸ íë ì¤ ê³µíµ/ë¸ëë ë³µì¬ë³¸: ì´ê¹¨ ë¶í¸ ì ì¤ë¨ ë± ê¸°ì¡´ ì£¼ì ë¬¸êµ¬
3. ì¤ë¯¸ì¤ / íìë: ì¹´íë¡ê·¸ì ì£¼ìê° ìì¼ë©´ ì¨ê¹ ì ì§
4. ë¸ëë ì ì© ì£¼ìì¬í­ì´ ìë ë¨¸ì ì ê¸°ì¡´ ë¬¸êµ¬ ì ì§
5. **Render migrate 150 + backend ì¬ë°°í¬ íì**

## Fast checks
- `npx tsx backend/server/utils/localize.util.test.ts`
- `database/migrations/150_restore_standard_machine_coaching.sql` contains `standard_type_id`
- `backend/server/services/recommendation.service.ts` contains `firstLocalizedRecord`
- `backend/server/repositories/recommendation.repository.ts` contains `findTypeCoaching`

## As-is â To-be
- as-is: ì¶ì² ê²°ê³¼ì ì£¼ìì¬í­ ìì (ì¤ë/íì/ê°ëë²ìë§)
- to-be: ìì ì ëì¤ë ê¸°êµ¬ë³ ì£¼ìì¬í­ì´ ê²°ê³¼ íì´ì§ì ë¤ì íì

**Branch:** `main`  
**Commit:** 92f537e3
