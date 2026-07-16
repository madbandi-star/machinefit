import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import { ROUTES } from '@/constants/routes';
import '@/styles/home.css';

export function MuscleGroupShortcuts() {
  const { t } = useTranslation(['common', 'machines']);

  return (
    <section className="home-section">
      <h2 className="home-section__title home-section__title--spaced">
        {t('pages.home.muscleShortcuts')}
      </h2>
      <div className="home-muscle-shortcuts">
        {MUSCLE_GROUPS.map((group) => (
          <Link
            key={group}
            to={`${ROUTES.MACHINES}?muscle=${group}`}
            className={`home-muscle-shortcut home-muscle-shortcut--${group}`}
          >
            {t(`machines:muscleGroups.${group}`)}
          </Link>
        ))}
      </div>
    </section>
  );
}
