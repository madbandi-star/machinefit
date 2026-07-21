import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, User } from 'lucide-react';
import { PLAN_LIMITS } from '@machinefit/shared';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useAuthStore } from '@/store/auth.store';
import './MemberSelector.css';

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
    createMember,
  } = useActiveMember();

  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const freePlanMax = PLAN_LIMITS.free.maxMembersPerGym;
  const premiumPlanMax = PLAN_LIMITS.premium.maxMembersPerGym;
  const atFreeLimit = members.length >= freePlanMax;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setShowForm(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setShowForm(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Close when gym changes to 'all' or is cleared
  useEffect(() => {
    if (!isRealGym) {
      setOpen(false);
      setShowForm(false);
    }
  }, [isRealGym]);

  if (!isAuthenticated || !isRealGym) return null;

  const label = activeMember
    ? `${activeMember.name}${activeMember.isSelf ? ` (${t('gyms:members.self')})` : ''}`
    : t('gyms:members.selectMember');

  const handleSelect = (memberId: string) => {
    selectMember(memberId);
    setOpen(false);
    setShowForm(false);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setGender('');
    setHeightCm('');
    setWeightKg('');
    setBirthDate('');
    setMemo('');
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await createMember({
        name: trimmed,
        email: email.trim() || undefined,
        gender: (gender as 'male' | 'female') || undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        birthDate: birthDate || undefined,
        memo: memo.trim() || undefined,
      });
      resetForm();
      setShowForm(false);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
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

          {!showForm ? (
            <div>
              {atFreeLimit && (
                <p className="member-selector__limit-hint">
                  {t('gyms:members.planLimit', { max: freePlanMax })}
                </p>
              )}
              <button
                type="button"
                className="member-selector__add"
                onClick={() => setShowForm(true)}
              >
                {t('gyms:members.addMember')}
              </button>
              {atFreeLimit && (
                <p className="member-selector__upgrade-hint">
                  {t('gyms:selector.upgradeForMore', { max: premiumPlanMax })}
                </p>
              )}
            </div>
          ) : (
            <form className="member-selector__form" onSubmit={(e) => void handleCreate(e)}>
              <label className="member-selector__field">
                <span>{t('gyms:members.name')}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  autoFocus
                />
              </label>
              <label className="member-selector__field">
                <span>{t('gyms:members.email')}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={200}
                  placeholder="optional"
                />
              </label>
              {email.trim() && (
                <p className="member-selector__email-hint">{t('gyms:members.emailHint')}</p>
              )}
              <label className="member-selector__field">
                <span>{t('gyms:members.gender')}</span>
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">-</option>
                  <option value="male">{t('common:auth.genders.male')}</option>
                  <option value="female">{t('common:auth.genders.female')}</option>
                </select>
              </label>
              <label className="member-selector__field">
                <span>{t('gyms:members.height')}</span>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  min={50}
                  max={300}
                  step={0.1}
                />
              </label>
              <label className="member-selector__field">
                <span>{t('gyms:members.weight')}</span>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  min={20}
                  max={500}
                  step={0.1}
                />
              </label>
              <label className="member-selector__field">
                <span>{t('gyms:members.birthDate')}</span>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </label>
              <label className="member-selector__field">
                <span>{t('gyms:members.memo')}</span>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={2}
                  maxLength={500}
                />
              </label>
              <div className="member-selector__form-actions">
                <button
                  type="submit"
                  className="btn btn--primary member-selector__save"
                  disabled={!name.trim() || submitting}
                >
                  {t('gyms:members.save')}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary member-selector__cancel"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  {t('gyms:members.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
