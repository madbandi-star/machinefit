import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEffectivePlanLimits, type UserGym, type GymMember, type Gender } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { GenderPicker } from '@/components/settings/GenderPicker/GenderPicker';
import {
  emptyLocationValue,
  LocationPicker,
  locationValueFromRef,
  type LocationPickerValue,
} from '@/components/location/LocationPicker';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';
import '@/styles/gym-manage.css';

type GymFormMode = 'closed' | 'create' | 'edit';
type MemberFormMode = 'closed' | 'create' | 'edit';

interface GymFormState {
  name: string;
  address: string;
  brandName: string;
  phone: string;
  websiteUrl: string;
  location: LocationPickerValue;
}

interface MemberFormState {
  name: string;
  email: string;
  gender: Gender | undefined;
  heightCm: string;
  weightKg: string;
  birthDate: string;
  memo: string;
}

const emptyGymForm = (): GymFormState => ({
  name: '',
  address: '',
  brandName: '',
  phone: '',
  websiteUrl: '',
  location: emptyLocationValue(),
});

const emptyMemberForm = (): MemberFormState => ({
  name: '',
  email: '',
  gender: undefined,
  heightCm: '',
  weightKg: '',
  birthDate: '',
  memo: '',
});

function memberToForm(member: GymMember): MemberFormState {
  return {
    name: member.name,
    email: member.email ?? '',
    gender: member.gender ?? undefined,
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
    phone: gym.phone ?? '',
    websiteUrl: gym.websiteUrl ?? '',
    location: locationValueFromRef(gym.location),
  };
}

function hasRequiredGymLocation(loc: LocationPickerValue): boolean {
  return Boolean(loc.countryCode && loc.stateId && loc.cityId);
}

function gymHasExtras(form: GymFormState): boolean {
  return Boolean(
    form.brandName.trim() ||
      form.address.trim() ||
      form.phone.trim() ||
      form.websiteUrl.trim()
  );
}

function memberHasExtras(form: MemberFormState): boolean {
  return Boolean(
    form.email.trim() ||
      form.gender ||
      form.heightCm ||
      form.weightKg ||
      form.birthDate ||
      form.memo.trim()
  );
}

function memberInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.slice(0, 1).toUpperCase();
}

