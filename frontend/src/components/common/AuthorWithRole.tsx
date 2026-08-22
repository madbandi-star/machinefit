import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Role,
  getAuthorBadgeEmoji,
  getHellpowerLevel,
  getRoleEmoji,
  type RoleCode,
} from '@machinefit/shared';
import { pointsApi } from '@/api/points.api';
import './AuthorWithRole.css';

type AuthorWithRoleProps = {
  name?: string | null;
  roleCode?: RoleCode | string | null;
  /** MEMBER 헬창력 balance — used for badge emoji; never rendered as a number here. */
  hellpowerScore?: number | null;
  className?: string;
  fallback?: string;
  as?: 'span' | 'strong';
};

/**
 * Author line: display name + badge emoji (no score digits).
 * MEMBER → 헬창력 30단 emoji (click/tap opens title + top %).
 * Other roles → ROLE_EMOJI (premium ⚜️, …).
 */
export function AuthorWithRole({
  name,
  roleCode,
  hellpowerScore,
  className,
  fallback = '—',
  as: Tag = 'span',
}: AuthorWithRoleProps) {
  const { t } = useTranslation();
  const label = name?.trim() || fallback;
  const isMember = roleCode === Role.MEMBER;
  const emoji = isMember
    ? getAuthorBadgeEmoji(Role.MEMBER, hellpowerScore)
    : getRoleEmoji(roleCode);
  const level = isMember ? getHellpowerLevel(hellpowerScore) : null;
  const ariaLabel = isMember
    ? t('points.hellpower.badgeAria', { title: level?.title ?? '' })
    : t('points.hellpower.roleBadgeAria', { role: String(roleCode ?? '') });

  const [open, setOpen] = useState(false);
  const [topPercent, setTopPercent] = useState<number | null>(null);
  const [lookupPending, setLookupPending] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !isMember) return;
    let cancelled = false;
    const score = hellpowerScore ?? 0;
    setLookupPending(true);
    void pointsApi
      .hellpowerLookup(score)
      .then((res) => {
        if (cancelled) return;
        setTopPercent(res.data.data.topPercent ?? null);
      })
      .catch(() => {
        if (!cancelled) setTopPercent(null);
      })
      .finally(() => {
        if (!cancelled) setLookupPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isMember, hellpowerScore]);

  return (
    <span
      ref={rootRef}
      className={`author-with-role${className ? ` ${className}` : ''}`}
    >
      <Tag className="author-with-role__name">{label}</Tag>
      {isMember ? (
        <button
          type="button"
          className={`author-with-role__badge${open ? ' is-open' : ''}`}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={popoverId}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <span aria-hidden="true">{emoji}</span>
        </button>
      ) : (
        <span
          className="author-with-role__badge author-with-role__badge--static"
          aria-label={ariaLabel}
        >
          <span aria-hidden="true">{emoji}</span>
        </span>
      )}
      {open && isMember && level ? (
        <span
          id={popoverId}
          className="author-with-role__popover"
          role="dialog"
          aria-label={ariaLabel}
        >
          <span className="author-with-role__popover-title">
            <span aria-hidden="true">{level.emoji}</span> {level.title}
          </span>
          {lookupPending ? (
            <span className="author-with-role__popover-meta">
              {t('points.hellpower.loadingRank')}
            </span>
          ) : topPercent != null ? (
            <span className="author-with-role__popover-meta">
              {t('points.hellpower.topPercent', { percent: topPercent })}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
