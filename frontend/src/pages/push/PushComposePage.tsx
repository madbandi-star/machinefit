import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  PUSH_KINDS,
  ROLE_CODES,
  Role,
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

  // Auto-select the first allowed audience so send isn't blocked by an empty preset.
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
          else if (code === 'VALIDATION_ERROR') message = t('validationError');
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
          // Prefer explicit gym; if one gym, auto-use it
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

  return (
    <div className="push-shell">
      <PageShell>
        <header className="push-hero">
          <p className="push-hero-kicker">MachineFit</p>
          <h1>{t('title')}</h1>
          <p className="push-hero-lead">{t('subtitle')}</p>
        </header>

        <div className="push-tabs" role="tablist">
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
          <section className="push-panel">
            <div className="push-panel-head">
              <div>
                <h2>{t('tabCompose')}</h2>
                <p className="push-panel-desc">{t('audienceHelp')}</p>
              </div>
              <span className="push-chip">{t('maxRecipients', { count: caps.maxRecipients })}</span>
            </div>

            <form className="push-form" onSubmit={onSubmit}>
              <div className="push-field">
                <label htmlFor="push-kind">{t('kind')}</label>
                <select
                  id="push-kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as PushKind)}
                >
                  {PUSH_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(`kinds.${k}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="push-field">
                <label htmlFor="push-title">{t('titleLabel')}</label>
                <input
                  id="push-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="push-field">
                <label htmlFor="push-body">{t('bodyLabel')}</label>
                <textarea
                  id="push-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  required
                />
              </div>

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

              <div className="push-field" role="group" aria-label={t('audience')}>
                <label>{t('audience')}</label>
                <div className="push-audience">
                  {presets.map((p) => (
                    <label key={p} className="push-audience__option">
                      <input
                        type="radio"
                        name="push-audience"
                        checked={preset === p}
                        onChange={() => {
                          setPreset(p);
                          setSelectedIds([]);
                        }}
                      />
                      <span>{t(`presets.${p}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {preset === 'role' || preset === 'gym' ? (
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
                  <p className="push-hint">{t('userIdsHint')}</p>
                  {pickList.length > 0 ? (
                    <div className="push-recipient-list">
                      {pickList.map((u) => (
                        <label key={u.id}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(u.id)}
                            onChange={() => toggleRecipient(u.id)}
                          />
                          <span>
                            {u.displayName}{' '}
                            <span className="push-meta">({t(`roles.${u.roleCode}`)})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : null}
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
                  <p className="push-hint">{t('memberQueryHint')}</p>
                  {suggested.length > 0 ? (
                    <div className="push-recipient-list">
                      {suggested.map((u) => (
                        <label key={u.id}>
                          <input
                            type="radio"
                            name="member-friend"
                            checked={selectedMemberId === u.id}
                            onChange={() => {
                              setSelectedMemberId(u.id);
                              setMemberQuery(u.displayName);
                            }}
                          />
                          <span>
                            {u.displayName}{' '}
                            <span className="push-meta">({t(`roles.${u.roleCode}`)})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : null}
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

              <button
                type="submit"
                className="push-btn push-btn-primary push-btn-block"
                disabled={sendMutation.isPending}
              >
                {sendMutation.isPending ? t('sending') : t('send')}
              </button>
            </form>
          </section>
        ) : (
          <section className="push-panel">
            <div className="push-panel-head">
              <div>
                <h2>{t('historyTitle')}</h2>
                <p className="push-panel-desc">{t('subtitle')}</p>
              </div>
            </div>

            <div className="push-history">
              {hasMinRole(senderRole, Role.ADMIN) ? (
                <label className="push-audience__option">
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
                campaignsQuery.data.map((c) => (
                  <article key={c.id} className="push-campaign">
                    <div className="push-campaign__row">
                      <strong>{c.title}</strong>
                      <span className="push-chip">
                        {t(`kinds.${c.kind}`)} · {c.successCount}/{c.recipientCount}
                      </span>
                    </div>
                    <p className="push-campaign__meta">
                      {new Date(c.createdAt).toLocaleString()} · {t(`roles.${c.senderRole}`)} ·{' '}
                      {c.audienceType}
                    </p>
                    <p className="push-campaign__body">{c.body}</p>
                    <button
                      type="button"
                      className="push-btn push-btn-ghost"
                      onClick={() => setOpenLogsId((prev) => (prev === c.id ? null : c.id))}
                    >
                      {openLogsId === c.id ? t('hideLogs') : t('viewLogs')}
                    </button>
                    {openLogsId === c.id ? (
                      <div className="push-logs">
                        <strong>{t('logsTitle')}</strong>
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
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </PageShell>
    </div>
  );
}
