import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { ROUTES } from '@/constants/routes';
import '@/styles/home.css';

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
      <div className="home-quick-search__field">
        <Icon name="search" size={18} className="home-quick-search__leading-icon" aria-hidden />
        <input
          className="input home-quick-search__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('pages.home.searchPlaceholder')}
          aria-label={t('pages.home.searchPlaceholder')}
        />
      </div>
      <Link
        to={ROUTES.SCAN}
        className="btn btn--secondary icon-btn home-quick-search__action"
        aria-label={t('qr.scanTitle')}
      >
        <Icon name="qr" size={20} />
      </Link>
      <button
        type="submit"
        className="btn btn--secondary icon-btn home-quick-search__action"
        aria-label={t('actions.search')}
      >
        <Icon name="search" size={20} />
      </button>
    </form>
  );
}
