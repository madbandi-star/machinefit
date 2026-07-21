import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PLAN_LIMITS, type UserGym, type GymMember } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';
import '@/styles/gym-manage.css';

type GymFormMode = 'closed' | 'create' | 'edit';
type MemberFormMode = 'closed' | 'create' | 'edit';

interface GymFormState {
  name: string;
  address: string;
  brandName: string;
}

interface MemberFormState {
  name: string;
  email: string;
  gender: string;
  heightCm: string;
  weightKg: string;
  birthDate: string;
  memo: string;
}

const emptyGymForm = (): GymFormState => ({ name: '', address: '', brandName: '' });
const emptyMemberForm = (): MemberFormState => ({
  name: '',
  email: '',
  gender: '',
  heightCm: '',
  weightKg: '',
  birthDate: '',
  memo: '',
});

function memberToForm(member: GymMember): MemberFormState {
  return {
    name: member.name,
    email: member.email ?? '',
    gender: member.gender ?? '',
    heightCm: member.heightCm != null ? String(member.heightCm) : '',
    weightKg: member.weightKg != null ? String(member.weightKg) : '',
    birthDate: member.birthDate ?? '',
    memo: member.memo ?? '',
  };
}

function gymToForm(gym: UserGym): GymFormState {
  return {
    name: gym.name,
    address: gym.address ?? '',
    brandName: gym.brandName ?? '',
  };
}

