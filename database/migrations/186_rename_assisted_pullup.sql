-- Rename STD_ASSISTED_PULLUP_DIP display name → "어시스트 풀업"
-- and rebuild linked brand machine names from brand + standard type.

UPDATE standard_machine_types
SET
  name = jsonb_build_object(
    'ko', '어시스트 풀업',
    'en', 'Assisted Pull-Up',
    'ja', COALESCE(NULLIF(trim(name->>'ja'), ''), 'アシストプルアップ'),
    'zh', COALESCE(NULLIF(trim(name->>'zh'), ''), '辅助引体向上')
  ),
  updated_at = NOW()
WHERE code = 'STD_ASSISTED_PULLUP_DIP';

INSERT INTO standard_machine_aliases (standard_type_id, alias)
SELECT t.id, a.alias
FROM standard_machine_types t
CROSS JOIN (VALUES
  ('어시스트 풀업'),
  ('어시스트 풀업 / 딥'),
  ('Assisted Pull-Up'),
  ('Assisted Pull-Up / Dip')
) AS a(alias)
WHERE t.code = 'STD_ASSISTED_PULLUP_DIP'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases x
    WHERE x.standard_type_id = t.id AND lower(x.alias) = lower(a.alias)
  );

UPDATE machines m
SET
  name = jsonb_strip_nulls(
    jsonb_build_object(
      'ko',
      trim(BOTH FROM concat_ws(
        ' ',
        NULLIF(trim(COALESCE(b.name->>'ko', '')), ''),
        NULLIF(trim(COALESCE(t.name->>'ko', '')), '')
      )),
      'en',
      trim(BOTH FROM concat_ws(
        ' ',
        NULLIF(trim(COALESCE(b.name->>'en', b.code)), ''),
        NULLIF(trim(COALESCE(t.name->>'en', t.code)), '')
      )),
      'ja',
      NULLIF(trim(BOTH FROM concat_ws(
        ' ',
        NULLIF(trim(COALESCE(b.name->>'ja', '')), ''),
        NULLIF(trim(COALESCE(t.name->>'ja', '')), '')
      )), ''),
      'zh',
      NULLIF(trim(BOTH FROM concat_ws(
        ' ',
        NULLIF(trim(COALESCE(b.name->>'zh', '')), ''),
        NULLIF(trim(COALESCE(t.name->>'zh', '')), '')
      )), '')
    )
  ),
  updated_at = NOW()
FROM standard_machine_types t,
     brands b
WHERE m.standard_type_id = t.id
  AND m.brand_id = b.id
  AND t.code = 'STD_ASSISTED_PULLUP_DIP';
