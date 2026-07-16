import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import '@/styles/home.css';
import '@/styles/phase4.css';

export function QuickSearchBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const goToSearch = () => {
    const q = query.trim();
    navigate(q ? `${ROUTES.MACHINES}?q=${encodeURIComponent(q)}` : ROUTES.MACHINES);
  };

  return (
    <form
      className="home-quick-search"
      onSubmit={(e) => {
        e.preventDefault();
        goToSearch();
      }}
    >
      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('pages.home.searchPlaceholder')}
        aria-label={t('pages.home.searchPlaceholder')}
      />
      <Link to={ROUTES.SCAN} className="btn btn--secondary home-quick-search__qr" aria-label={t('qr.scanTitle')}>
        📷
      </Link>
      <button type="submit" className="btn btn--primary">
        {t('actions.search')}
      </button>
    </form>
  );
}
