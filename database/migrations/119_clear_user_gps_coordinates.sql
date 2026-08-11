-- Do not store member GPS. Keep region (시·군·구) and facility catalog coords.
UPDATE user_locations
SET latitude = NULL,
    longitude = NULL,
    updated_at = NOW()
WHERE latitude IS NOT NULL
   OR longitude IS NOT NULL;
