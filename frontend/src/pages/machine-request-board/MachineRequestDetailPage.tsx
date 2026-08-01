import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  MACHINE_REQUEST_UNKNOWN_VALUE,
  type MachineRequestGymChoiceMode,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Icon } from '@/components/icons/Icon';
import { machineRequestApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { resolveMachineRequestMediaUrl } from '@/utils/machineRequestMediaUrl';
import '@/styles/components.css';
import '@/styles/community.css';

function displayField(value: string | undefined, unknownLabel: string) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed === MACHINE_REQUEST_UNKNOWN_VALUE) return unknownLabel;
  return trimmed;
}

function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const payload = error.response?.data as { error?: { code?: string } } | undefined;
  return payload?.error?.code;
}

export function MachineRequestDetailPage() {
  const { requestId = '' } = useParams<{ requestId: string }>();
  const { t } = useTranslation('community');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const viewerId = useAuthStore((s) => s.user?.id ?? null);
  const unknownLabel = t('requestFieldUnknownLabel');

  const [editing, setEditing] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [machineName, setMachineName] = useState('');
  const [description, setDescription] = useState('');
  const [gymChoiceMode, setGymChoiceMode] = useState<MachineRequestGymChoiceMode>('unknown');
  const [gymName, setGymName] = useState('');

  const detailQueryKey = QUERY_KEYS.machineRequestDetail(requestId, viewerId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: detailQueryKey,
    queryFn: async () => (await machineRequestApi.get(requestId)).data.data,
    enabled: Boolean(requestId),
  });

  useEffect(() => {
    if (!data) return;
    setBrandName(data.brandName);
    setMachineName(data.machineName);
    setDescription(data.description);
    setGymChoiceMode(data.gymChoiceMode ?? 'unknown');
    setGymName(data.gymName ?? '');
  }, [data]);

  const voteMutation = useMutation({
    mutationFn: () => machineRequestApi.toggleVote(requestId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequestsRoot });
      const { voted, voteCount } = res.data.data;
      showToast(
        voted
          ? t('requestWantThisSuccess', { count: voteCount })
          : t('requestWantThisRemoved', { count: voteCount }),
        'success'
      );
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'OWN_REQUEST') {
        showToast(t('requestWantThisOwnError'), 'error');
        return;
      }
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        showToast(t('loginRequired'), 'error');
        navigate(ROUTES.LOGIN);
        return;
      }
      showToast(t('requestWantThisError'), 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      machineRequestApi.update(requestId, {
        brandName: brandName.trim(),
        machineName: machineName.trim(),
        description: description.trim(),
        gymChoiceMode,
        gymName: gymChoiceMode === 'unknown' ? null : gymName.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequestsRoot });
      setEditing(false);
      showToast(t('requestUpdateSuccess'), 'success');
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'FORBIDDEN') {
        showToast(t('requestOwnerOnlyError'), 'error');
        return;
      }
      if (code === 'NOT_EDITABLE') {
        showToast(t('requestNotEditable'), 'error');
        return;
      }
      showToast(t('requestUpdateError'), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => machineRequestApi.remove(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequestsRoot });
      showToast(t('requestDeleteSuccess'), 'success');
      navigate(ROUTES.MACHINE_REQUESTS);
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'FORBIDDEN') {
        showToast(t('requestOwnerOnlyError'), 'error');
        return;
      }
      showToast(t('requestDeleteError'), 'error');
    },
  });

  const handleWantThis = () => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    voteMutation.mutate();
  };

  const handleDelete = () => {
    if (!window.confirm(t('requestConfirmDelete'))) return;
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <PageShell title={t('machineRequests')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell title={t('machineRequests')}>
        <QueryErrorMessage onRetry={() => void refetch()} />
        <Link to={ROUTES.MACHINE_REQUESTS} className="btn btn--secondary btn--block">
          ← {t('machineRequests')}
        </Link>
      </PageShell>
    );
  }

  const images = data.images?.length
    ? data.images
    : data.primaryImageUrl
      ? [
          {
            id: 'primary',
            sortOrder: 0,
            thumbUrl: data.primaryImageUrl,
            imageUrl: data.primaryImageUrl,
          },
        ]
      : [];
  const statusLabel = t(`requestStatus_${data.status}`, { defaultValue: data.status });
  const isMine = data.isMine === true;
  const voted = data.votedByMe === true;
  const voteCount = data.voteCount ?? 0;
  const gymLabel =
    data.gymChoiceMode === 'unknown'
      ? t('requestGymUnknownLabel')
      : data.gymName?.trim() || '—';

  return (
    <div className="community-board-page machine-request-detail">
      <PageShell
        title={t('machineRequests')}
        subtitle={t('requestDetailSubtitle')}
        action={
          <Link to={ROUTES.MACHINE_REQUESTS} className="btn btn--secondary">
            {t('requestBackToList')}
          </Link>
        }
      >
        <article className="card machine-request-detail__card">
          <header className="machine-request-detail__header">
            <h2 className="machine-request-detail__title">
              {displayField(data.brandName, unknownLabel)} ·{' '}
              {displayField(data.machineName, unknownLabel)}
            </h2>
            <div className="machine-request-detail__meta">
              <span className={`board-index-row__status board-index-row__status--${data.status}`}>
                {statusLabel}
              </span>
              {data.authorName ? (
                <span className="machine-request-detail__author">{data.authorName}</span>
              ) : null}
              <time dateTime={data.createdAt}>
                {new Date(data.createdAt).toLocaleString()}
              </time>
              {isMine ? <span className="board-index-row__mine">{t('requestMine')}</span> : null}
            </div>
          </header>

          {images.length > 0 ? (
            <div className="machine-request-detail__gallery" aria-label={t('requestPhoto')}>
              {images.map((image) => (
                <img
                  key={image.id}
                  src={resolveMachineRequestMediaUrl(image.imageUrl || image.thumbUrl)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          ) : null}

          {!editing ? (
            <>
              <section className="machine-request-detail__section">
                <h3>{t('description')}</h3>
                <p className="machine-request-detail__body">
                  {displayField(data.description, unknownLabel)}
                </p>
              </section>
              <section className="machine-request-detail__section">
                <h3>{t('requestGymLabel')}</h3>
                <p className="machine-request-detail__body">{gymLabel}</p>
              </section>
            </>
          ) : (
            <form
              className="machine-request-detail__edit"
              onSubmit={(e) => {
                e.preventDefault();
                if (!brandName.trim() || !machineName.trim() || !description.trim()) return;
                if (gymChoiceMode !== 'unknown' && !gymName.trim()) {
                  showToast(t('requestGymRequired'), 'error');
                  return;
                }
                updateMutation.mutate();
              }}
            >
              <div className="form-row">
                <label htmlFor="edit-brand">{t('brandName')}</label>
                <input
                  id="edit-brand"
                  className="input"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <div className="form-row">
                <label htmlFor="edit-machine">{t('machineName')}</label>
                <input
                  id="edit-machine"
                  className="input"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>
              <div className="form-row">
                <label htmlFor="edit-desc">{t('description')}</label>
                <textarea
                  id="edit-desc"
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  required
                />
              </div>
              <fieldset className="form-row community-board-page__choice">
                <legend>{t('requestGymLabel')}</legend>
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="edit-gym"
                    checked={gymChoiceMode === 'custom'}
                    onChange={() => setGymChoiceMode('custom')}
                  />
                  <span>{t('requestGymChoiceCustom')}</span>
                </label>
                {gymChoiceMode === 'custom' ? (
                  <input
                    className="input"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value.slice(0, 50))}
                    maxLength={50}
                    placeholder={t('requestGymCustomPlaceholder')}
                    required
                  />
                ) : null}
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="edit-gym"
                    checked={gymChoiceMode === 'unknown'}
                    onChange={() => setGymChoiceMode('unknown')}
                  />
                  <span>{t('requestGymChoiceUnknown')}</span>
                </label>
              </fieldset>
              <div className="community-board-page__form-actions">
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={updateMutation.isPending}
                >
                  {t('requestSaveEdit')}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setEditing(false)}
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          )}

          <div className="machine-request-detail__actions">
            {!isMine ? (
              <button
                type="button"
                className={`btn btn--secondary${voted ? ' is-active' : ''}`}
                onClick={handleWantThis}
                disabled={voteMutation.isPending}
              >
                <Icon name="users" size={16} aria-hidden />
                {voted ? t('requestWantThisDone') : t('requestWantThis')} · {voteCount}
              </button>
            ) : (
              <span className="machine-request-detail__vote-count">
                <Icon name="users" size={16} aria-hidden />
                {t('requestWantThisCount', { count: voteCount })}
              </span>
            )}

            {isMine && !editing ? (
              <>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setEditing(true)}
                  disabled={data.status === 'added'}
                >
                  {t('requestEdit')}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {t('deletePost')}
                </button>
              </>
            ) : null}
          </div>
        </article>

        <Link
          to={ROUTES.MACHINE_REQUESTS}
          className="btn btn--secondary btn--block community-board-page__back"
        >
          ← {t('requestBackToList')}
        </Link>
      </PageShell>
    </div>
  );
}
