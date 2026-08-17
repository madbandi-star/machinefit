-- Hard-purge catalog machine DEMO1 (로우로우) and rows that block DELETE.
-- Soft-delete left is_active=false because of recommendation/history FKs.

DO $$
DECLARE
  mid UUID;
BEGIN
  SELECT id INTO mid FROM machines WHERE upper(code) = 'DEMO1' LIMIT 1;
  IF mid IS NULL THEN
    RAISE NOTICE 'DEMO1 not found — nothing to purge';
    RETURN;
  END IF;

  -- NO ACTION / RESTRICT FKs (must go before machines DELETE)
  DELETE FROM machine_trades WHERE machine_id = mid;
  DELETE FROM recent_history WHERE machine_id = mid;
  DELETE FROM machine_recommendations WHERE machine_id = mid;
  DELETE FROM gym_machines WHERE machine_id = mid;

  -- Remaining children (settings, images, covers, logs, favorites, …) CASCADE
  DELETE FROM machines WHERE id = mid;
  RAISE NOTICE 'Purged catalog machine DEMO1 (%)', mid;
END $$;
