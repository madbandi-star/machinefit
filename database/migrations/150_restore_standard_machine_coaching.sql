-- Restore catalog tips/warnings onto 공통 copies that only got fit positions (149).
-- Copies from a sibling machine of the same standard_type that already has coaching text.
-- Does not overwrite brand-specific tips/warnings that are already filled.

WITH donor AS (
  SELECT DISTINCT ON (m.standard_type_id)
    m.standard_type_id,
    COALESCE(
      CASE
        WHEN m.warnings IS NOT NULL AND m.warnings <> '{}'::jsonb
          AND (
            (jsonb_typeof(m.warnings->'ko') = 'array' AND jsonb_array_length(m.warnings->'ko') > 0)
            OR (jsonb_typeof(m.warnings->'en') = 'array' AND jsonb_array_length(m.warnings->'en') > 0)
          )
        THEN m.warnings
      END,
      ms.warnings
    ) AS warnings,
    COALESCE(
      CASE
        WHEN m.tips IS NOT NULL AND m.tips <> '{}'::jsonb
          AND (
            (jsonb_typeof(m.tips->'ko') = 'array' AND jsonb_array_length(m.tips->'ko') > 0)
            OR (jsonb_typeof(m.tips->'en') = 'array' AND jsonb_array_length(m.tips->'en') > 0)
          )
        THEN m.tips
      END,
      ms.tips
    ) AS tips
  FROM machines m
  LEFT JOIN LATERAL (
    SELECT s.warnings, s.tips
    FROM machine_settings s
    WHERE s.machine_id = m.id
      AND (
        (
          s.warnings IS NOT NULL AND s.warnings <> '{}'::jsonb
          AND (
            (jsonb_typeof(s.warnings->'ko') = 'array' AND jsonb_array_length(s.warnings->'ko') > 0)
            OR (jsonb_typeof(s.warnings->'en') = 'array' AND jsonb_array_length(s.warnings->'en') > 0)
          )
        )
        OR (
          s.tips IS NOT NULL AND s.tips <> '{}'::jsonb
          AND (
            (jsonb_typeof(s.tips->'ko') = 'array' AND jsonb_array_length(s.tips->'ko') > 0)
            OR (jsonb_typeof(s.tips->'en') = 'array' AND jsonb_array_length(s.tips->'en') > 0)
          )
        )
      )
    ORDER BY s.created_at ASC
    LIMIT 1
  ) ms ON TRUE
  WHERE m.standard_type_id IS NOT NULL
    AND (
      (
        m.warnings IS NOT NULL AND m.warnings <> '{}'::jsonb
        AND (
          (jsonb_typeof(m.warnings->'ko') = 'array' AND jsonb_array_length(m.warnings->'ko') > 0)
          OR (jsonb_typeof(m.warnings->'en') = 'array' AND jsonb_array_length(m.warnings->'en') > 0)
        )
      )
      OR ms.warnings IS NOT NULL
    )
  ORDER BY m.standard_type_id, m.created_at ASC
)
UPDATE machines dest
SET
  warnings = CASE
    WHEN dest.warnings IS NULL OR dest.warnings = '{}'::jsonb THEN d.warnings
    ELSE dest.warnings
  END,
  tips = CASE
    WHEN dest.tips IS NULL OR dest.tips = '{}'::jsonb THEN d.tips
    ELSE dest.tips
  END,
  updated_at = NOW()
FROM donor d
WHERE dest.standard_type_id = d.standard_type_id
  AND (
    dest.warnings IS NULL
    OR dest.warnings = '{}'::jsonb
    OR dest.tips IS NULL
    OR dest.tips = '{}'::jsonb
  );

WITH donor AS (
  SELECT DISTINCT ON (m.standard_type_id)
    m.standard_type_id,
    COALESCE(
      CASE
        WHEN m.warnings IS NOT NULL AND m.warnings <> '{}'::jsonb
          AND (
            (jsonb_typeof(m.warnings->'ko') = 'array' AND jsonb_array_length(m.warnings->'ko') > 0)
            OR (jsonb_typeof(m.warnings->'en') = 'array' AND jsonb_array_length(m.warnings->'en') > 0)
          )
        THEN m.warnings
      END,
      ms.warnings
    ) AS warnings,
    COALESCE(
      CASE
        WHEN m.tips IS NOT NULL AND m.tips <> '{}'::jsonb
          AND (
            (jsonb_typeof(m.tips->'ko') = 'array' AND jsonb_array_length(m.tips->'ko') > 0)
            OR (jsonb_typeof(m.tips->'en') = 'array' AND jsonb_array_length(m.tips->'en') > 0)
          )
        THEN m.tips
      END,
      ms.tips
    ) AS tips
  FROM machines m
  LEFT JOIN LATERAL (
    SELECT s.warnings, s.tips
    FROM machine_settings s
    WHERE s.machine_id = m.id
      AND (
        (
          s.warnings IS NOT NULL AND s.warnings <> '{}'::jsonb
          AND (
            (jsonb_typeof(s.warnings->'ko') = 'array' AND jsonb_array_length(s.warnings->'ko') > 0)
            OR (jsonb_typeof(s.warnings->'en') = 'array' AND jsonb_array_length(s.warnings->'en') > 0)
          )
        )
        OR (
          s.tips IS NOT NULL AND s.tips <> '{}'::jsonb
          AND (
            (jsonb_typeof(s.tips->'ko') = 'array' AND jsonb_array_length(s.tips->'ko') > 0)
            OR (jsonb_typeof(s.tips->'en') = 'array' AND jsonb_array_length(s.tips->'en') > 0)
          )
        )
      )
    ORDER BY s.created_at ASC
    LIMIT 1
  ) ms ON TRUE
  WHERE m.standard_type_id IS NOT NULL
    AND (
      (
        m.warnings IS NOT NULL AND m.warnings <> '{}'::jsonb
        AND (
          (jsonb_typeof(m.warnings->'ko') = 'array' AND jsonb_array_length(m.warnings->'ko') > 0)
          OR (jsonb_typeof(m.warnings->'en') = 'array' AND jsonb_array_length(m.warnings->'en') > 0)
        )
      )
      OR ms.warnings IS NOT NULL
    )
  ORDER BY m.standard_type_id, m.created_at ASC
)
UPDATE machine_settings ms
SET
  warnings = CASE
    WHEN ms.warnings IS NULL OR ms.warnings = '{}'::jsonb THEN d.warnings
    ELSE ms.warnings
  END,
  tips = CASE
    WHEN ms.tips IS NULL OR ms.tips = '{}'::jsonb THEN d.tips
    ELSE ms.tips
  END,
  updated_at = NOW()
FROM machines m
JOIN donor d ON d.standard_type_id = m.standard_type_id
WHERE ms.machine_id = m.id
  AND (
    ms.warnings IS NULL
    OR ms.warnings = '{}'::jsonb
    OR ms.tips IS NULL
    OR ms.tips = '{}'::jsonb
  );
