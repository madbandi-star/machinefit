import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  MACHINE_REQUEST_UNKNOWN_VALUE,
  TARGET_MUSCLE_GROUPS,
  type AdminMachineRequestGroup,
  type AdminMachineRequestGroupDetail,
  type AdminMachineUpsertInput,
  type Brand,
} from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getLocalizedName } from '@/utils/localizedName';
import { resolveMachineRequestMediaUrl } from '@/utils/machineRequestMediaUrl';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import '@/styles/admin.css';

const PAGE_SIZE = 20;
const MACHINE_TYPES = [
  'selectorized',
  'plate_loaded',
  'cable',
  'free_weight',
  'smith',
  'bodyweight',
] as const;
const MUSCLE_OPTIONS = [...TARGET_MUSCLE_GROUPS, 'full_body'] as const;
const REJECT_PRESETS = [
  'duplicate',
  'invalid',
  'notExists',
  'brandCheck',
] as const;

type StatusFilter = 'all' | 'pending' | 'reviewing' | 'added' | 'rejected';

type RegisterForm = {
  brandId: string;
  code: string;
  nameKo: string;
  nameEn: string;
  muscleGroup: string;
  machineType: (typeof MACHINE_TYPES)[number];
  descriptionKo: string;
  descriptionEn: string;
  isActive: boolean;
};

function displayText(value: string | undefined | null, unknownLabel: string) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed === MACHINE_REQUEST_UNKNOWN_VALUE) return unknownLabel;
  return trimmed;
}

