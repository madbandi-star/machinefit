import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search } from 'lucide-react';
import type { QaCategory } from '@machinefit/shared';
import { QA_CATEGORIES } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Icon } from '@/components/icons/Icon';
import { qaApi } from '@/api/qa.api';
import { ROUTES } from '@/constants/routes';
import '@/styles/qa.css';
import '@/styles/components.css';

function categoryLabel(t: (k: string) => string, code: string): string {
  return t(`qa.categories.${code}`);
}

export function QaPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<QaCategory | ''>('');
  const [openId, setOpenId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['qa', 'list', q, category],
    queryFn: async () =>
      (
        await qaApi.list({
          q: q.trim() || undefined,
          category: category || undefined,
          page: 1,
          pageSize: 100,
          popularLimit: 5,
          sort: 'priority',
        })
      ).data.data,
  });

  const popular = listQuery.data?.popular ?? [];
  const items = listQuery.data?.items ?? [];
  const searching = q.trim().length > 0;

  const frequent = useMemo(() => {
    if (searching || category) return items;
    return items.filter((item) => item.priority <= 1).slice(0, 12);
  }, [items, searching, category]);

  const rest = useMemo(() => {
    if (searching || category) return [];
    const freqIds = new Set(frequent.map((i) => i.id));
    return items.filter((i) => !freqIds.has(i.id));
  }, [items, frequent, searching, category]);

  return (
    <PageShell>
      <div className="qa-page">
        <header className="qa-page__header">
          <h1 className="page-hero-title">
            <span className="page-hero-title__icon" aria-hidden>
              <Icon name="message" size={18} />
            </span>
            {t('qa.title')}
          </h1>
          <p className="qa-page__lead">{t('qa.lead')}</p>
        </header>

        <label className="qa-search">
          <Search size={18} strokeWidth={2} aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('qa.searchPlaceholder')}
            aria-label={t('qa.searchPlaceholder')}
          />
        </label>

        <div className="qa-chips" role="group" aria-label={t('qa.categoryFilter')}>
          <button
            type="button"
            aria-pressed={!category}
            onClick={() => setCategory('')}
          >
            {t('qa.allCategories')}
          </button>
          {QA_CATEGORIES.map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={category === code}
              onClick={() => setCategory(code)}
            >
              {categoryLabel(t, code)}
            </button>
          ))}
        </div>

        {listQuery.isLoading ? <Skeleton count={5} height={72} /> : null}
        {listQuery.isError ? <QueryErrorMessage /> : null}

        {!listQuery.isLoading && !listQuery.isError && items.length === 0 ? (
          <div className="qa-empty community-empty">
            <span className="community-empty__icon" aria-hidden>
              <Icon name="search" size={24} />
            </span>
            <strong>{t('qa.emptySearch')}</strong>
          </div>
        ) : null}

        {!searching && !category && popular.length > 0 ? (
          <section>
            <h2 className="qa-section__title">{t('qa.popular')}</h2>
            <div className="qa-list">
              {popular.map((item) => (
                <QaAccordionItem
                  key={`pop-${item.id}`}
                  id={item.id}
                  title={item.title}
                  excerpt={item.excerpt}
                  category={categoryLabel(t, item.category)}
                  hot
                  open={openId === item.id}
                  onToggle={() => setOpenId((cur) => (cur === item.id ? null : item.id))}
                  moreLabel={t('qa.viewMore')}
                />
              ))}
            </div>
          </section>
        ) : null}

        {frequent.length > 0 ? (
          <section>
            <h2 className="qa-section__title">
              {searching || category ? t('qa.results') : t('qa.frequent')}
            </h2>
            <div className="qa-list">
              {frequent.map((item) => (
                <QaAccordionItem
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  excerpt={item.excerpt}
                  category={categoryLabel(t, item.category)}
                  open={openId === item.id}
                  onToggle={() => setOpenId((cur) => (cur === item.id ? null : item.id))}
                  moreLabel={t('qa.viewMore')}
                />
              ))}
            </div>
          </section>
        ) : null}

        {rest.length > 0 ? (
          <section>
            <h2 className="qa-section__title">{t('qa.allQuestions')}</h2>
            <div className="qa-list">
              {rest.map((item) => (
                <QaAccordionItem
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  excerpt={item.excerpt}
                  category={categoryLabel(t, item.category)}
                  open={openId === item.id}
                  onToggle={() => setOpenId((cur) => (cur === item.id ? null : item.id))}
                  moreLabel={t('qa.viewMore')}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="qa-footer-links">
          <Link to={ROUTES.SUPPORT}>{t('qa.askSupport')}</Link>
          <Link to={ROUTES.PRIVACY_RIGHTS}>{t('qa.privacyRights')}</Link>
        </div>
      </div>
    </PageShell>
  );
}

function QaAccordionItem({
  id,
  title,
  excerpt,
  category,
  hot,
  open,
  onToggle,
  moreLabel,
}: {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  hot?: boolean;
  open: boolean;
  onToggle: () => void;
  moreLabel: string;
}) {
  return (
    <article className="qa-item" data-open={open ? 'true' : 'false'}>
      <button type="button" className="qa-item__summary" aria-expanded={open} onClick={onToggle}>
        <span>
          <p className="qa-item__q">Q. {title}</p>
          <span className="qa-item__meta">
            <span className="qa-badge">{category}</span>
            {hot ? <span className="qa-badge qa-badge--hot">HOT</span> : null}
          </span>
        </span>
        <ChevronDown className="qa-item__chevron" size={18} aria-hidden />
      </button>
      {open ? (
        <div className="qa-item__body">
          <p className="qa-item__answer">{excerpt}</p>
          <Link className="qa-item__more" to={ROUTES.QA_DETAIL.replace(':qaId', id)}>
            {moreLabel} ›
          </Link>
        </div>
      ) : null}
    </article>
  );
}
