import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  PUSH_EVENT_KINDS,
  PUSH_MARKETING_KINDS,
  PUSH_SERVICE_KINDS,
  ROLE_CODES,
  Role,
  detectMarketingContent,
  getPushConsentCategoryForKind,
  hasMinRole,
  type PushAudienceInput,
  type PushAudienceType,
  type PushKind,
  type RoleCode,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import {
  LocationPicker,
  emptyLocationValue,
  type LocationPickerValue,
} from '@/components/location/LocationPicker';
import { pushNotificationApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import '@/styles/push.css';

type Tab = 'compose' | 'history';

type AudiencePreset =
  | 'all_users'
  | 'role'
  | 'gym'
  | 'location'
  | 'user_ids'
  | 'owner_gym_trainers'
  | 'owner_gym_members'
  | 'owner_premium'
  | 'owner_vip'
  | 'owner_pick_trainer'
  | 'owner_pick_member'
  | 'trainer_clients'
  | 'trainer_pick'
  | 'member_exact';

function isMemberTierRole(role: RoleCode): boolean {
  return (
    role === Role.MEMBER ||
    role === Role.PREMIUM_MEMBER ||
    role === Role.VIP_MEMBER
  );
}

function presetsForRole(role: RoleCode, allowed: PushAudienceType[]): AudiencePreset[] {
  if (hasMinRole(role, Role.ADMIN)) {
    return ['all_users', 'role', 'gym', 'location', 'user_ids'];
  }
  if (hasMinRole(role, Role.OWNER)) {
    const base: AudiencePreset[] = [];
    if (allowed.includes('owner_gym_trainers')) base.push('owner_gym_trainers');
    if (allowed.includes('owner_gym_members')) {
      base.push('owner_gym_members', 'owner_premium', 'owner_vip');
    }
    if (allowed.includes('user_ids')) {
      base.push('owner_pick_trainer', 'owner_pick_member');
    }
    return base;
  }
  if (hasMinRole(role, Role.TRAINER)) {
    const base: AudiencePreset[] = [];
    if (allowed.includes('trainer_clients')) base.push('trainer_clients');
    if (allowed.includes('user_ids')) base.push('trainer_pick');
    return base;
  }
  if (allowed.includes('member_exact')) return ['member_exact'];
  return [];
}

function parseUserIds(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function PushPreview({
  kind,
  title,
  body,
  audienceLabel,
}: {
  kind: PushKind;
  title: string;
  body: string;
  audienceLabel: string;
}) {
  const { t } = useTranslation('push');
  const previewTitle = title.trim() || t('previewTitlePlaceholder');
  const previewBody = body.trim() || t('previewBodyPlaceholder');

  return (
    <div className="push-preview" aria-live="polite">
      <p className="push-preview__label">{t('previewLabel')}</p>
      <div className="push-preview__card">
        <div className="push-preview__app-row">
          <span className="push-preview__app">MachineFit</span>
          <span className="push-preview__kind">{t(`kinds.${kind}`)}</span>
        </div>
        <p className="push-preview__title">{previewTitle}</p>
        <p className="push-preview__body">{previewBody}</p>
        <p className="push-preview__to">{t('previewTo', { target: audienceLabel })}</p>
      </div>
    </div>
  );
}

export function PushComposePage() {
  const { t } = useTranslation('push');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [tab, setTab] = useState<Tab>('compose');
  const [kind, setKind] = useState<PushKind>('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [preset, setPreset] = useState<AudiencePreset | ''>('');
  const [roleCode, setRoleCode] = useState<RoleCode>(Role.MEMBER);
  const [gymId, setGymId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userIdInput, setUserIdInput] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [location, setLocation] = useState<LocationPickerValue>(emptyLocationValue());
  const [adminAll, setAdminAll] = useState(false);
  const [openLogsId, setOpenLogsId] = useState<string | null>(null);

  const capsQuery = useQuery({
    queryKey: QUERY_KEYS.pushCapabilities,
    queryFn: async () => (await pushNotificationApi.capabilities()).data.data,
  });

  const campaignsQuery = useQuery({
    queryKey: QUERY_KEYS.pushCampaigns({ all: adminAll }),
    queryFn: async () =>
      (await pushNotificationApi.listCampaigns({ all: adminAll, limit: 50 })).data.data,
    enabled: tab === 'history',
  });

  const logsQuery = useQuery({
    queryKey: QUERY_KEYS.pushCampaignLogs(openLogsId ?? ''),
    queryFn: async () =>
      (await pushNotificationApi.listCampaignLogs(openLogsId!)).data.data,
    enabled: Boolean(openLogsId),
  });

  const caps = capsQuery.data;
  const senderRole = caps?.senderRole ?? Role.MEMBER;
  const presets = useMemo(
    () => (caps ? presetsForRole(caps.senderRole, caps.allowedAudienceTypes) : []),
    [caps]
  );

  useEffect(() => {
    if (!presets.length) return;
    if (preset && presets.includes(preset)) return;
    setPreset(presets[0]!);
    setSelectedIds([]);
  }, [presets, preset]);

  const suggested = caps?.suggestedRecipients ?? [];
  const suggestedTrainers = suggested.filter((u) => u.roleCode === Role.TRAINER);
  const suggestedMembers = suggested.filter((u) => isMemberTierRole(u.roleCode));

  const pickList =
    preset === 'owner_pick_trainer'
      ? suggestedTrainers
      : preset === 'owner_pick_member' || preset === 'trainer_pick'
        ? suggestedMembers
        : suggested;

  const audienceLabel = useMemo(() => {
    if (!preset) return t('previewAudienceUnset');
    if (preset === 'member_exact') {
      const friend = suggested.find((u) => u.id === selectedMemberId);
      if (friend) return friend.displayName;
      if (memberQuery.trim()) return memberQuery.trim();
    }
    const isPickPreset =
      preset === 'user_ids' ||
      preset === 'owner_pick_trainer' ||
      preset === 'owner_pick_member' ||
      preset === 'trainer_pick';
    if (isPickPreset && selectedIds.length > 0) {
      return t('selectedCount', { count: selectedIds.length });
    }
    return t(`presets.${preset}`);
  }, [preset, selectedMemberId, memberQuery, suggested, selectedIds.length, t]);

  const consentCategory = getPushConsentCategoryForKind(kind);
  const marketingAsServiceWarning =
    consentCategory === 'service' && detectMarketingContent(title, body);

  const sendMutation = useMutation({
    mutationFn: (audience: PushAudienceInput) =>
      pushNotificationApi.send({
        kind,
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || null,
        deepLink: deepLink.trim() || null,
        audience,
      }),
    onSuccess: (res) => {
      const data = res.data.data;
      showToast(
        t('sent', {
          delivered: data.delivered,
          failed: data.failed,
          skipped: data.skipped,
          consentExcluded: data.consentExcluded ?? 0,
        }),
        'success'
      );
      setTitle('');
      setBody('');
      setImageUrl('');
      setDeepLink('');
      setSelectedIds([]);
      setUserIdInput('');
      setMemberQuery('');
      setSelectedMemberId('');
      queryClient.invalidateQueries({ queryKey: ['push', 'campaigns'] });
      setTab('history');
    },
    onError: (error) => {
      let message = t('error');
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          message = t('networkError');
        } else {
          const code = (error.response.data as { error?: { code?: string } } | undefined)?.error
            ?.code;
          if (code === 'NO_RECIPIENTS') message = t('noRecipients');
          else if (code === 'FORBIDDEN') message = t('forbidden');
          else if (code === 'NOT_FOUND') message = t('recipientNotFound');
          else if (code === 'AMBIGUOUS_USER') message = t('ambiguousUser');
          else if (code === 'INVALID_RECIPIENT') message = t('invalidRecipient');
          else if (code === 'MARKETING_CONTENT_AS_SERVICE') {
            message = t('marketingContentAsService');
          } else if (code === 'VALIDATION_ERROR') message = t('validationError');
          else {
            const raw = getApiErrorMessage(error, t('error'));
            message =
              raw === 'networkError'
                ? t('networkError')
                : raw === 'validationError'
                  ? t('validationError')
                  : raw;
          }
        }
      }
      showToast(message, 'error');
    },
  });

  function buildAudience(): PushAudienceInput | null {
    if (!preset) return null;
    switch (preset) {
      case 'all_users':
        return { type: 'all_users' };
      case 'role':
        return { type: 'role', roleCode };
      case 'gym':
        if (!gymId) return null;
        return { type: 'gym', gymId, roleCode: roleCode || undefined };
      case 'location': {
        const hasFilter = Boolean(
          location.countryCode ||
            location.stateId ||
            location.cityId ||
            location.districtId
        );
        if (!hasFilter) return null;
        return {
          type: 'location',
          countryCode: location.countryCode,
          stateId: location.stateId,
          cityId: location.cityId,
          districtId: location.districtId,
        };
      }
      case 'user_ids':
      case 'owner_pick_trainer':
      case 'owner_pick_member':
      case 'trainer_pick': {
        const fromInput = parseUserIds(userIdInput);
        const ids = [...new Set([...selectedIds, ...fromInput])];
        if (ids.length === 0) return null;
        return { type: 'user_ids', userIds: ids };
      }
      case 'owner_gym_trainers':
        return { type: 'owner_gym_trainers', gymId: gymId || undefined };
      case 'owner_gym_members':
        return { type: 'owner_gym_members', gymId: gymId || undefined };
      case 'owner_premium':
        if (!gymId && (caps?.gyms.length ?? 0) !== 1) {
          if ((caps?.gyms.length ?? 0) === 1) {
            return {
              type: 'gym',
              gymId: caps!.gyms[0]!.id,
              roleCode: Role.PREMIUM_MEMBER,
            };
          }
          return null;
        }
        return {
          type: 'gym',
          gymId: gymId || caps!.gyms[0]!.id,
          roleCode: Role.PREMIUM_MEMBER,
        };
      case 'owner_vip':
        if (!gymId && (caps?.gyms.length ?? 0) !== 1) {
          if ((caps?.gyms.length ?? 0) === 1) {
            return {
              type: 'gym',
              gymId: caps!.gyms[0]!.id,
              roleCode: Role.VIP_MEMBER,
            };
          }
          return null;
        }
        return {
          type: 'gym',
          gymId: gymId || caps!.gyms[0]!.id,
          roleCode: Role.VIP_MEMBER,
        };
      case 'trainer_clients':
        return { type: 'trainer_clients' };
      case 'member_exact': {
        const query = selectedMemberId || memberQuery.trim();
        if (!query) return null;
        return { type: 'member_exact', query };
      }
      default:
        return null;
    }
  }

  function toggleRecipient(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const audienceForPreview = useMemo(() => buildAudience(), [
    preset,
    roleCode,
    gymId,
    location,
    selectedIds,
    userIdInput,
    selectedMemberId,
    memberQuery,
    caps,
  ]);

  const previewQuery = useQuery({
    queryKey: [
      'push',
      'audience-preview',
      kind,
      title,
      body,
      audienceForPreview,
    ],
    queryFn: async () =>
      (
        await pushNotificationApi.previewAudience({
          kind,
          title: title.trim(),
          body: body.trim(),
          audience: audienceForPreview!,
        })
      ).data.data,
    enabled: Boolean(audienceForPreview) && tab === 'compose',
    staleTime: 15_000,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const audience = buildAudience();
    if (!audience) {
      showToast(t('selectAudience'), 'error');
      return;
    }
    if (!title.trim() || !body.trim()) {
      showToast(t('error'), 'error');
      return;
    }
    if (marketingAsServiceWarning) {
      showToast(t('marketingContentAsService'), 'error');
      return;
    }
    sendMutation.mutate(audience);
  }

  if (capsQuery.isLoading) {
    return (
      <div className="push-shell">
        <PageShell>
          <Skeleton count={4} />
        </PageShell>
      </div>
    );
  }

  if (capsQuery.isError) {
    return (
      <div className="push-shell">
        <PageShell>
          <div className="push-empty">
            <div className="push-empty-mark" aria-hidden>
              !
            </div>
            <strong>{t('loadError')}</strong>
            <button
              type="button"
              className="push-btn push-btn-primary"
              onClick={() => void capsQuery.refetch()}
            >
              {t('retry')}
            </button>
          </div>
        </PageShell>
      </div>
    );
  }

  if (!caps?.canCompose) {
    return (
      <div className="push-shell">
        <PageShell>
          <div className="push-empty">
            <div className="push-empty-mark" aria-hidden>
              !
            </div>
            <strong>{t('cannotCompose')}</strong>
          </div>
        </PageShell>
      </div>
    );
  }

  const needsGym =
    preset === 'gym' ||
    preset === 'owner_premium' ||
    preset === 'owner_vip' ||
    ((preset === 'owner_gym_trainers' || preset === 'owner_gym_members') &&
      (caps.gyms.length ?? 0) > 1);

  const needsPick =
    preset === 'user_ids' ||
    preset === 'owner_pick_trainer' ||
    preset === 'owner_pick_member' ||
    preset === 'trainer_pick';

  const showAudiencePicker = presets.length > 1;

  return (
    <div className="push-shell">
      <PageShell>
        <header className="push-top">
          <div className="push-top__text">
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          <div className="push-top__badges">
            <span className="push-badge">{t(`roles.${senderRole}`)}</span>
            <span className="push-badge push-badge--accent">
              {t('maxRecipients', { count: caps.maxRecipients })}
            </span>
          </div>
        </header>

        <div className="push-tabs push-tabs--segment" role="tablist">
          <button
            type="button"
            className={`push-tabs__btn${tab === 'compose' ? ' is-active' : ''}`}
            onClick={() => setTab('compose')}
          >
            {t('tabCompose')}
          </button>
          <button
            type="button"
            className={`push-tabs__btn${tab === 'history' ? ' is-active' : ''}`}
            onClick={() => setTab('history')}
          >
            {t('tabHistory')}
          </button>
        </div>

        {tab === 'compose' ? (
          <form className="push-compose" onSubmit={onSubmit}>
            <PushPreview
              kind={kind}
              title={title}
              body={body}
              audienceLabel={audienceLabel}
            />

            <section className="push-step">
              <header className="push-step__head">
                <span className="push-step__num" aria-hidden>
                  1
                </span>
                <div>
                  <h2>{t('stepAudience')}</h2>
                  <p>{t('audienceHelp')}</p>
                </div>
              </header>

              {showAudiencePicker ? (
                <div className="push-chip-grid" role="radiogroup" aria-label={t('audience')}>
                  {presets.map((p) => (
                    <label
                      key={p}
                      className={`push-chip-option${preset === p ? ' is-selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="push-audience"
                        checked={preset === p}
                        onChange={() => {
                          setPreset(p);
                          setSelectedIds([]);
                          setSelectedMemberId('');
                          setMemberQuery('');
                        }}
                      />
                      <span>{t(`presets.${p}`)}</span>
                    </label>
                  ))}
                </div>
              ) : preset && preset !== 'member_exact' ? (
                <p className="push-step__solo">{t(`presets.${preset}`)}</p>
              ) : null}

              {preset === 'role' || preset === 'gym' ? (
                <div className="push-inline-fields">
                  <div className="push-field">
                    <label htmlFor="push-role">{t('roleLabel')}</label>
                    <select
                      id="push-role"
                      value={roleCode}
                      onChange={(e) => setRoleCode(e.target.value as RoleCode)}
                    >
                      {ROLE_CODES.map((code) => (
                        <option key={code} value={code}>
                          {t(`roles.${code}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              {needsGym ? (
                <div className="push-field">
                  <label htmlFor="push-gym">{t('gymLabel')}</label>
                  <select
                    id="push-gym"
                    value={gymId}
                    onChange={(e) => setGymId(e.target.value)}
                    required={
                      preset === 'gym' ||
                      preset === 'owner_premium' ||
                      preset === 'owner_vip'
                    }
                  >
                    <option value="">{t('allGyms')}</option>
                    {caps.gyms.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {preset === 'location' ? (
                <div className="push-field">
                  <label>{t('locationLabel')}</label>
                  <p className="push-hint">{t('locationHint')}</p>
                  <LocationPicker
                    value={location}
                    onChange={setLocation}
                    showDistrict
                    showGps={false}
                    showVisibility={false}
                  />
                </div>
              ) : null}

              {needsPick ? (
                <div className="push-field">
                  <label>{t('pickRecipients')}</label>
                  {pickList.length > 0 ? (
                    <div className="push-chip-grid push-chip-grid--people">
                      {pickList.map((u) => (
                        <label
                          key={u.id}
                          className={`push-chip-option push-chip-option--person${
                            selectedIds.includes(u.id) ? ' is-selected' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(u.id)}
                            onChange={() => toggleRecipient(u.id)}
                          />
                          <span className="push-chip-option__name">{u.displayName}</span>
                          <span className="push-chip-option__role">{t(`roles.${u.roleCode}`)}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="push-hint">{t('userIdsHint')}</p>
                  )}
                  <p className="push-meta">{t('selectedCount', { count: selectedIds.length })}</p>
                  {hasMinRole(senderRole, Role.ADMIN) ? (
                    <input
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value)}
                      placeholder={t('userIdInput')}
                    />
                  ) : null}
                </div>
              ) : null}

              {preset === 'member_exact' ? (
                <div className="push-field">
                  <label htmlFor="push-member-q">{t('memberQuery')}</label>
                  {suggested.length > 0 ? (
                    <div className="push-chip-grid push-chip-grid--people">
                      {suggested.map((u) => (
                        <label
                          key={u.id}
                          className={`push-chip-option push-chip-option--person${
                            selectedMemberId === u.id ? ' is-selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="member-friend"
                            checked={selectedMemberId === u.id}
                            onChange={() => {
                              setSelectedMemberId(u.id);
                              setMemberQuery(u.displayName);
                            }}
                          />
                          <span className="push-chip-option__name">{u.displayName}</span>
                          <span className="push-chip-option__role">{t(`roles.${u.roleCode}`)}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="push-hint">{t('memberQueryHint')}</p>
                  )}
                  <input
                    id="push-member-q"
                    value={memberQuery}
                    onChange={(e) => {
                      setMemberQuery(e.target.value);
                      setSelectedMemberId('');
                    }}
                    placeholder={t('memberQueryPlaceholder')}
                    required={!selectedMemberId}
                  />
                </div>
              ) : null}
            </section>

            <section className="push-step">
              <header className="push-step__head">
                <span className="push-step__num" aria-hidden>
                  2
                </span>
                <div>
                  <h2>{t('stepMessage')}</h2>
                </div>
              </header>

              <p className="push-hint">
                {consentCategory === 'marketing'
                  ? t('consentHintMarketing')
                  : consentCategory === 'event'
                    ? t('consentHintEvent', { defaultValue: t('consentHintMarketing') })
                    : t('consentHintService')}
              </p>

              <div className="push-kind-groups">
                <div>
                  <p className="push-meta">{t('kindGroupMarketing')}</p>
                  <div className="push-kind-row" role="radiogroup" aria-label={t('kindGroupMarketing')}>
                    {[...PUSH_MARKETING_KINDS, ...PUSH_EVENT_KINDS].map((k) => (
                      <label
                        key={k}
                        className={`push-kind-pill${kind === k ? ' is-selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="push-kind"
                          value={k}
                          checked={kind === k}
                          onChange={() => setKind(k)}
                        />
                        <span>{t(`kinds.${k}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="push-meta">{t('kindGroupService')}</p>
                  <div className="push-kind-row" role="radiogroup" aria-label={t('kindGroupService')}>
                    {PUSH_SERVICE_KINDS.map((k) => (
                      <label
                        key={k}
                        className={`push-kind-pill${kind === k ? ' is-selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="push-kind"
                          value={k}
                          checked={kind === k}
                          onChange={() => setKind(k)}
                        />
                        <span>{t(`kinds.${k}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {marketingAsServiceWarning ? (
                <p className="push-hint" role="alert" style={{ color: 'var(--color-danger, #b42318)' }}>
                  {t('marketingContentAsService')}
                </p>
              ) : null}

              {audienceForPreview && previewQuery.data ? (
                <div className="push-audience-stats" aria-live="polite">
                  <p className="push-meta">{t('audienceStatsTitle')}</p>
                  <ul className="push-audience-stats__list">
                    <li>
                      {t('audienceStatsResolved', {
                        count: previewQuery.data.resolvedCount,
                      })}
                    </li>
                    <li>
                      {t('audienceStatsConsentOk', {
                        count: previewQuery.data.consentEligibleCount,
                        category:
                          previewQuery.data.consentCategory === 'marketing'
                            ? t('consentLabelMarketing')
                            : previewQuery.data.consentCategory === 'event'
                              ? t('consentLabelEvent', {
                                  defaultValue: t('consentLabelMarketing'),
                                })
                              : t('consentLabelService'),
                      })}
                    </li>
                    <li>
                      {t('audienceStatsExcluded', {
                        count: previewQuery.data.consentExcludedCount,
                      })}
                    </li>
                    <li>
                      <strong>
                        {t('audienceStatsFinal', {
                          count: previewQuery.data.finalCount,
                        })}
                      </strong>
                    </li>
                  </ul>
                </div>
              ) : null}

              <div className="push-field">
                <label htmlFor="push-title">{t('titleLabel')}</label>
                <input
                  id="push-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder={t('previewTitlePlaceholder')}
                  required
                />
              </div>

              <div className="push-field">
                <label htmlFor="push-body">{t('bodyLabel')}</label>
                <textarea
                  id="push-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={t('previewBodyPlaceholder')}
                  required
                />
              </div>
            </section>

            <details className="push-advanced">
              <summary>{t('advancedOptions')}</summary>
              <div className="push-advanced__body">
                <div className="push-field">
                  <label htmlFor="push-image">{t('imageUrl')}</label>
                  <input
                    id="push-image"
                    type="text"
                    inputMode="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <div className="push-field">
                  <label htmlFor="push-link">{t('deepLink')}</label>
                  <input
                    id="push-link"
                    value={deepLink}
                    onChange={(e) => setDeepLink(e.target.value)}
                    placeholder="/machines/..."
                  />
                </div>
              </div>
            </details>

            <div className="push-send-bar">
              <button
                type="submit"
                className="push-btn push-btn-primary push-btn-block"
                disabled={
                  sendMutation.isPending ||
                  marketingAsServiceWarning ||
                  (previewQuery.data != null && previewQuery.data.finalCount === 0)
                }
              >
                {sendMutation.isPending ? t('sending') : t('send')}
              </button>
            </div>
          </form>
        ) : (
          <section className="push-history-panel">
            {hasMinRole(senderRole, Role.ADMIN) ? (
              <label className="push-admin-toggle">
                <input
                  type="checkbox"
                  checked={adminAll}
                  onChange={(e) => setAdminAll(e.target.checked)}
                />
                <span>{t('adminAll')}</span>
              </label>
            ) : null}

            {campaignsQuery.isLoading ? (
              <Skeleton count={3} />
            ) : !campaignsQuery.data?.length ? (
              <div className="push-empty">
                <div className="push-empty-mark" aria-hidden>
                  ·
                </div>
                <strong>{t('historyEmpty')}</strong>
              </div>
            ) : (
              <ul className="push-history-list">
                {campaignsQuery.data.map((c) => (
                  <li key={c.id} className="push-history-item">
                    <div className="push-history-item__main">
                      <strong>{c.title}</strong>
                      <span className="push-history-item__meta">
                        {new Date(c.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' · '}
                        {t(`kinds.${c.kind}`)}
                      </span>
                    </div>
                    <span className="push-history-item__stat">
                      {c.successCount}/{c.recipientCount}
                      {c.skippedConsentCount
                        ? ` · −${c.skippedConsentCount}`
                        : ''}
                    </span>
                    <p className="push-history-item__body">{c.body}</p>
                    <button
                      type="button"
                      className="push-btn push-btn-ghost push-btn-sm"
                      onClick={() => setOpenLogsId((prev) => (prev === c.id ? null : c.id))}
                    >
                      {openLogsId === c.id ? t('hideLogs') : t('viewLogs')}
                    </button>
                    {openLogsId === c.id ? (
                      <div className="push-logs">
                        {logsQuery.isLoading ? (
                          <Skeleton count={2} />
                        ) : !logsQuery.data?.length ? (
                          <p className="push-hint">{t('logsEmpty')}</p>
                        ) : (
                          logsQuery.data.map((log) => (
                            <div
                              key={log.id}
                              className={`push-log ${log.success ? 'push-log--ok' : 'push-log--fail'}`}
                            >
                              <span>
                                {log.recipientId.slice(0, 8)}…{' '}
                                {log.recipientRole ? t(`roles.${log.recipientRole}`) : ''}
                              </span>
                              <span>
                                {log.success ? t('logSuccess') : t('logFail')}
                                {log.errorCode ? ` (${log.errorCode})` : ''}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </PageShell>
    </div>
  );
}
