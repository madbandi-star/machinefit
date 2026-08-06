import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { NOTICE_CATEGORIES, type NoticeCategory } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { noticeApi } from '@/api/notice.api';
import { ROUTES } from '@/constants/routes';
import '@/styles/notices.css';

function formatNoticeDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale || 'ko', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function NoticesPage() {
  const { t, i18n } = useTranslation(['community', 'common']);
  const [params, setParams] = useSearchParams();
  const category = (params.get('category') ?? '') as NoticeCategory | '';
  const q = params.get('q') ?? '';
  const searchIn = params.get('searchIn') ?? 'both';
  const page = Number(params.get('page') ?? '1') || 1;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notices', 'list', category, q, searchIn, page, i18n.language],
    queryFn: async () => {
      const res = await noticeApi.list({
        page,
        pageSize: 20,
        category: category || undefined,
        q: q || undefined,
        searchIn,
        language: i18n.language.slice(0, 2),
      });
      return res.data.data;
    },
  });

  const update = (mutate: (next: URLSearchParams) => void) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        mutate(next);
        return next;
      },
      { replace: true }
    );
  };

  return (
    <PageShell title={t('community:notices.title')} subtitle={t('community:notices.subtitle')}>
      <div className="notice-list__toolbar">
        <div className="notice-list__filters" role="tablist" aria-label={t('community:notices.filters')}>
          <button
            type="button"
            className={`notice-list__chip${!category ? ' is-active' : ''}`}
            onClick={() =>
              update((next) => {
                next.delete('category');
                next.delete('page');
              })
            }
          >
            {t('community:notices.categoryAll')}
          </button>
          {NOTICE_CATEGORIES.map((code) => (
            <button
              key={code}
              type="button"
              className={`notice-list__chip${category === code ? ' is-active' : ''}`}
              onClick={() =>
                update((next) => {
                  next.set('category', code);
                  next.delete('page');
                })
              }
            >
              {t(`community:notices.categories.${code}`)}
            </button>
          ))}
        </div>
        <form
          className="notice-list__search"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            update((next) => {
              const query = String(fd.get('q') ?? '').trim();
              const inField = String(fd.get('searchIn') ?? 'both');
              if (query) next.set('q', query);
              else next.delete('q');
              next.set('searchIn', inField);
              next.delete('page');
            });
          }}
        >
          <select name="searchIn" defaultValue={searchIn} aria-label={t('community:notices.searchIn')}>
            <option value="both">{t('community:notices.searchBoth')}</option>
            <option value="title">{t('community:notices.searchTitle')}</option>
            <option value="content">{t('community:notices.searchContent')}</option>
          </select>
          <input
            name="q"
            defaultValue={q}
            placeholder={t('community:notices.searchPlaceholder')}
            aria-label={t('community:notices.searchPlaceholder')}
          />
          <button type="submit" className="btn btn--secondary">
            {t('common:actions.search', { defaultValue: 'Search' })}
          </button>
        </form>
      </div>

      {isLoading ? <Skeleton count={4} height={72} /> : null}
      {isError ? <QueryErrorMessage /> : null}

      {!isLoading && !isError && (data?.items.length ?? 0) === 0 ? (
        <EmptyState icon="bell" title={t('community:notices.empty')} />
      ) : null}

      <div className="notice-list">
        {data?.items.map((item) => (
          <Link
            key={item.id}
            to={ROUTES.NOTICE_DETAIL.replace(':noticeId', item.id)}
            className="notice-row card--interactive"
          >
            <div className="notice-row__title-row">
              {item.isImportant ? (
                <span className="notice-badge notice-badge--important">
                  {t('community:notices.important')}
                </span>
              ) : null}
              {item.isPinned ? (
                <span className="notice-badge notice-badge--pinned">
                  {t('community:notices.pinned')}
                </span>
              ) : null}
              {item.isNew ? (
                <span className="notice-badge notice-badge--new">NEW</span>
              ) : null}
              <span className="notice-badge notice-badge--category">
                {t(`community:notices.categories.${item.category}`)}
              </span>
              <h2 className="notice-row__title">{item.title}</h2>
            </div>
            <p className="notice-row__meta">
              <span>{formatNoticeDate(item.publishAt ?? item.createdAt, i18n.language)}</span>
              <span>
                {t('community:notices.views', { count: item.viewCount })}
              </span>
            </p>
          </Link>
        ))}
      </div>

      {data && data.total > data.pageSize ? (
        <div className="notice-detail__nav">
          <button
            type="button"
            className="btn btn--secondary"
            disabled={page <= 1}
            onClick={() =>
              update((next) => {
                next.set('page', String(page - 1));
              })
            }
          >
            {t('common:actions.prev', { defaultValue: 'Prev' })}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={page * data.pageSize >= data.total}
            onClick={() =>
              update((next) => {
                next.set('page', String(page + 1));
              })
            }
          >
            {t('common:actions.next', { defaultValue: 'Next' })}
          </button>
        </div>
      ) : null}
    </PageShell>
  );
}
