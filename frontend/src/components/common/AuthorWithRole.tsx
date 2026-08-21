import { getRoleEmoji, type RoleCode } from '@machinefit/shared';

type AuthorWithRoleProps = {
  name?: string | null;
  roleCode?: RoleCode | string | null;
  className?: string;
  /** Fallback when name is empty. Default: — */
  fallback?: string;
  as?: 'span' | 'strong';
};

/**
 * Author display: role emoji only (no role text) + display name.
 * Example: ⚔️ Alice
 */
export function AuthorWithRole({
  name,
  roleCode,
  className,
  fallback = '—',
  as: Tag = 'span',
}: AuthorWithRoleProps) {
  const label = name?.trim() || fallback;
  const emoji = getRoleEmoji(roleCode);

  return (
    <Tag className={className} title={label}>
      <span aria-hidden="true">{emoji}</span>
      {` ${label}`}
    </Tag>
  );
}
