-- Rebuild brand machine names for STD_45_LEG_PRESS from common type
-- (common already uses "45° 레그 프레스"; brands still had "45도 …").

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
  AND t.code = 'STD_45_LEG_PRESS';

-- Keep old spelling searchable
INSERT INTO standard_machine_aliases (standard_type_id, alias)
SELECT t.id, a.alias
FROM standard_machine_types t
CROSS JOIN (VALUES
  ('45도 레그 프레스'),
  ('45° 레그 프레스'),
  ('45° Leg Press'),
  ('45 Degree Leg Press')
) AS a(alias)
WHERE t.code = 'STD_45_LEG_PRESS'
  AND NOT EXISTS (
    SELECT 1 FROM standard_machine_aliases x
    WHERE x.standard_type_id = t.id AND lower(x.alias) = lower(a.alias)
  );
