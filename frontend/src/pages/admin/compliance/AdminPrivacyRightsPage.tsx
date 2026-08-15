import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PrivacyRightsRequest } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-privacy-rights.css';

type RightsStatus = 'received' | 'reviewing' | 'completed' | 'rejected';
type StatusFilter = '' | RightsStatus | 'cancelled' | 'overdue';
type TypeFilter =
  | ''
  | 'correction'
  | 'deletion'
  | 'processing_stop'
  | 'access'
  | 'consent_withdraw';

const STATUS_OPTIONS: Array<Exclude<StatusFilter, '' | 'overdue'>> = [
  'received',
  'reviewing',
  'completed',
  'rejected',
  'cancelled',
];

const TYPE_OPTIONS: Array<Exclude<TypeFilter, ''>> = [
  'correction',
  'deletion',
  'processing_stop',
  'access',
  'consent_withdraw',
];

function payloadLines(r: PrivacyRightsRequest): Array<{ label: string; value: string }> {
  const p = r.payload ?? {};
  const lines: Array<{ label: string; value: string }> = [];
  if (p.fieldKey != null && String(p.fieldKey)) {
    lines.push({ label: 'field', value: String(p.fieldKey) });
  }
  if (p.currentValue != null && String(p.currentValue)) {
    lines.push({ label: 'current', value: String(p.currentValue) });
  }
  if (p.requestedValue != null && String(p.requestedValue)) {
    lines.push({ label: 'requested', value: String(p.requestedValue) });
  }
  if (p.consentTarget != null && String(p.consentTarget)) {
    lines.push({ label: 'consent', value: String(p.consentTarget) });
  }
  if (Array.isArray(p.deletable) && p.deletable.length) {
    lines.push({ label: 'deletable', value: p.deletable.map(String).join(', ') });
  }
  if (Array.isArray(p.retained) && p.retained.length) {
    lines.push({ label: 'retained', value: p.retained.map(String).join(', ') });
  }
  if (p.note != null && String(p.note)) {
    lines.push({ label: 'note', value: String(p.note) });
  }
  return lines;
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale.startsWith('en') ? 'en-US' : 'ko-KR');
}

function formatDateTime(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(locale.startsWith('en') ? 'en-US' : 'ko-KR');
}

