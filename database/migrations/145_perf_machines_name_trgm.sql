-- Machine search: ILIKE '%q%' on machines.name::text.
-- jsonb GIN on name does not help leading-wildcard text search; pg_trgm does.
-- Additive only — no column/data/semantics changes.

CREATE INDEX IF NOT EXISTS idx_machines_name_text_trgm
  ON machines USING GIN ((name::text) gin_trgm_ops);
