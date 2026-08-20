-- Strip markdown horizontal-rule lines (`---` alone) from machines.pro_tips.
-- Display layer also filters these; this cleans stored catalog copy.

CREATE OR REPLACE FUNCTION tmp_strip_pro_tip_hr(src text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(both E'\n' FROM regexp_replace(
    regexp_replace(COALESCE(src, ''), '(?m)^\s*-{3,}\s*$', '', 'g'),
    E'\n{3,}',
    E'\n\n',
    'g'
  ));
$$;

UPDATE machines m
SET
  pro_tips = cleaned.payload,
  updated_at = NOW()
FROM (
  SELECT
    m2.id,
    COALESCE(
      (
        SELECT jsonb_object_agg(locale_key, tips_arr)
        FROM (
          SELECT
            e.key AS locale_key,
            COALESCE(
              (
                SELECT jsonb_agg(to_jsonb(cleaned) ORDER BY ord)
                FROM (
                  SELECT
                    ord,
                    tmp_strip_pro_tip_hr(elem) AS cleaned
                  FROM jsonb_array_elements_text(e.value) WITH ORDINALITY AS t(elem, ord)
                ) s
                WHERE cleaned <> ''
              ),
              '[]'::jsonb
            ) AS tips_arr
          FROM jsonb_each(m2.pro_tips) AS e(key, value)
        ) parts
      ),
      '{}'::jsonb
    ) AS payload
  FROM machines m2
  WHERE m2.pro_tips IS NOT NULL
    AND m2.pro_tips::text LIKE '%---%'
) cleaned
WHERE m.id = cleaned.id;

DROP FUNCTION tmp_strip_pro_tip_hr(text);