export function GymMemberManagePage() {
  const { t } = useTranslation(['gyms', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
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
  const [gymExtrasOpen, setGymExtrasOpen] = useState(false);
  const [gymSubmitting, setGymSubmitting] = useState(false);
  const [pendingDeleteGym, setPendingDeleteGym] = useState<UserGym | null>(null);

  const [memberFormMode, setMemberFormMode] = useState<MemberFormMode>('closed');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<MemberFormState>(emptyMemberForm);
  const [memberExtrasOpen, setMemberExtrasOpen] = useState(false);
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [pendingDeleteMember, setPendingDeleteMember] = useState<GymMember | null>(null);

  const selectedGym =
    isRealGym && activeGymId
      ? (gyms.find((gym) => gym.id === activeGymId) ?? null)
      : null;

  const planLimits = getEffectivePlanLimits(user?.subscriptionPlan, user?.roleCode);
  const planMaxGyms = planLimits.maxGyms;
  const planMaxMembers = planLimits.maxMembersPerGym;
  const atGymLimit = gyms.length >= planMaxGyms;
  const atMemberLimit = members.length >= planMaxMembers;

  useEffect(() => {
    setMemberFormMode('closed');
    setEditingMemberId(null);
    setMemberForm(emptyMemberForm);
    setMemberExtrasOpen(false);
    setPendingDeleteMember(null);
  }, [activeGymId]);

  const openCreateGym = () => {
    setGymFormMode('create');
    setEditingGymId(null);
    setGymForm(emptyGymForm);
    setGymExtrasOpen(false);
  };

  const openEditGym = (gym: UserGym) => {
    const next = gymToForm(gym);
    setGymFormMode('edit');
    setEditingGymId(gym.id);
    setGymForm(next);
    setGymExtrasOpen(gymHasExtras(next));
  };

  const closeGymForm = () => {
    setGymFormMode('closed');
    setEditingGymId(null);
    setGymForm(emptyGymForm);
    setGymExtrasOpen(false);
  };

  const handleGymSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const name = gymForm.name.trim();
    if (!name || gymSubmitting) return;
    if (!hasRequiredGymLocation(gymForm.location)) {
      showToast(t('gyms:manage.locationRequired'), 'error');
      return;
    }
    setGymSubmitting(true);
    try {
      const locationPayload = {
        countryCode: gymForm.location.countryCode,
        stateId: gymForm.location.stateId,
        cityId: gymForm.location.cityId,
        districtId: gymForm.location.districtId,
        districtName: gymForm.location.districtName || null,
        postalCode: gymForm.location.postalCode || null,
        latitude: gymForm.location.latitude,
        longitude: gymForm.location.longitude,
      };
      if (gymFormMode === 'create') {
        await createGym({
          name,
          address: gymForm.address.trim() || undefined,
          brandName: gymForm.brandName.trim() || undefined,
          phone: gymForm.phone.trim() || undefined,
          websiteUrl: gymForm.websiteUrl.trim() || undefined,
          setActive: true,
          requireLocation: true,
          ...locationPayload,
        });
      } else if (gymFormMode === 'edit' && editingGymId) {
        await updateGym(editingGymId, {
          name,
          address: gymForm.address.trim() || null,
          brandName: gymForm.brandName.trim() || null,
          phone: gymForm.phone.trim() || null,
          websiteUrl: gymForm.websiteUrl.trim() || null,
          ...locationPayload,
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
    setMemberExtrasOpen(false);
  };

  const openEditMember = (member: GymMember) => {
    const next = memberToForm(member);
    setMemberFormMode('edit');
    setEditingMemberId(member.id);
    setMemberForm(next);
    setMemberExtrasOpen(memberHasExtras(next));
  };

  const closeMemberForm = () => {
    setMemberFormMode('closed');
    setEditingMemberId(null);
    setMemberForm(emptyMemberForm);
    setMemberExtrasOpen(false);
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
        gender: memberForm.gender,
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
        <div className="settings-stack">
          <section className="form-section gym-manage-panel">
            <div className="gym-manage-panel__header">
              <div className="gym-manage-panel__heading">
                <h2 className="form-section__title">{t('gyms:manage.gymsHeading')}</h2>
                <p className="form-section__desc gym-manage-panel__desc">
                  {t('gyms:manage.gymsDesc')}
                </p>
              </div>
              <div className="gym-manage-panel__tools">
                <span className="gym-manage-count" aria-label={t('gyms:manage.gymCountLabel')}>
                  {gyms.length}/{planMaxGyms}
                </span>
                {gymFormMode === 'closed' && !atGymLimit ? (
                  <button type="button" className="btn btn--primary" onClick={openCreateGym}>
                    {t('gyms:manage.addGym')}
                  </button>
                ) : null}
              </div>
            </div>

            {atGymLimit && gymFormMode === 'closed' ? (
              <p className="gym-manage-hint gym-manage-hint--warn">
                {t('gyms:selector.planLimit', { max: planMaxGyms })}
              </p>
            ) : null}

            {gymFormMode !== 'closed' ? (
              <form
                className="gym-manage-editor"
                onSubmit={(e) => void handleGymSubmit(e)}
                aria-label={
                  gymFormMode === 'create'
                    ? t('gyms:manage.createGymTitle')
                    : t('gyms:manage.editGymTitle')
                }
              >
                <div className="gym-manage-editor__title">
                  {gymFormMode === 'create'
                    ? t('gyms:manage.createGymTitle')
                    : t('gyms:manage.editGymTitle')}
                </div>

                <label className="form-field">
                  <span className="form-field__label">{t('gyms:selector.gymName')}</span>
                  <input
                    className="input"
                    value={gymForm.name}
                    onChange={(e) => setGymForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    maxLength={200}
                    autoFocus
                    placeholder={t('gyms:manage.gymNamePlaceholder')}
                  />
                </label>

                <div className="form-field">
                  <span className="form-field__label">{t('gyms:manage.locationHeading')}</span>
                  <p className="gym-manage-hint">{t('gyms:manage.locationThenGymHint')}</p>
                  <LocationPicker
                    value={gymForm.location}
                    onChange={(location) => setGymForm((prev) => ({ ...prev, location }))}
                    showDistrict
                    showPostal
                    showGps
                    required
                  />
                </div>

                <button
                  type="button"
                  className="gym-manage-toggle"
                  aria-expanded={gymExtrasOpen}
                  onClick={() => setGymExtrasOpen((open) => !open)}
                >
                  {gymExtrasOpen
                    ? t('gyms:manage.hideOptional')
                    : t('gyms:manage.showOptional')}
                </button>

                {gymExtrasOpen ? (
                  <div className="gym-manage-extras form-stack">
                    <label className="form-field">
                      <span className="form-field__label">{t('gyms:selector.brand')}</span>
                      <input
                        className="input"
                        value={gymForm.brandName}
                        onChange={(e) =>
                          setGymForm((prev) => ({ ...prev, brandName: e.target.value }))
                        }
                        maxLength={100}
                      />
                    </label>
                    <label className="form-field">
                      <span className="form-field__label">{t('gyms:locationOptionalDetail')}</span>
                      <input
                        className="input"
                        value={gymForm.address}
                        onChange={(e) =>
                          setGymForm((prev) => ({ ...prev, address: e.target.value }))
                        }
                        maxLength={500}
                        placeholder={t('gyms:selector.address')}
                      />
                    </label>
                    <div className="gym-manage-grid">
                      <label className="form-field">
                        <span className="form-field__label">{t('gyms:phone')}</span>
                        <input
                          className="input"
                          value={gymForm.phone}
                          onChange={(e) =>
                            setGymForm((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          maxLength={30}
                          inputMode="tel"
                        />
                      </label>
                      <label className="form-field">
                        <span className="form-field__label">{t('gyms:website')}</span>
                        <input
                          className="input"
                          value={gymForm.websiteUrl}
                          onChange={(e) =>
                            setGymForm((prev) => ({ ...prev, websiteUrl: e.target.value }))
                          }
                          maxLength={500}
                          placeholder="https://"
                          inputMode="url"
                        />
                      </label>
                    </div>
                  </div>
                ) : null}

                <div className="gym-manage-editor__actions">
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={
                      !gymForm.name.trim() ||
                      gymSubmitting ||
                      !hasRequiredGymLocation(gymForm.location)
                    }
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
              <Skeleton count={2} height={72} />
            ) : gyms.length === 0 && gymFormMode === 'closed' ? (
              <div className="empty-state empty-state--compact">
                <p className="empty-state__title">{t('gyms:manage.noGyms')}</p>
                <p className="empty-state__hint">{t('gyms:manage.noGymsHint')}</p>
                {!atGymLimit ? (
                  <div className="empty-state__action">
                    <button type="button" className="btn btn--primary" onClick={openCreateGym}>
                      {t('gyms:manage.addGym')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : gyms.length > 0 ? (
              <ul className="gym-manage-list">
                {gyms.map((gym) => {
                  const isSelected = gym.id === activeGymId;
                  return (
                    <li
                      key={gym.id}
                      className={`gym-manage-row${isSelected ? ' gym-manage-row--active' : ''}`}
                    >
                      <button
                        type="button"
                        className="gym-manage-row__select"
                        onClick={() => void selectGym(gym.id)}
                        aria-pressed={isSelected}
                      >
                        <span className="gym-manage-avatar" aria-hidden>
                          {memberInitial(gym.name)}
                        </span>
                        <span className="gym-manage-row__body">
                          <span className="gym-manage-row__name">{gym.name}</span>
                          <span className="gym-manage-row__meta">
                            {gym.brandName
                              ? `${gym.brandName} · `
                              : ''}
                            {gym.location?.label?.path || t('gyms:noLocationLabel')}
                          </span>
                        </span>
                        {isSelected ? (
                          <span className="gym-manage-pill">{t('gyms:manage.selected')}</span>
                        ) : (
                          <span className="gym-manage-row__hint">{t('gyms:manage.tapToSelect')}</span>
                        )}
                      </button>
                      <div className="gym-manage-row__actions">
                        <button
                          type="button"
                          className="gym-manage-link-btn"
                          onClick={() => openEditGym(gym)}
                        >
                          {t('gyms:manage.edit')}
                        </button>
                        <button
                          type="button"
                          className="gym-manage-link-btn gym-manage-link-btn--danger"
                          onClick={() => setPendingDeleteGym(gym)}
                        >
                          {t('gyms:members.remove')}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>

          <section className="form-section gym-manage-panel">
            <div className="gym-manage-panel__header">
              <div className="gym-manage-panel__heading">
                <h2 className="form-section__title">
                  {selectedGym
                    ? t('gyms:manage.membersHeading', { gymName: selectedGym.name })
                    : t('gyms:members.title')}
                </h2>
                <p className="form-section__desc gym-manage-panel__desc">
                  {selectedGym
                    ? t('gyms:manage.membersDesc')
                    : t('gyms:manage.selectGymForMembers')}
                </p>
              </div>
              {selectedGym ? (
                <div className="gym-manage-panel__tools">
                  <span className="gym-manage-count">
                    {members.length}/{planMaxMembers}
                  </span>
                  {memberFormMode === 'closed' && !atMemberLimit ? (
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={openCreateMember}
                    >
                      {t('gyms:manage.addMember')}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {!selectedGym ? (
              <div className="empty-state empty-state--compact">
                <p className="empty-state__hint">{t('gyms:manage.selectGymForMembers')}</p>
              </div>
            ) : (
              <>
                {atMemberLimit && memberFormMode === 'closed' ? (
                  <p className="gym-manage-hint gym-manage-hint--warn">
                    {t('gyms:members.planLimit', { max: planMaxMembers })}
                  </p>
                ) : null}

                {memberFormMode !== 'closed' ? (
                  <form
                    className="gym-manage-editor"
                    onSubmit={(e) => void handleMemberSubmit(e)}
                    aria-label={
                      memberFormMode === 'create'
                        ? t('gyms:manage.createMemberTitle')
                        : t('gyms:manage.editMemberTitle')
                    }
                  >
                    <div className="gym-manage-editor__title">
                      {memberFormMode === 'create'
                        ? t('gyms:manage.createMemberTitle')
                        : t('gyms:manage.editMemberTitle')}
                    </div>

                    <label className="form-field">
                      <span className="form-field__label">{t('gyms:members.name')}</span>
                      <input
                        className="input"
                        value={memberForm.name}
                        onChange={(e) =>
                          setMemberForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                        maxLength={100}
                        autoFocus
                        placeholder={t('gyms:manage.memberNamePlaceholder')}
                      />
                    </label>

                    <button
                      type="button"
                      className="gym-manage-toggle"
                      aria-expanded={memberExtrasOpen}
                      onClick={() => setMemberExtrasOpen((open) => !open)}
                    >
                      {memberExtrasOpen
                        ? t('gyms:manage.hideOptional')
                        : t('gyms:manage.showOptional')}
                    </button>

                    {memberExtrasOpen ? (
                      <div className="gym-manage-extras form-stack">
                        <label className="form-field">
                          <span className="form-field__label">{t('gyms:members.email')}</span>
                          <input
                            className="input"
                            type="email"
                            value={memberForm.email}
                            onChange={(e) =>
                              setMemberForm((prev) => ({ ...prev, email: e.target.value }))
                            }
                            maxLength={200}
                            placeholder="name@email.com"
                          />
                          {memberForm.email.trim() ? (
                            <span className="gym-manage-hint">{t('gyms:members.emailHint')}</span>
                          ) : null}
                        </label>

                        <GenderPicker
                          value={memberForm.gender}
                          onChange={(gender) =>
                            setMemberForm((prev) => ({ ...prev, gender }))
                          }
                          compact
                        />

                        <div className="gym-manage-grid">
                          <label className="form-field">
                            <span className="form-field__label">{t('gyms:members.height')}</span>
                            <input
                              className="input"
                              type="number"
                              value={memberForm.heightCm}
                              onChange={(e) =>
                                setMemberForm((prev) => ({
                                  ...prev,
                                  heightCm: e.target.value,
                                }))
                              }
                              min={50}
                              max={300}
                              step={0.1}
                              inputMode="decimal"
                              placeholder="170"
                            />
                          </label>
                          <label className="form-field">
                            <span className="form-field__label">{t('gyms:members.weight')}</span>
                            <input
                              className="input"
                              type="number"
                              value={memberForm.weightKg}
                              onChange={(e) =>
                                setMemberForm((prev) => ({
                                  ...prev,
                                  weightKg: e.target.value,
                                }))
                              }
                              min={20}
                              max={500}
                              step={0.1}
                              inputMode="decimal"
                              placeholder="70"
                            />
                          </label>
                        </div>

                        <label className="form-field">
                          <span className="form-field__label">{t('gyms:members.birthDate')}</span>
                          <input
                            className="input"
                            type="date"
                            value={memberForm.birthDate}
                            onChange={(e) =>
                              setMemberForm((prev) => ({
                                ...prev,
                                birthDate: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="form-field">
                          <span className="form-field__label">{t('gyms:members.memo')}</span>
                          <textarea
                            className="input gym-manage-textarea"
                            value={memberForm.memo}
                            onChange={(e) =>
                              setMemberForm((prev) => ({ ...prev, memo: e.target.value }))
                            }
                            rows={3}
                            maxLength={500}
                            placeholder={t('gyms:manage.memoPlaceholder')}
                          />
                        </label>
                      </div>
                    ) : null}

                    <div className="gym-manage-editor__actions">
                      <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={!memberForm.name.trim() || memberSubmitting}
                      >
                        {t('gyms:members.save')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={closeMemberForm}
                      >
                        {t('gyms:members.cancel')}
                      </button>
                    </div>
                  </form>
                ) : null}

                {membersLoading ? (
                  <Skeleton count={2} height={64} />
                ) : members.length === 0 && memberFormMode === 'closed' ? (
                  <div className="empty-state empty-state--compact">
                    <p className="empty-state__title">{t('gyms:manage.noMembers')}</p>
                    <p className="empty-state__hint">{t('gyms:manage.noMembersHint')}</p>
                    {!atMemberLimit ? (
                      <div className="empty-state__action">
                        <button
                          type="button"
                          className="btn btn--primary"
                          onClick={openCreateMember}
                        >
                          {t('gyms:manage.addMember')}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : members.length > 0 ? (
                  <ul className="gym-manage-list">
                    {members.map((member) => (
                      <li key={member.id} className="gym-manage-row gym-manage-row--static">
                        <div className="gym-manage-row__select gym-manage-row__select--static">
                          <span className="gym-manage-avatar" aria-hidden>
                            {memberInitial(member.name)}
                          </span>
                          <span className="gym-manage-row__body">
                            <span className="gym-manage-row__name">
                              {member.name}
                              {member.isSelf ? (
                                <span className="gym-manage-row__self">
                                  {' '}
                                  · {t('gyms:members.self')}
                                </span>
                              ) : null}
                            </span>
                            <span className="gym-manage-row__meta">
                              {[
                                member.profileAccess === 'pending'
                                  ? t('gyms:members.pending')
                                  : member.profileAccess === 'approved'
                                    ? t('gyms:members.approved')
                                    : null,
                                member.email || null,
                              ]
                                .filter(Boolean)
                                .join(' · ') || t('gyms:manage.memberNoExtra')}
                            </span>
                          </span>
                        </div>
                        <div className="gym-manage-row__actions">
                          <button
                            type="button"
                            className="gym-manage-link-btn"
                            onClick={() => openEditMember(member)}
                          >
                            {t('gyms:manage.edit')}
                          </button>
                          {!member.isSelf ? (
                            <button
                              type="button"
                              className="gym-manage-link-btn gym-manage-link-btn--danger"
                              onClick={() => setPendingDeleteMember(member)}
                            >
                              {t('gyms:members.remove')}
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </section>
        </div>
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
