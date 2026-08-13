import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PrivacyRightsRequest } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin-privacy-rights.css';
import '@/styles/components.css';

type RightsStatus = 'received' | 'reviewing' | 'completed' | 'rejected';

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

export function AdminPrivacyRightsPage() {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [applyCorrection, setApplyCorrection] = useState(true);
  const [applyProcessingStop, setApplyProcessingStop] = useState(true);

  const listQuery = useQuery({
    queryKey: ['admin-privacy-rights', statusFilter, typeFilter],
    queryFn: async () =>
      (
        await complianceApi.adminListRightsRequests({
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(typeFilter ? { requestType: typeFilter } : {}),
        })
      ).data.data,
  });

  const rows = listQuery.data ?? [];
  const detail = useMemo(
    () => rows.find((r) => r.id === detailId) ?? null,
    [rows, detailId]
  );
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.includes(r.id)),
    [rows, selectedIds]
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
        applyCorrection:
          input.status === 'completed' ? applyCorrection : undefined,
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
      clearSelection();
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const busy =
    updateMutation.isPending ||
    bulkUpdateMutation.isPending ||
    deleteMutation.isPending;

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : rows.map((r) => r.id));
  };

  const confirmDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    const ok = window.confirm(
      t('compliance.rights.admin.deleteConfirm', { count: ids.length })
    );
    if (!ok) return;
    deleteMutation.mutate(ids);
  };

  const processSelected = (status: RightsStatus) => {
    if (selectedIds.length === 0) return;
    if (status === 'rejected' && !rejectionReason.trim() && !resultMessage.trim()) {
      showToast(t('compliance.rights.admin.rejectionRequired'), 'error');
      return;
    }
    if (selectedIds.length === 1) {
      updateMutation.mutate({ id: selectedIds[0], status });
      return;
    }
    bulkUpdateMutation.mutate(status);
  };

  return (
    <PageShell
      title={t('compliance.rights.admin.title')}
      subtitle={t('compliance.rights.admin.subtitle')}
    >
      <div className="apr">
        <section className="apr-toolbar">
          <label className="apr-field">
            <span>{t('compliance.rights.admin.filterStatus')}</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                clearSelection();
              }}
            >
              <option value="">{t('compliance.rights.admin.allStatuses')}</option>
              <option value="received">
                {t('compliance.rights.status.received')}
              </option>
              <option value="reviewing">
                {t('compliance.rights.status.reviewing')}
              </option>
              <option value="completed">
                {t('compliance.rights.status.completed')}
              </option>
              <option value="rejected">
                {t('compliance.rights.status.rejected')}
              </option>
            </select>
          </label>
          <label className="apr-field">
            <span>{t('compliance.rights.admin.filterType')}</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                clearSelection();
              }}
            >
              <option value="">{t('compliance.rights.admin.allTypes')}</option>
              <option value="correction">
                {t('compliance.rights.requestType.correction')}
              </option>
              <option value="deletion">
                {t('compliance.rights.requestType.deletion')}
              </option>
              <option value="processing_stop">
                {t('compliance.rights.requestType.processing_stop')}
              </option>
              <option value="access">
                {t('compliance.rights.requestType.access')}
              </option>
              <option value="consent_withdraw">
                {t('compliance.rights.requestType.consent_withdraw')}
              </option>
            </select>
          </label>
        </section>

        <section className="apr-bulk">
          <div className="apr-bulk__meta">
            {t('compliance.rights.admin.selectedCount', {
              count: selectedIds.length,
            })}
          </div>
          <div className="apr-bulk__actions">
            <button
              type="button"
              className="btn btn--secondary"
              disabled={busy || selectedIds.length === 0}
              onClick={() => processSelected('reviewing')}
            >
              {t('compliance.rights.admin.bulkReviewing')}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy || selectedIds.length === 0}
              onClick={() => processSelected('completed')}
            >
              {t('compliance.rights.admin.bulkComplete')}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={busy || selectedIds.length === 0}
              onClick={() => processSelected('rejected')}
            >
              {t('compliance.rights.admin.bulkReject')}
            </button>
            <button
              type="button"
              className="btn btn--secondary apr-btn--danger"
              disabled={busy || selectedIds.length === 0}
              onClick={() => confirmDelete(selectedIds)}
            >
              {t('compliance.rights.admin.bulkDelete')}
            </button>
          </div>
        </section>

        <section className="apr-process">
          <label className="apr-field apr-field--grow">
            <span>{t('compliance.rights.admin.resultMessage')}</span>
            <textarea
              value={resultMessage}
              onChange={(e) => setResultMessage(e.target.value)}
              rows={2}
              placeholder={t('compliance.rights.admin.resultPlaceholder')}
            />
          </label>
          <label className="apr-field apr-field--grow">
            <span>{t('compliance.rights.admin.rejectionReason')}</span>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              placeholder={t('compliance.rights.admin.rejectPlaceholder')}
            />
          </label>
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
          <p className="apr-hint">{t('compliance.rights.admin.dueHint')}</p>
        </section>

        {listQuery.isLoading ? (
          <Skeleton count={4} />
        ) : rows.length === 0 ? (
          <p className="apr-empty">{t('compliance.rights.admin.empty')}</p>
        ) : (
          <section className="apr-table-wrap">
            <table className="apr-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label={t('compliance.rights.admin.selectAll')}
                    />
                  </th>
                  <th>{t('compliance.rights.admin.colType')}</th>
                  <th>{t('compliance.rights.admin.status')}</th>
                  <th>{t('compliance.rights.admin.requester')}</th>
                  <th>{t('compliance.rights.admin.dueAt')}</th>
                  <th>{t('compliance.rights.admin.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const checked = selectedIds.includes(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={[
                        checked ? 'apr-table__row--selected' : '',
                        detailId === r.id ? 'apr-table__row--active' : '',
                        r.dueState === 'overdue' ? 'apr-table__row--overdue' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(r.id)}
                          aria-label={t('compliance.rights.admin.selectRow')}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="apr-linkish"
                          onClick={() => {
                            setDetailId(r.id);
                            setSelectedIds([r.id]);
                          }}
                        >
                          {t(`compliance.rights.requestType.${r.requestType}`)}
                        </button>
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <div className="apr-requester">
                          <strong>
                            {r.requesterDisplayName || r.requesterEmail || '—'}
                          </strong>
                          <span>{r.requesterEmail}</span>
                        </div>
                      </td>
                      <td>
                        <div className="apr-due">
                          <span>{new Date(r.dueAt).toLocaleDateString()}</span>
                          <span>{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td>
                        <div className="apr-row-actions">
                          <button
                            type="button"
                            className="btn btn--secondary"
                            disabled={busy}
                            onClick={() => {
                              setDetailId(r.id);
                              setSelectedIds([r.id]);
                            }}
                          >
                            {t('compliance.rights.admin.open')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--secondary apr-btn--danger"
                            disabled={busy}
                            onClick={() => confirmDelete([r.id])}
                          >
                            {t('compliance.rights.admin.deleteOne')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {detail ? (
          <section className="apr-detail">
            <header className="apr-detail__head">
              <h3>
                {t(`compliance.rights.requestType.${detail.requestType}`)}
              </h3>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setDetailId(null)}
              >
                {t('actions.cancel')}
              </button>
            </header>
            <dl className="apr-detail__grid">
              <div>
                <dt>{t('compliance.rights.admin.requester')}</dt>
                <dd>
                  {detail.requesterDisplayName} ({detail.requesterEmail})
                </dd>
              </div>
              <div>
                <dt>{t('compliance.rights.admin.status')}</dt>
                <dd>{t(`compliance.rights.status.${detail.status}`)}</dd>
              </div>
              <div>
                <dt>{t('compliance.rights.admin.dueAt')}</dt>
                <dd>{new Date(detail.dueAt).toLocaleString()}</dd>
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

            <div className="apr-detail__actions">
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
                onClick={() => confirmDelete([detail.id])}
              >
                {t('compliance.rights.admin.deleteOne')}
              </button>
            </div>
            {selectedRows.length > 1 ? (
              <p className="apr-hint">
                {t('compliance.rights.admin.multiProcessHint', {
                  count: selectedRows.length,
                })}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