export function AdminPrivacyRightsPage() {
  const { t, i18n } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [applyCorrection, setApplyCorrection] = useState(true);
  const [applyProcessingStop, setApplyProcessingStop] = useState(true);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-privacy-rights'],
    queryFn: async () => (await complianceApi.adminListRightsRequests()).data.data,
  });

  const allRows = listQuery.data ?? [];

  const stats = useMemo(() => {
    let received = 0;
    let reviewing = 0;
    let overdue = 0;
    let completed = 0;
    for (const row of allRows) {
      if (row.status === 'received') received += 1;
      if (row.status === 'reviewing') reviewing += 1;
      if (row.status === 'completed') completed += 1;
      if (row.dueState === 'overdue') overdue += 1;
    }
    return {
      total: allRows.length,
      received,
      reviewing,
      overdue,
      completed,
    };
  }, [allRows]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of allRows) {
      counts[row.requestType] = (counts[row.requestType] ?? 0) + 1;
    }
    return counts;
  }, [allRows]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((row) => {
      if (statusFilter === 'overdue') {
        if (row.dueState !== 'overdue') return false;
      } else if (statusFilter && row.status !== statusFilter) {
        return false;
      }
      if (typeFilter && row.requestType !== typeFilter) return false;
      if (!q) return true;
      const hay = [
        row.requesterDisplayName,
        row.requesterEmail,
        row.subject,
        row.detail,
        row.requestType,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [allRows, statusFilter, typeFilter, search]);

  const detail = useMemo(
    () => allRows.find((r) => r.id === detailId) ?? null,
    [allRows, detailId]
  );
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
  const selectedRows = useMemo(
    () => allRows.filter((r) => selectedIds.includes(r.id)),
    [allRows, selectedIds]
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-privacy-rights'] });
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setDetailId(null);
    setResultMessage('');
    setRejectionReason('');
  };

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; status: RightsStatus }) =>
      complianceApi.adminUpdateRightsRequest(input.id, {
        status: input.status,
        resultMessage: resultMessage || undefined,
        rejectionReason: rejectionReason || undefined,
        noteLegalRetention: input.status === 'completed',
        applyCorrection: input.status === 'completed' ? applyCorrection : undefined,
        applyProcessingStop:
          input.status === 'completed' ? applyProcessingStop : undefined,
      }),
    onSuccess: () => {
      invalidate();
      showToast(t('compliance.rights.admin.saved'), 'success');
      clearSelection();
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (status: RightsStatus) =>
      complianceApi.adminBulkUpdateRightsRequests({
        ids: selectedIds,
        status,
        resultMessage: resultMessage || undefined,
        rejectionReason: rejectionReason || undefined,
        noteLegalRetention: status === 'completed',
        applyCorrection: status === 'completed' ? applyCorrection : undefined,
        applyProcessingStop:
          status === 'completed' ? applyProcessingStop : undefined,
      }),
    onSuccess: (res) => {
      invalidate();
      showToast(
        t('compliance.rights.admin.bulkSaved', {
          count: res.data.data.count,
        }),
        'success'
      );
      clearSelection();
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => complianceApi.adminDeleteRightsRequests(ids),
    onSuccess: (res) => {
      invalidate();
      showToast(
        t('compliance.rights.admin.deleted', { count: res.data.data.deleted }),
        'success'
      );
      setPendingDeleteIds(null);
      clearSelection();
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const busy =
    updateMutation.isPending ||
    bulkUpdateMutation.isPending ||
    deleteMutation.isPending;

  const closeDetail = useCallback(() => {
    if (busy) return;
    setDetailId(null);
  }, [busy]);

  const drawerRef = useModalAccessibility({
    open: Boolean(detail),
    onClose: closeDetail,
    closeOnEscape: !busy,
  });

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : rows.map((r) => r.id));
  };

  const openDetail = (row: PrivacyRightsRequest) => {
    setDetailId(row.id);
    setSelectedIds([row.id]);
  };

  const processSelected = (status: RightsStatus) => {
    if (selectedIds.length === 0) return;
    if (status === 'rejected' && !rejectionReason.trim() && !resultMessage.trim()) {
      showToast(t('compliance.rights.admin.rejectionRequired'), 'error');
      return;
    }
    if (selectedIds.length === 1) {
      updateMutation.mutate({ id: selectedIds[0]!, status });
      return;
    }
    bulkUpdateMutation.mutate(status);
  };

  const showDock = selectedIds.length > 0;

  return (
    <AdminPageShell
      title={t('compliance.rights.admin.title')}
      subtitle={t('compliance.rights.admin.subtitle')}
    >
      <div className="apr">
        <div className="apr-stats" aria-label={t('compliance.rights.admin.statsLabel')}>
          {(
            [
              ['', stats.total, t('compliance.rights.admin.statTotal'), ''],
              [
                'received',
                stats.received,
                t('compliance.rights.status.received'),
                '',
              ],
              [
                'reviewing',
                stats.reviewing,
                t('compliance.rights.status.reviewing'),
                'is-warn',
              ],
              [
                'overdue',
                stats.overdue,
                t('compliance.rights.admin.overdue'),
                'is-danger',
              ],
              [
                'completed',
                stats.completed,
                t('compliance.rights.status.completed'),
                '',
              ],
            ] as const
          ).map(([value, count, label, tone]) => (
            <button
              key={value || 'all'}
              type="button"
              className={`apr-stat${statusFilter === value ? ' is-active' : ''}${
                tone ? ` ${tone}` : ''
              }`}
              aria-pressed={statusFilter === value}
              onClick={() => {
                setStatusFilter(value);
                setSelectedIds([]);
              }}
            >
              <span className="apr-stat__value">{count}</span>
              <span className="apr-stat__label">{label}</span>
            </button>
          ))}
        </div>

        <section className="apr-toolbar">
          <div className="apr-toolbar__row">
            <input
              className="apr-toolbar__search"
              value={search}
              placeholder={t('compliance.rights.admin.searchPlaceholder')}
              aria-label={t('compliance.rights.admin.searchPlaceholder')}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="apr-toolbar__actions">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={listQuery.isFetching}
                onClick={() => void listQuery.refetch()}
              >
                {t('compliance.rights.admin.refresh')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={rows.length === 0}
                onClick={toggleAll}
              >
                {allSelected
                  ? t('compliance.rights.admin.clearSelection')
                  : t('compliance.rights.admin.selectAll')}
              </button>
            </div>
          </div>

          <div
            className="apr-chips"
            role="group"
            aria-label={t('compliance.rights.admin.filterType')}
          >
            <button
              type="button"
              className={`apr-chip${typeFilter === '' ? ' is-active' : ''}`}
              aria-pressed={typeFilter === ''}
              onClick={() => {
                setTypeFilter('');
                setSelectedIds([]);
              }}
            >
              {t('compliance.rights.admin.allTypes')}
              <span className="apr-chip__count">{stats.total}</span>
            </button>
            {TYPE_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                className={`apr-chip${typeFilter === type ? ' is-active' : ''}`}
                aria-pressed={typeFilter === type}
                onClick={() => {
                  setTypeFilter(type);
                  setSelectedIds([]);
                }}
              >
                {t(`compliance.rights.requestType.${type}`)}
                <span className="apr-chip__count">{typeCounts[type] ?? 0}</span>
              </button>
            ))}
          </div>

          <div
            className="apr-chips"
            role="group"
            aria-label={t('compliance.rights.admin.filterStatus')}
          >
            <button
              type="button"
              className={`apr-chip${statusFilter === '' ? ' is-active' : ''}`}
              aria-pressed={statusFilter === ''}
              onClick={() => {
                setStatusFilter('');
                setSelectedIds([]);
              }}
            >
              {t('compliance.rights.admin.allStatuses')}
            </button>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                className={`apr-chip${statusFilter === status ? ' is-active' : ''}`}
                aria-pressed={statusFilter === status}
                onClick={() => {
                  setStatusFilter(status);
                  setSelectedIds([]);
                }}
              >
                {t(`compliance.rights.status.${status}`)}
              </button>
            ))}
          </div>
        </section>

        {showDock ? (
          <section className="apr-dock" aria-label={t('compliance.rights.admin.processPanel')}>
            <div className="apr-dock__meta">
              <span>
                {t('compliance.rights.admin.selectedCount', {
                  count: selectedIds.length,
                })}
              </span>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setSelectedIds([])}
              >
                {t('compliance.rights.admin.clearSelection')}
              </button>
            </div>
            <div className="apr-dock__fields">
              <label className="apr-field">
                <span>{t('compliance.rights.admin.resultMessage')}</span>
                <textarea
                  value={resultMessage}
                  onChange={(e) => setResultMessage(e.target.value)}
                  rows={2}
                  placeholder={t('compliance.rights.admin.resultPlaceholder')}
                />
              </label>
              <label className="apr-field">
                <span>{t('compliance.rights.admin.rejectionReason')}</span>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  placeholder={t('compliance.rights.admin.rejectPlaceholder')}
                />
              </label>
            </div>
            <div className="apr-checks">
              <label className="apr-check">
                <input
                  type="checkbox"
                  checked={applyCorrection}
                  onChange={(e) => setApplyCorrection(e.target.checked)}
                />
                <span>{t('compliance.rights.admin.applyCorrection')}</span>
              </label>
              <label className="apr-check">
                <input
                  type="checkbox"
                  checked={applyProcessingStop}
                  onChange={(e) => setApplyProcessingStop(e.target.checked)}
                />
                <span>{t('compliance.rights.admin.applyProcessingStop')}</span>
              </label>
            </div>
            <div className="apr-dock__actions">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={busy}
                onClick={() => processSelected('reviewing')}
              >
                {t('compliance.rights.admin.bulkReviewing')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy}
                onClick={() => processSelected('completed')}
              >
                {t('compliance.rights.admin.bulkComplete')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={busy}
                onClick={() => processSelected('rejected')}
              >
                {t('compliance.rights.admin.bulkReject')}
              </button>
              <button
                type="button"
                className="btn btn--secondary apr-btn--danger"
                disabled={busy}
                onClick={() => setPendingDeleteIds(selectedIds)}
              >
                {t('compliance.rights.admin.bulkDelete')}
              </button>
            </div>
            <p className="apr-hint">{t('compliance.rights.admin.dueHint')}</p>
            {selectedRows.length > 1 ? (
              <p className="apr-hint">
                {t('compliance.rights.admin.multiProcessHint', {
                  count: selectedRows.length,
                })}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="apr-list-head">
          <span className="apr-list-head__count">
            {t('compliance.rights.admin.resultCount', { count: rows.length })}
          </span>
        </div>

        {listQuery.isLoading ? (
          <Skeleton count={4} />
        ) : rows.length === 0 ? (
          <p className="apr-empty">{t('compliance.rights.admin.empty')}</p>
        ) : (
          <section className="apr-queue">
            {rows.map((r) => {
              const checked = selectedIds.includes(r.id);
              const requester = r.requesterDisplayName || r.requesterEmail || '—';
              return (
                <article
                  key={r.id}
                  className={[
                    'apr-card',
                    checked ? 'is-selected' : '',
                    detailId === r.id ? 'is-active' : '',
                    r.dueState === 'overdue' ? 'is-overdue' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="apr-card__check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(r.id)}
                      aria-label={t('compliance.rights.admin.selectRow')}
                    />
                  </div>
                  <div className="apr-card__main">
                    <div className="apr-card__top">
                      <span className={`apr-type apr-type--${r.requestType}`}>
                        {t(`compliance.rights.requestType.${r.requestType}`)}
                      </span>
                      <span className={`apr-status apr-status--${r.status}`}>
                        {t(`compliance.rights.status.${r.status}`)}
                      </span>
                      {r.dueState === 'overdue' ? (
                        <span className="apr-flag apr-flag--danger">
                          {t('compliance.rights.admin.overdue')}
                        </span>
                      ) : r.dueState === 'soon' ? (
                        <span className="apr-flag">
                          {t('compliance.rights.admin.dueSoon')}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="apr-card__title">
                      <button
                        type="button"
                        className="apr-card__title-btn"
                        onClick={() => openDetail(r)}
                      >
                        {requester}
                      </button>
                    </h3>
                    <p className="apr-card__meta">
                      {r.requesterEmail || '—'}
                      {' · '}
                      {t('compliance.rights.admin.createdAt')}:{' '}
                      {formatDateTime(r.createdAt, i18n.language)}
                    </p>
                    {r.detail || r.subject ? (
                      <p className="apr-card__detail">{r.detail || r.subject}</p>
                    ) : null}
                  </div>
                  <div className="apr-card__due">
                    <span className="apr-card__due-date">
                      {formatDate(r.dueAt, i18n.language)}
                    </span>
                    <span className="apr-card__due-sub">
                      {t('compliance.rights.admin.dueAt')}
                    </span>
                  </div>
                  <div className="apr-card__actions">
                    <button
                      type="button"
                      className="btn btn--sm btn--secondary"
                      disabled={busy}
                      onClick={() => openDetail(r)}
                    >
                      {t('compliance.rights.admin.open')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--ghost apr-btn--danger"
                      disabled={busy}
                      onClick={() => setPendingDeleteIds([r.id])}
                    >
                      {t('compliance.rights.admin.deleteOne')}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {detail ? (
        <div
          className="apr-drawer-overlay"
          role="presentation"
          onClick={closeDetail}
        >
          <aside
            ref={drawerRef}
            className="apr-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apr-drawer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="apr-drawer__head">
              <div>
                <p className="apr-drawer__kicker">
                  {t(`compliance.rights.requestType.${detail.requestType}`)}
                </p>
                <h3 id="apr-drawer-title">
                  {detail.requesterDisplayName || detail.requesterEmail || '—'}
                </h3>
              </div>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={closeDetail}
                disabled={busy}
                aria-label={t('compliance.rights.admin.closeDetail')}
              >
                ✕
              </button>
            </header>

            <div className="apr-drawer__body">
              <div className="apr-card__top">
                <span className={`apr-status apr-status--${detail.status}`}>
                  {t(`compliance.rights.status.${detail.status}`)}
                </span>
                {detail.dueState === 'overdue' ? (
                  <span className="apr-flag apr-flag--danger">
                    {t('compliance.rights.admin.overdue')}
                  </span>
                ) : detail.dueState === 'soon' ? (
                  <span className="apr-flag">
                    {t('compliance.rights.admin.dueSoon')}
                  </span>
                ) : null}
              </div>

              <dl className="apr-detail__grid">
                <div>
                  <dt>{t('compliance.rights.admin.requester')}</dt>
                  <dd>
                    {detail.requesterDisplayName || '—'}
                    {detail.requesterEmail ? ` (${detail.requesterEmail})` : ''}
                  </dd>
                </div>
                <div>
                  <dt>{t('compliance.rights.admin.dueAt')}</dt>
                  <dd>{formatDateTime(detail.dueAt, i18n.language)}</dd>
                </div>
                <div>
                  <dt>{t('compliance.rights.admin.createdAt')}</dt>
                  <dd>{formatDateTime(detail.createdAt, i18n.language)}</dd>
                </div>
                <div>
                  <dt>{t('compliance.rights.admin.detail')}</dt>
                  <dd>{detail.detail || detail.subject || '—'}</dd>
                </div>
              </dl>

              <div className="apr-payload">
                <h4>{t('compliance.rights.admin.payload')}</h4>
                {payloadLines(detail).length > 0 ? (
                  <ul>
                    {payloadLines(detail).map((line) => (
                      <li key={line.label}>
                        <strong>
                          {t(`compliance.rights.admin.payloadFields.${line.label}`, {
                            defaultValue: line.label,
                          })}
                        </strong>
                        <span>{line.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <pre>{JSON.stringify(detail.payload, null, 2)}</pre>
                )}
              </div>

              {detail.resultMessage || detail.rejectionReason ? (
                <div className="apr-result-prev">
                  {detail.resultMessage ? (
                    <p>
                      <strong>{t('compliance.rights.admin.resultMessage')}</strong>
                      {detail.resultMessage}
                    </p>
                  ) : null}
                  {detail.rejectionReason ? (
                    <p>
                      <strong>{t('compliance.rights.admin.rejectionReason')}</strong>
                      {detail.rejectionReason}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <p className="apr-hint">{t('compliance.rights.admin.dueHint')}</p>
            </div>

            <footer className="apr-drawer__foot">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={busy}
                onClick={() => processSelected('reviewing')}
              >
                {t('compliance.rights.status.reviewing')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy}
                onClick={() => processSelected('completed')}
              >
                {t('compliance.rights.status.completed')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={busy}
                onClick={() => processSelected('rejected')}
              >
                {t('compliance.rights.status.rejected')}
              </button>
              <button
                type="button"
                className="btn btn--secondary apr-btn--danger"
                disabled={busy}
                onClick={() => setPendingDeleteIds([detail.id])}
              >
                {t('compliance.rights.admin.deleteOne')}
              </button>
            </footer>
          </aside>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDeleteIds?.length)}
        title={t('compliance.rights.admin.deleteTitle')}
        message={t('compliance.rights.admin.deleteConfirm', {
          count: pendingDeleteIds?.length ?? 0,
        })}
        confirmLabel={t('compliance.rights.admin.deleteOne')}
        cancelLabel={t('actions.cancel')}
        confirmVariant="danger"
        onConfirm={() => pendingDeleteIds && deleteMutation.mutate(pendingDeleteIds)}
        onClose={() => setPendingDeleteIds(null)}
      />
    </AdminPageShell>
  );
}
