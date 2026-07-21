import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, User } from 'lucide-react';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useAuthStore } from '@/store/auth.store';
import './MemberSelector.css';

/** Top-of-page member picker: view and select only (create/manage is on My Page). */
export function MemberSelector() {
  const { t } = useTranslation(['gyms', 'common']);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {
    members,
    activeMember,
    activeMemberId,
    isLoading,
    isRealGym,
    selectMember,
  } = useActiveMember();

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!isRealGym) setOpen(false);
  }, [isRealGym]);

  if (!isAuthenticated || !isRealGym) return null;

  const label = isLoading
    ? '…'
    : activeMember?.name?.trim()
      ? `${activeMember.name}${activeMember.isSelf ? ` (${t('gyms:members.self')})` : ''}`
      : t('gyms:members.selectMember');

  const handleSelect = (memberId: string) => {
    selectMember(memberId);
    setOpen(false);
  };

  return (
    <div className="member-selector" ref={rootRef}>
      <button
        type="button"
        className="member-selector__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('gyms:members.selectMember')}
        disabled={isLoading}
        onClick={() => setOpen((prev) => !prev)}
      >
        <User size={14} strokeWidth={2} className="member-selector__icon" aria-hidden />
        <span className="member-selector__label">{isLoading ? '…' : label}</span>
        <ChevronDown
          size={14}
          strokeWidth={2.25}
          className={`member-selector__chevron${open ? ' member-selector__chevron--open' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="member-selector__menu" id={menuId} role="listbox">
          <ul className="member-selector__list">
            {members.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={member.id === activeMemberId}
                  className={`member-selector__option${member.id === activeMemberId ? ' member-selector__option--active' : ''}`}
                  onClick={() => handleSelect(member.id)}
                >
                  <span className="member-selector__option-name">
                    {member.name}
                    {member.isSelf ? (
                      <span className="member-selector__self-badge">
                        {' '}({t('gyms:members.self')})
                      </span>
                    ) : null}
                  </span>
                  {member.profileAccess === 'pending' ? (
                    <span className="member-selector__status member-selector__status--pending">
                      {t('gyms:members.pending')}
                    </span>
                  ) : member.profileAccess === 'approved' ? (
                    <span className="member-selector__status member-selector__status--approved">
                      {t('gyms:members.approved')}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
