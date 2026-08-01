import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  MACHINE_REQUEST_UNKNOWN_VALUE,
  type MachineRequest,
  type MachineRequestSort,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { machineRequestApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { resolveMachineRequestMediaUrl } from '@/utils/machineRequestMediaUrl';
import '@/styles/components.css';
import '@/styles/photo-board.css';

const SORTS: MachineRequestSort[] = ['latest', 'popular', 'views', 'comments'];

type RequestScope = 'all' | 'mine' | 'liked';

function displayField(value: string | undefined, unknownLabel: string) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed === MACHINE_REQUEST_UNKNOWN_VALUE) return unknownLabel;
  return trimmed;
}

function requestTitle(request: MachineRequest, unknownLabel: string) {
  const brand = displayField(request.brandName, unknownLabel);
  const machine = displayField(request.machineName, unknownLabel);
  return `${brand} · ${machine}`;
}

function RequestCard({ request }: { request: MachineRequest }) {
  const { t } = useTranslation('community');
  const unknownLabel = t('requestFieldUnknownLabel');
  const statusKey =
    request.status === 'approved' ? 'reviewing' : request.status || 'pending';
  const statusLabel = t(`requestStatus_${statusKey}`, { defaultValue: statusKey });
  const imageCount = request.imageCount ?? request.images?.length ?? (request.primaryImageUrl ? 1 : 0);
  const thumb = resolveMachineRequestMediaUrl(request.primaryImageUrl);

  return (
    <Link
      to={ROUTES.MACHINE_REQUESTS_DETAIL.replace(':requestId', request.id)}
      className="photo-card"
    >
      <div className="photo-card__media">
        {thumb ? (
          <img
            className="photo-card__img"
            src={thumb}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="photo-card__placeholder" aria-hidden />
        )}
        <span className={`photo-card__status photo-card__status--${statusKey}`}>{statusLabel}</span>
        {imageCount > 1 ? <span className="photo-card__count">{imageCount}</span> : null}
        {request.likedByMe ? (
          <span className="photo-card__liked" aria-label={t('photoLiked')}>
            ♥
          </span>
        ) : null}
      </div>
      <div className="photo-card__body">
        <h3 className="photo-card__title">{requestTitle(request, unknownLabel)}</h3>
        <div className="photo-card__meta">
          <span className="photo-card__author">{request.authorName ?? '—'}</span>
          <span className="photo-card__stats">
            <span>♥ {request.likeCount ?? 0}</span>
            <span>💬 {request.commentCount ?? 0}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MachineRequestBoardPage() {
  const { t } = useTranslation('community');
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [params, setParams] = useSearchParams();

  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const sort = (params.get('sort') as MachineRequestSort) || 'latest';
  const q = params.get('q') || '';
  const mine = params.get('mine') === '1';
  const likedByMe = params.get('liked') === '1';
  const scope: RequestScope = mine ? 'mine' : likedByMe ? 'liked' : 'all';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: QUERY_KEYS.machineRequests({ page, sort, q, mine, likedByMe }),
    queryFn: async () => {
      const res = await machineRequestApi.list({
        page,
        limit: 18,
        sort: SORTS.includes(sort) ? sort : 'latest',
        q: q || undefined,
        mine: mine || undefined,
        likedByMe: likedByMe || undefined,
      });
      return res.data.data;
    },
  });

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    action();
  };

  const setScope = (nextScope: RequestScope) => {
    const apply = () => {
      const next = new URLSearchParams(params);
      next.delete('mine');
      next.delete('liked');
      next.delete('page');
      if (nextScope === 'mine') next.set('mine', '1');
      if (nextScope === 'liked') next.set('liked', '1');
      setParams(next);
    };
    if (nextScope === 'all') {
      apply();
      return;
    }
    requireAuth(apply);
  };

  return (
    <div className="photo-board-page">
      <PageShell>
        <header className="photo-top">
          <div className="photo-top__text">
            <h1>{t('machineRequests')}</h1>
            <p>{t('machineRequestsSubtitle')}</p>
          </div>
          <button
            type="button"
            className="photo-top__write"
            onClick={() => requireAuth(() => navigate(ROUTES.MACHINE_REQUESTS_WRITE))}
          >
            {t('newRequest')}
          </button>
        </header>

        <div className="photo-controls">
          <div className="photo-controls__search-row">
            <input
              className="photo-search"
              value={q}
              onChange={(e) => updateParam('q', e.target.value || undefined)}
              placeholder={t('requestSearchPlaceholder')}
              aria-label={t('requestSearchPlaceholder')}
            />
            {data ? (
              <span className="photo-count">{t('requestCount', { count: data.meta.total })}</span>
            ) : null}
          </div>

          <div className="photo-scope" role="tablist" aria-label={t('photoScopeLabel')}>
            {(
              [
                ['all', t('photoAll')],
                ['mine', t('photoMyPosts')],
                ['liked', t('photoMyLikes')],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={scope === value}
                className={`photo-scope__btn${scope === value ? ' is-active' : ''}`}
                onClick={() => setScope(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="photo-sort" role="tablist" aria-label={t('photoSortLabel')}>
            {SORTS.map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={sort === value}
                className={`photo-sort__btn${sort === value ? ' is-active' : ''}`}
                onClick={() => updateParam('sort', value)}
              >
                {t(`photoSort.${value}`)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="photo-grid photo-grid--skeleton" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="photo-card photo-card--skeleton">
                <Skeleton height={120} />
              </div>
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="photo-empty">
            <span className="photo-empty__icon" aria-hidden>
              📷
            </span>
            <strong>{t('noRequests')}</strong>
          </div>
        ) : (
          <>
            <div className={`photo-grid${isFetching ? ' is-fetching' : ''}`}>
              {data.items.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={(nextPage) => updateParam('page', String(nextPage))}
            />
          </>
        )}

        <Link to={ROUTES.MY_PAGE} className="photo-back-link">
          ← {t('photoBackMyPage')}
        </Link>
      </PageShell>
    </div>
  );
}
