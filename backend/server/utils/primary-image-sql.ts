/**
 * Shared SQL fragments for machine primary image resolution.
 * Priority: brand cover → brand gallery → standard type image → null (FE placeholder).
 */

export function versionedUrlSql(alias: string): string {
  return `CASE
    WHEN ${alias}.image_url IS NULL THEN NULL
    WHEN POSITION('?' IN ${alias}.image_url) > 0
      THEN ${alias}.image_url || '&v=' || COALESCE(${alias}.version, 0)::text
    ELSE ${alias}.image_url || '?v=' || COALESCE(${alias}.version, 0)::text
  END`;
}

/** Standard type primary image subquery; `machineAlias` must expose standard_type_id. */
export function standardTypePrimaryImageSql(machineAlias = 'm'): string {
  return `(
    SELECT ${versionedUrlSql('s')}
    FROM standard_machine_images s
    WHERE s.standard_type_id = ${machineAlias}.standard_type_id
    ORDER BY s.is_primary DESC, s.display_order ASC, s.created_at ASC
    LIMIT 1
  )`;
}

/** Brand gallery primary from machine_images. */
export function brandGalleryPrimaryImageSql(machineAlias = 'm'): string {
  return `(
    SELECT CASE
      WHEN mi.image_data IS NOT NULL THEN
        CASE
          WHEN POSITION('?' IN mi.image_url) > 0
            THEN mi.image_url || '&v=' || COALESCE(mi.version, 0)::text
          ELSE mi.image_url || '?v=' || COALESCE(mi.version, 0)::text
        END
      ELSE mi.image_url
    END
    FROM machine_images mi
    WHERE mi.machine_id = ${machineAlias}.id
    ORDER BY mi.is_primary DESC, mi.sort_order ASC, mi.created_at ASC
    LIMIT 1
  )`;
}

/** Default cover (no muscle variant). */
export function machineCoverPrimaryImageSql(machineAlias = 'm'): string {
  return `(
    SELECT ${versionedUrlSql('c')}
    FROM machine_cover_images c
    WHERE c.machine_id = ${machineAlias}.id AND c.target_muscle_group IS NULL
    LIMIT 1
  )`;
}

/**
 * Full COALESCE chain for list/detail when muscle-variant covers are not needed.
 * Cover → gallery → standard type.
 */
export function primaryImageCoalesceSql(machineAlias = 'm'): string {
  return `COALESCE(
    ${machineCoverPrimaryImageSql(machineAlias)},
    ${brandGalleryPrimaryImageSql(machineAlias)},
    ${standardTypePrimaryImageSql(machineAlias)}
  ) AS primary_image_url`;
}