export function GymMemberManagePage() {
  const { t } = useTranslation(['gyms', 'common']);
  const {
    gyms,
    activeGymId,
    isLoading: gymsLoading,
    selectGym,
    createGym,
    updateGym,
    removeGym,
  } = useActiveGym();
  const {
    members,
    isLoading: membersLoading,
    isRealGym,
    createMember,
    updateMember,
    removeMember,
  } = useActiveMember();

  const [gymFormMode, setGymFormMode] = useState<GymFormMode>('closed');
  const [editingGymId, setEditingGymId] = useState<string | null>(null);
  const [gymForm, setGymForm] = useState<GymFormState>(emptyGymForm);
  const [gymSubmitting, setGymSubmitting] = useState(false);
  const [pendingDeleteGym, setPendingDeleteGym] = useState<UserGym | null>(null);

  const [memberFormMode, setMemberFormMode] = useState<MemberFormMode>('closed');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<MemberFormState>(emptyMemberForm);
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [pendingDeleteMember, setPendingDeleteMember] = useState<GymMember | null>(null);

  const selectedGym =
    isRealGym && activeGymId
      ? (gyms.find((gym) => gym.id === activeGymId) ?? null)
      : null;

  const freePlanMaxGyms = PLAN_LIMITS.free.maxGyms;
  const freePlanMaxMembers = PLAN_LIMITS.free.maxMembersPerGym;
  const atGymLimit = gyms.length >= freePlanMaxGyms;
  const atMemberLimit = members.length >= freePlanMaxMembers;

  useEffect(() => {
    setMemberFormMode('closed');
    setEditingMemberId(null);
    setMemberForm(emptyMemberForm);
    setPendingDeleteMember(null);
  }, [activeGymId]);

  const openCreateGym = () => {
    setGymFormMode('create');
    setEditingGymId(null);
    setGymForm(emptyGymForm);
  };

  const openEditGym = (gym: UserGym) => {
    setGymFormMode('edit');
    setEditingGymId(gym.id);
    setGymForm(gymToForm(gym));
  };

  const closeGymForm = () => {
    setGymFormMode('closed');
    setEditingGymId(null);
    setGymForm(emptyGymForm);
  };

  const handleGymSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const name = gymForm.name.trim();
    if (!name || gymSubmitting) return;
    setGymSubmitting(true);
    try {
      if (gymFormMode === 'create') {
        await createGym({
          name,
          address: gymForm.address.trim() || undefined,
          brandName: gymForm.brandName.trim() || undefined,
          setActive: true,
        });
      } else if (gymFormMode === 'edit' && editingGymId) {
        await updateGym(editingGymId, {
          name,
          address: gymForm.address.trim() || null,
          brandName: gymForm.brandName.trim() || null,
        });
      }
      closeGymForm();
    } finally {
      setGymSubmitting(false);
    }
  };

  const openCreateMember = () => {
    setMemberFormMode('create');
    setEditingMemberId(null);
    setMemberForm(emptyMemberForm);
  };

  const openEditMember = (member: GymMember) => {
    setMemberFormMode('edit');
    setEditingMemberId(member.id);
    setMemberForm(memberToForm(member));
  };

  const closeMemberForm = () => {
    setMemberFormMode('closed');
    setEditingMemberId(null);
    setMemberForm(emptyMemberForm);
  };

  const handleMemberSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const name = memberForm.name.trim();
    if (!name || memberSubmitting || !isRealGym) return;
    setMemberSubmitting(true);
    try {
      const payload = {
        name,
        email: memberForm.email.trim() || undefined,
        gender: (memberForm.gender as 'male' | 'female') || undefined,
        heightCm: memberForm.heightCm ? Number(memberForm.heightCm) : undefined,
        weightKg: memberForm.weightKg ? Number(memberForm.weightKg) : undefined,
        birthDate: memberForm.birthDate || undefined,
        memo: memberForm.memo.trim() || undefined,
      };
      if (memberFormMode === 'create') {
        await createMember(payload);
      } else if (memberFormMode === 'edit' && editingMemberId) {
        await updateMember(editingMemberId, payload);
      }
      closeMemberForm();
    } finally {
      setMemberSubmitting(false);
    }
  };

  return (
    <div className="gym-manage-page">
      <PageShell
        title={t('gyms:manage.title')}
        subtitle={t('gyms:manage.subtitle')}
        action={
          <Link to={ROUTES.MY_PAGE} className="btn btn--secondary">
            {t('common:actions.back')}
          </Link>
        }
      >
        <section className="gym-manage-section">
          <div className="gym-manage-section__header">
            <h2 className="gym-manage-section__title">{t('gyms:manage.gymsHeading')}</h2>
            {gymFormMode === 'closed' ? (
              <button type="button" className="btn btn--primary" onClick={openCreateGym}>
                {t('gyms:manage.addGym')}
              </button>
            ) : null}
          </div>

          {atGymLimit && gymFormMode === 'closed' ? (
            <p className="gym-manage-hint">{t('gyms:selector.planLimit', { max: freePlanMaxGyms })}</p>
          ) : null}

          {gymFormMode !== 'closed' ? (
            <form className="gym-manage-form" onSubmit={(e) => void handleGymSubmit(e)}>
              <label className="gym-manage-field">
                <span>{t('gyms:selector.gymName')}</span>
                <input
                  value={gymForm.name}
                  onChange={(e) => setGymForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  maxLength={200}
                  autoFocus
                />
              </label>
              <label className="gym-manage-field">
                <span>{t('gyms:selector.address')}</span>
                <input
                  value={gymForm.address}
                  onChange={(e) => setGymForm((prev) => ({ ...prev, address: e.target.value }))}
                  maxLength={500}
                />
              </label>
              <label className="gym-manage-field">
                <span>{t('gyms:selector.brand')}</span>
                <input
                  value={gymForm.brandName}
                  onChange={(e) => setGymForm((prev) => ({ ...prev, brandName: e.target.value }))}
                  maxLength={100}
                />
              </label>
              <div className="gym-manage-form__actions">
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={!gymForm.name.trim() || gymSubmitting}
                >
                  {t('gyms:selector.save')}
                </button>
                <button type="button" className="btn btn--secondary" onClick={closeGymForm}>
                  {t('gyms:members.cancel')}
                </button>
              </div>
            </form>
          ) : null}

          {gymsLoading ? (
            <Skeleton count={2} height={64} />
          ) : gyms.length === 0 ? (
            <p className="gym-manage-empty">{t('gyms:manage.noGyms')}</p>
          ) : (
            <ul className="gym-manage-list">
              {gyms.map((gym) => {
                const isSelected = gym.id === activeGymId;
                return (
                  <li
                    key={gym.id}
                    className={`gym-manage-item${isSelected ? ' gym-manage-item--active' : ''}`}
                  >
                    <button
                      type="button"
                      className="gym-manage-item__main"
                      onClick={() => void selectGym(gym.id)}
                      aria-pressed={isSelected}
                    >
                      <span className="gym-manage-item__name">{gym.name}</span>
                      {gym.brandName ? (
                        <span className="gym-manage-item__meta">{gym.brandName}</span>
                      ) : null}
                      {gym.address ? (
                        <span className="gym-manage-item__meta">{gym.address}</span>
                      ) : null}
                      {isSelected ? (
                        <span className="gym-manage-item__badge">{t('gyms:manage.selected')}</span>
                      ) : null}
                    </button>
                    <div className="gym-manage-item__actions">
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => openEditGym(gym)}
                      >
                        {t('gyms:manage.edit')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => setPendingDeleteGym(gym)}
                      >
                        {t('gyms:members.remove')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="gym-manage-section">
          <div className="gym-manage-section__header">
            <h2 className="gym-manage-section__title">
              {selectedGym
                ? t('gyms:manage.membersHeading', { gymName: selectedGym.name })
                : t('gyms:members.title')}
            </h2>
            {selectedGym && memberFormMode === 'closed' ? (
              <button type="button" className="btn btn--primary" onClick={openCreateMember}>
                {t('gyms:manage.addMember')}
              </button>
            ) : null}
          </div>

          {!selectedGym ? (
            <p className="gym-manage-empty">{t('gyms:manage.selectGymForMembers')}</p>
          ) : (
            <>
              {atMemberLimit && memberFormMode === 'closed' ? (
                <p className="gym-manage-hint">
                  {t('gyms:members.planLimit', { max: freePlanMaxMembers })}
                </p>
              ) : null}

              {memberFormMode !== 'closed' ? (
                <form className="gym-manage-form" onSubmit={(e) => void handleMemberSubmit(e)}>
                  <label className="gym-manage-field">
                    <span>{t('gyms:members.name')}</span>
                    <input
                      value={memberForm.name}
                      onChange={(e) =>
                        setMemberForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                      maxLength={100}
                      autoFocus
                    />
                  </label>
                  <label className="gym-manage-field">
                    <span>{t('gyms:members.email')}</span>
                    <input
                      type="email"
                      value={memberForm.email}
                      onChange={(e) =>
                        setMemberForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      maxLength={200}
                    />
                  </label>
                  {memberForm.email.trim() ? (
                    <p className="gym-manage-hint">{t('gyms:members.emailHint')}</p>
                  ) : null}
                  <label className="gym-manage-field">
                    <span>{t('gyms:members.gender')}</span>
                    <select
                      value={memberForm.gender}
                      onChange={(e) =>
                        setMemberForm((prev) => ({ ...prev, gender: e.target.value }))
                      }
                    >
                      <option value="">-</option>
                      <option value="male">{t('common:auth.genders.male')}</option>
                      <option value="female">{t('common:auth.genders.female')}</option>
                    </select>
                  </label>
                  <label className="gym-manage-field">
                    <span>{t('gyms:members.height')}</span>
                    <input
                      type="number"
                      value={memberForm.heightCm}
                      onChange={(e) =>
                        setMemberForm((prev) => ({ ...prev, heightCm: e.target.value }))
                      }
                      min={50}
                      max={300}
                      step={0.1}
                    />
                  </label>
                  <label className="gym-manage-field">
                    <span>{t('gyms:members.weight')}</span>
                    <input
                      type="number"
                      value={memberForm.weightKg}
                      onChange={(e) =>
                        setMemberForm((prev) => ({ ...prev, weightKg: e.target.value }))
                      }
                      min={20}
                      max={500}
                      step={0.1}
                    />
                  </label>
                  <label className="gym-manage-field">
                    <span>{t('gyms:members.birthDate')}</span>
                    <input
                      type="date"
                      value={memberForm.birthDate}
                      onChange={(e) =>
                        setMemberForm((prev) => ({ ...prev, birthDate: e.target.value }))
                      }
                    />
                  </label>
                  <label className="gym-manage-field">
                    <span>{t('gyms:members.memo')}</span>
                    <textarea
                      value={memberForm.memo}
                      onChange={(e) =>
                        setMemberForm((prev) => ({ ...prev, memo: e.target.value }))
                      }
                      rows={2}
                      maxLength={500}
                    />
                  </label>
                  <div className="gym-manage-form__actions">
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={!memberForm.name.trim() || memberSubmitting}
                    >
                      {t('gyms:members.save')}
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={closeMemberForm}>
                      {t('gyms:members.cancel')}
                    </button>
                  </div>
                </form>
              ) : null}

              {membersLoading ? (
                <Skeleton count={2} height={56} />
              ) : members.length === 0 ? (
                <p className="gym-manage-empty">{t('gyms:manage.noMembers')}</p>
              ) : (
                <ul className="gym-manage-list">
                  {members.map((member) => (
                    <li key={member.id} className="gym-manage-item">
                      <div className="gym-manage-item__main gym-manage-item__main--static">
                        <span className="gym-manage-item__name">
                          {member.name}
                          {member.isSelf ? (
                            <span className="gym-manage-item__self">
                              {' '}
                              ({t('gyms:members.self')})
                            </span>
                          ) : null}
                        </span>
                        {member.profileAccess === 'pending' ? (
                          <span className="gym-manage-item__meta">
                            {t('gyms:members.pending')}
                          </span>
                        ) : member.profileAccess === 'approved' ? (
                          <span className="gym-manage-item__meta">
                            {t('gyms:members.approved')}
                          </span>
                        ) : null}
                        {member.email ? (
                          <span className="gym-manage-item__meta">{member.email}</span>
                        ) : null}
                      </div>
                      <div className="gym-manage-item__actions">
                        <button
                          type="button"
                          className="btn btn--secondary"
                          onClick={() => openEditMember(member)}
                        >
                          {t('gyms:manage.edit')}
                        </button>
                        {!member.isSelf ? (
                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => setPendingDeleteMember(member)}
                          >
                            {t('gyms:members.remove')}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </PageShell>

      <ConfirmDialog
        open={Boolean(pendingDeleteGym)}
        title={t('gyms:manage.removeGymTitle')}
        message={t('gyms:manage.removeGymMessage', { name: pendingDeleteGym?.name ?? '' })}
        confirmLabel={t('gyms:members.remove')}
        confirmVariant="danger"
        onClose={() => setPendingDeleteGym(null)}
        onConfirm={() => {
          const gym = pendingDeleteGym;
          setPendingDeleteGym(null);
          if (gym) void removeGym(gym.id);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteMember)}
        title={t('gyms:manage.removeMemberTitle')}
        message={t('gyms:manage.removeMemberMessage', {
          name: pendingDeleteMember?.name ?? '',
        })}
        confirmLabel={t('gyms:members.remove')}
        confirmVariant="danger"
        onClose={() => setPendingDeleteMember(null)}
        onConfirm={() => {
          const member = pendingDeleteMember;
          setPendingDeleteMember(null);
          if (member) void removeMember(member.id);
        }}
      />
    </div>
  );
}