function statusClass(status: string) {
  if (status === 'added') return 'admin-req-badge--added';
  if (status === 'reviewing' || status === 'approved') return 'admin-req-badge--reviewing';
  if (status === 'rejected') return 'admin-req-badge--rejected';
  return 'admin-req-badge--pending';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function AdminMachineRequestsPage() {
  const { t, i18n } = useTranslation('admin');
  const { t: tCommunity } = useTranslation('community');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [page, setPage] = useState(1);
  const [brand, setBrand] = useState('');
  const [machineName, setMachineName] = useState('');
  const [requester, setRequester] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<{ brandName: string; machineName: string } | null>(
    null
  );
  const [adminNote, setAdminNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState<RegisterForm | null>(null);
  const [duplicateMachine, setDuplicateMachine] = useState<{
    id: string;
    code: string;
  } | null>(null);

  const listParams = useMemo(
    () => ({
      brand: brand || undefined,
      machineName: machineName || undefined,
      requester: requester || undefined,
      status,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [brand, machineName, requester, status, dateFrom, dateTo, page]
  );

  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.adminMachineRequestStats,
    queryFn: async () => (await adminApi.getMachineRequestGroupStats()).data.data,
  });

  const popularQuery = useQuery({
    queryKey: QUERY_KEYS.adminMachineRequestPopular,
    queryFn: async () => (await adminApi.listPopularMachineRequestGroups()).data.data,
  });

  const listQuery = useQuery({
    queryKey: QUERY_KEYS.adminMachineRequestGroups(listParams),
    queryFn: async () => (await adminApi.listMachineRequestGroups(listParams)).data.data,
  });

  const detailQuery = useQuery({
    queryKey: selected
      ? QUERY_KEYS.adminMachineRequestGroupDetail(selected.brandName, selected.machineName)
      : ['admin', 'machine-request-groups', 'detail', 'none'],
    queryFn: async () =>
      (await adminApi.getMachineRequestGroupDetail(selected!)).data.data,
    enabled: Boolean(selected),
  });

  const brandsQuery = useQuery({
    queryKey: QUERY_KEYS.adminBrands,
    queryFn: async () => {
      const res = await adminApi.listCatalogBrands({ limit: 100, page: 1, isActive: 'all' });
      return res.data.data.items as Brand[];
    },
    enabled: Boolean(selected),
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'machine-request-groups'] });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminModeration });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
  };

  const updateMutation = useMutation({
    mutationFn: (input: {
      id: string;
      status?: 'pending' | 'reviewing' | 'rejected' | 'added';
      adminNote?: string | null;
      rejectReason?: string | null;
      linkedMachineId?: string | null;
      applyToGroup?: boolean;
      groupBrandName?: string;
      groupMachineName?: string;
    }) => adminApi.updateMachineRequest(input.id, input),
    onSuccess: () => {
      invalidateAll();
      void detailQuery.refetch();
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const registerMutation = useMutation({
    mutationFn: async (form: RegisterForm) => {
      const input: AdminMachineUpsertInput = {
        brandId: form.brandId,
        code: form.code.trim().toUpperCase(),
        name: { ko: form.nameKo.trim(), en: form.nameEn.trim() || form.nameKo.trim() },
        muscleGroup: form.muscleGroup,
        machineType: form.machineType,
        description:
          form.descriptionKo.trim() || form.descriptionEn.trim()
            ? {
                ko: form.descriptionKo.trim() || undefined,
                en: form.descriptionEn.trim() || undefined,
              }
            : undefined,
        isActive: form.isActive,
        sortOrder: 0,
      };
      return (await adminApi.createCatalogMachine(input)).data.data;
    },
    onSuccess: async (machine) => {
      const detail = detailQuery.data;
      if (detail?.requesters[0]) {
        await adminApi.updateMachineRequest(detail.requesters[0].requestId, {
          status: 'added',
          linkedMachineId: machine.id,
          applyToGroup: true,
          groupBrandName: detail.brandName,
          groupMachineName: detail.machineName,
          adminNote: adminNote.trim() || undefined,
        });
      }
      setShowRegister(false);
      setRegisterForm(null);
      setDuplicateMachine(null);
      invalidateAll();
      void detailQuery.refetch();
      showToast(t('machineRequests.registerSuccess'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const openDetail = (group: AdminMachineRequestGroup) => {
    setSelected({ brandName: group.brandName, machineName: group.machineName });
    setAdminNote(group.adminNote ?? '');
    setRejectReason(group.rejectReason ?? '');
    setShowRegister(false);
    setDuplicateMachine(null);
  };

  const openRegister = (detail: AdminMachineRequestGroupDetail) => {
    if (detail.existingMachineId && detail.existingMachineCode) {
      setDuplicateMachine({
        id: detail.existingMachineId,
        code: detail.existingMachineCode,
      });
      setShowRegister(false);
      return;
    }
    setDuplicateMachine(null);
    const unknown = tCommunity('requestFieldUnknownLabel');
    const brandLabel = displayText(detail.brandName, unknown);
    const machineLabel = displayText(detail.machineName, unknown);
    const matchedBrand = brandsQuery.data?.find((b) => {
      const ko = b.name?.ko?.toLowerCase() ?? '';
      const en = b.name?.en?.toLowerCase() ?? '';
      const code = b.code?.toLowerCase() ?? '';
      const target = brandLabel.toLowerCase();
      return ko === target || en === target || code === target;
    });
    setRegisterForm({
      brandId: matchedBrand?.id ?? '',
      code: '',
      nameKo: machineLabel === unknown ? '' : machineLabel,
      nameEn: machineLabel === unknown ? '' : machineLabel,
      muscleGroup: 'chest',
      machineType: 'selectorized',
      descriptionKo:
        displayText(detail.sampleDescription, unknown) === unknown
          ? ''
          : displayText(detail.sampleDescription, unknown),
      descriptionEn: '',
      isActive: true,
    });
    setShowRegister(true);
  };

  useModalAccessibility({
    open: Boolean(selected),
    onClose: () => {
      setSelected(null);
      setShowRegister(false);
    },
                initialFocusSelector: '.admin-req-detail__close',
  });

  const unknownLabel = tCommunity('requestFieldUnknownLabel');
  const detail = detailQuery.data;

  return (
    <AdminPageShell
      title={t('machineRequests.title')}
      subtitle={t('machineRequests.subtitle')}
    >
      <div className="admin-req-stats">
        {(
          [
            ['total', statsQuery.data?.total],
            ['pending', statsQuery.data?.pending],
            ['reviewing', statsQuery.data?.reviewing],
            ['added', statsQuery.data?.added],
            ['rejected', statsQuery.data?.rejected],
            ['thisMonthRequests', statsQuery.data?.thisMonthRequests],
            ['thisMonthAdded', statsQuery.data?.thisMonthAdded],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className="admin-req-stats__card">
            <span className="admin-req-stats__label">{t(`machineRequests.stats.${key}`)}</span>
            <strong className="admin-req-stats__value">
              {statsQuery.isLoading ? '…' : (value ?? 0)}
            </strong>
          </div>
        ))}
      </div>

      <AdminPanel title={t('machineRequests.popularTitle')}>
        {popularQuery.isLoading ? (
          <Skeleton count={3} height={28} />
        ) : popularQuery.data?.length ? (
          <ol className="admin-req-popular">
            {popularQuery.data.map((item, index) => (
              <li key={item.groupKey}>
                <button
                  type="button"
                  className="admin-req-popular__btn"
                  onClick={() =>
                    openDetail({
                      ...item,
                      status: 'pending',
                      firstRequestedAt: '',
                      lastRequestedAt: '',
                    } as AdminMachineRequestGroup)
                  }
                >
                  <span>
                    {index + 1}. {displayText(item.brandName, unknownLabel)}{' '}
                    {displayText(item.machineName, unknownLabel)}
                  </span>
                  <strong>
                    {t('machineRequests.requestCount', { count: item.requestCount })}
                  </strong>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="admin-empty">{t('machineRequests.empty')}</p>
        )}
      </AdminPanel>

      <AdminPanel title={t('machineRequests.listTitle')}>
        <div className="admin-req-filters">
          <label>
            <span>{t('machineRequests.filters.brand')}</span>
            <input
              className="input"
              value={brand}
              onChange={(e) => {
                setPage(1);
                setBrand(e.target.value);
              }}
            />
          </label>
          <label>
            <span>{t('machineRequests.filters.machineName')}</span>
            <input
              className="input"
              value={machineName}
              onChange={(e) => {
                setPage(1);
                setMachineName(e.target.value);
              }}
            />
          </label>
          <label>
            <span>{t('machineRequests.filters.requester')}</span>
            <input
              className="input"
              value={requester}
              onChange={(e) => {
                setPage(1);
                setRequester(e.target.value);
              }}
            />
          </label>
          <label>
            <span>{t('machineRequests.filters.status')}</span>
            <select
              className="input"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as StatusFilter);
              }}
            >
              {(['all', 'pending', 'reviewing', 'added', 'rejected'] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`machineRequests.status.${s}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('machineRequests.filters.dateFrom')}</span>
            <input
              className="input"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setPage(1);
                setDateFrom(e.target.value);
              }}
            />
          </label>
          <label>
            <span>{t('machineRequests.filters.dateTo')}</span>
            <input
              className="input"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setPage(1);
                setDateTo(e.target.value);
              }}
            />
          </label>
        </div>

        {listQuery.isLoading ? (
          <Skeleton count={6} height={40} />
        ) : listQuery.data?.items.length ? (
          <>
            <div className="admin-req-table-wrap">
              <table className="admin-req-table">
                <thead>
                  <tr>
                    <th>{t('machineRequests.columns.lastRequested')}</th>
                    <th>{t('machineRequests.columns.brand')}</th>
                    <th>{t('machineRequests.columns.machine')}</th>
                    <th>{t('machineRequests.columns.count')}</th>
                    <th>{t('machineRequests.columns.status')}</th>
                    <th>{t('machineRequests.columns.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {listQuery.data.items.map((row) => (
                    <tr
                      key={row.groupKey}
                      className={row.requestCount >= 3 ? 'admin-req-table__row--hot' : undefined}
                    >
                      <td>{formatDate(row.lastRequestedAt)}</td>
                      <td>{displayText(row.brandName, unknownLabel)}</td>
                      <td>{displayText(row.machineName, unknownLabel)}</td>
                      <td>
                        <strong>{row.requestCount}</strong>
                      </td>
                      <td>
                        <span className={`admin-req-badge ${statusClass(row.status)}`}>
                          {t(`machineRequests.status.${row.status === 'approved' ? 'reviewing' : row.status}`)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => openDetail(row)}
                        >
                          {t('machineRequests.viewDetail')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={listQuery.data.meta.totalPages}
              onPageChange={setPage}
            />
          </>
        ) : (
          <p className="admin-empty">{t('machineRequests.empty')}</p>
        )}
      </AdminPanel>

      {selected && (
        <div
          className="dialog-overlay admin-req-overlay"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <div
            className="dialog card admin-catalog-dialog admin-req-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-req-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-req-detail__header">
              <h2 id="admin-req-detail-title">{t('machineRequests.detailTitle')}</h2>
              <button
                type="button"
                className="btn btn--secondary btn--sm admin-req-detail__close"
                onClick={() => setSelected(null)}
              >
                {t('machineRequests.close')}
              </button>
            </div>

            {detailQuery.isLoading || !detail ? (
              <Skeleton count={5} height={36} />
            ) : (
              <>
                <dl className="admin-req-detail__meta">
                  <div>
                    <dt>{t('machineRequests.columns.brand')}</dt>
                    <dd>{displayText(detail.brandName, unknownLabel)}</dd>
                  </div>
                  <div>
                    <dt>{t('machineRequests.columns.machine')}</dt>
                    <dd>{displayText(detail.machineName, unknownLabel)}</dd>
                  </div>
                  <div>
                    <dt>{t('machineRequests.columns.count')}</dt>
                    <dd>{detail.requestCount}</dd>
                  </div>
                  <div>
                    <dt>{t('machineRequests.columns.status')}</dt>
                    <dd>
                      <span className={`admin-req-badge ${statusClass(detail.status)}`}>
                        {t(
                          `machineRequests.status.${detail.status === 'approved' ? 'reviewing' : detail.status}`
                        )}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>{t('machineRequests.firstRequested')}</dt>
                    <dd>{formatDate(detail.firstRequestedAt)}</dd>
                  </div>
                  <div>
                    <dt>{t('machineRequests.lastRequested')}</dt>
                    <dd>{formatDate(detail.lastRequestedAt)}</dd>
                  </div>
                </dl>

                <section className="admin-req-detail__section">
                  <h3>{t('machineRequests.requesters')}</h3>
                  <ul className="admin-req-requesters">
                    {detail.requesters.map((r) => {
                      const gymLabel =
                        r.gymChoiceMode === 'unknown'
                          ? t('machineRequests.gymUnknown')
                          : r.gymName?.trim() || t('machineRequests.gymUnknown');
                      const images =
                        r.images?.length
                          ? r.images
                          : r.primaryImageUrl
                            ? [
                                {
                                  id: 'primary',
                                  sortOrder: 0,
                                  thumbUrl: r.primaryImageUrl,
                                  imageUrl: r.primaryImageUrl,
                                },
                              ]
                            : [];
                      return (
                        <li key={r.requestId}>
                          <div className="admin-req-requesters__head">
                            <strong>{r.authorName}</strong>
                            <span>{formatDate(r.createdAt)}</span>
                            <span
                              className={`admin-req-badge ${statusClass(
                                r.status === 'approved' ? 'reviewing' : r.status
                              )}`}
                            >
                              {t(
                                `machineRequests.status.${r.status === 'approved' ? 'reviewing' : r.status}`
                              )}
                            </span>
                          </div>
                          <p>{displayText(r.description, unknownLabel)}</p>
                          <dl className="admin-req-requesters__meta">
                            <div>
                              <dt>{t('machineRequests.gym')}</dt>
                              <dd>{gymLabel}</dd>
                            </div>
                            <div>
                              <dt>{t('machineRequests.consent')}</dt>
                              <dd>
                                {r.commercialUseConsent
                                  ? t('machineRequests.consentYes')
                                  : t('machineRequests.consentNo')}
                              </dd>
                            </div>
                            <div>
                              <dt>{t('machineRequests.social')}</dt>
                              <dd>
                                ♥ {r.likeCount ?? 0} · 💬 {r.commentCount ?? 0} · 👁{' '}
                                {r.viewCount ?? 0}
                              </dd>
                            </div>
                          </dl>
                          {images.length ? (
                            <div className="admin-req-requesters__gallery">
                              {images.map((img) => (
                                <a
                                  key={img.id}
                                  href={resolveMachineRequestMediaUrl(img.imageUrl || img.thumbUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <img
                                    src={resolveMachineRequestMediaUrl(img.thumbUrl || img.imageUrl)}
                                    alt=""
                                    className="admin-req-requesters__img"
                                  />
                                </a>
                              ))}
                            </div>
                          ) : null}
                          <Link
                            to={ROUTES.MACHINE_REQUESTS_DETAIL.replace(':requestId', r.requestId)}
                            className="btn btn--secondary btn--sm"
                          >
                            {t('machineRequests.openUserPost')}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section className="admin-req-detail__section">
                  <h3>{t('machineRequests.adminNote')}</h3>
                  <textarea
                    className="input"
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={t('machineRequests.adminNotePlaceholder')}
                  />
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    disabled={updateMutation.isPending || !detail.requesters[0]}
                    onClick={() =>
                      updateMutation.mutate({
                        id: detail.requesters[0].requestId,
                        adminNote: adminNote.trim() || null,
                        applyToGroup: true,
                        groupBrandName: detail.brandName,
                        groupMachineName: detail.machineName,
                      })
                    }
                  >
                    {t('machineRequests.saveNote')}
                  </button>
                </section>

                <section className="admin-req-detail__section">
                  <h3>{t('machineRequests.statusChange')}</h3>
                  <div className="admin-req-detail__actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: detail.requesters[0].requestId,
                          status: 'reviewing',
                          applyToGroup: true,
                          groupBrandName: detail.brandName,
                          groupMachineName: detail.machineName,
                          adminNote: adminNote.trim() || undefined,
                        })
                      }
                    >
                      {t('machineRequests.markReviewing')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      disabled={updateMutation.isPending || detail.status === 'added'}
                      onClick={() => openRegister(detail)}
                    >
                      {t('machineRequests.registerMachine')}
                    </button>
                    {detail.status === 'added' && detail.linkedMachineCode ? (
                      <Link
                        className="btn btn--secondary btn--sm"
                        to={`${ROUTES.ADMIN_MACHINES}?q=${encodeURIComponent(detail.linkedMachineCode)}`}
                      >
                        {t('machineRequests.viewMachine')}
                      </Link>
                    ) : null}
                  </div>
                </section>

                <section className="admin-req-detail__section">
                  <h3>{t('machineRequests.reject')}</h3>
                  <div className="admin-req-reject-presets">
                    {REJECT_PRESETS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => setRejectReason(t(`machineRequests.rejectPresets.${key}`))}
                      >
                        {t(`machineRequests.rejectPresets.${key}`)}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="input"
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t('machineRequests.rejectPlaceholder')}
                  />
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    disabled={updateMutation.isPending || !rejectReason.trim()}
                    onClick={() =>
                      updateMutation.mutate({
                        id: detail.requesters[0].requestId,
                        status: 'rejected',
                        rejectReason: rejectReason.trim(),
                        applyToGroup: true,
                        groupBrandName: detail.brandName,
                        groupMachineName: detail.machineName,
                        adminNote: adminNote.trim() || undefined,
                      })
                    }
                  >
                    {t('machineRequests.confirmReject')}
                  </button>
                </section>

                {duplicateMachine ? (
                  <div className="admin-req-duplicate">
                    <p>{t('machineRequests.alreadyRegistered')}</p>
                    <Link
                      className="btn btn--primary btn--sm"
                      to={`${ROUTES.ADMIN_MACHINES}?q=${encodeURIComponent(duplicateMachine.code)}`}
                    >
                      {t('machineRequests.viewExisting')}
                    </Link>
                  </div>
                ) : null}

                {showRegister && registerForm ? (
                  <section className="admin-req-detail__section admin-req-register">
                    <h3>{t('machineRequests.registerFormTitle')}</h3>
                    <div className="admin-req-register__grid">
                      <label>
                        <span>{t('catalogMachines.brand')}</span>
                        <select
                          className="input"
                          value={registerForm.brandId}
                          onChange={(e) =>
                            setRegisterForm((f) => (f ? { ...f, brandId: e.target.value } : f))
                          }
                          required
                        >
                          <option value="">{t('machineRequests.selectBrand')}</option>
                          {(brandsQuery.data ?? []).map((b) => (
                            <option key={b.id} value={b.id}>
                              {getLocalizedName(b.name, i18n.language, b.code)} ({b.code})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>{t('catalogMachines.code')}</span>
                        <input
                          className="input"
                          value={registerForm.code}
                          onChange={(e) =>
                            setRegisterForm((f) => (f ? { ...f, code: e.target.value } : f))
                          }
                          required
                        />
                      </label>
                      <label>
                        <span>{t('catalogMachines.nameKo')}</span>
                        <input
                          className="input"
                          value={registerForm.nameKo}
                          onChange={(e) =>
                            setRegisterForm((f) => (f ? { ...f, nameKo: e.target.value } : f))
                          }
                          required
                        />
                      </label>
                      <label>
                        <span>{t('catalogMachines.nameEn')}</span>
                        <input
                          className="input"
                          value={registerForm.nameEn}
                          onChange={(e) =>
                            setRegisterForm((f) => (f ? { ...f, nameEn: e.target.value } : f))
                          }
                        />
                      </label>
                      <label>
                        <span>{t('catalogMachines.muscleGroup')}</span>
                        <select
                          className="input"
                          value={registerForm.muscleGroup}
                          onChange={(e) =>
                            setRegisterForm((f) =>
                              f ? { ...f, muscleGroup: e.target.value } : f
                            )
                          }
                        >
                          {MUSCLE_OPTIONS.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>{t('catalogMachines.machineType')}</span>
                        <select
                          className="input"
                          value={registerForm.machineType}
                          onChange={(e) =>
                            setRegisterForm((f) =>
                              f
                                ? {
                                    ...f,
                                    machineType: e.target.value as (typeof MACHINE_TYPES)[number],
                                  }
                                : f
                            )
                          }
                        >
                          {MACHINE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="admin-req-register__full">
                        <span>{t('catalogMachines.descriptionKo')}</span>
                        <textarea
                          className="input"
                          rows={3}
                          value={registerForm.descriptionKo}
                          onChange={(e) =>
                            setRegisterForm((f) =>
                              f ? { ...f, descriptionKo: e.target.value } : f
                            )
                          }
                        />
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={registerForm.isActive}
                          onChange={(e) =>
                            setRegisterForm((f) =>
                              f ? { ...f, isActive: e.target.checked } : f
                            )
                          }
                        />
                        <span>{t('machineRequests.active')}</span>
                      </label>
                    </div>
                    <div className="admin-req-detail__actions">
                      <button
                        type="button"
                        className="btn btn--primary"
                        disabled={
                          registerMutation.isPending ||
                          !registerForm.brandId ||
                          !registerForm.code.trim() ||
                          !registerForm.nameKo.trim()
                        }
                        onClick={() => registerMutation.mutate(registerForm)}
                      >
                        {t('machineRequests.saveMachine')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => setShowRegister(false)}
                      >
                        {t('machineRequests.cancel')}
                      </button>
                    </div>
                  </section>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
