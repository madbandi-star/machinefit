import { Link } from 'react-router-dom';
import { Icon, type IconName } from '@/components/icons/Icon';
import '@/styles/home.css';

interface HomeSectionEmptyPromptProps {
  icon: IconName;
  title: string;
  description: string;
  to: string;
  /** Optional accent pill under the description (presentation only). */
  badge?: string;
}

export function HomeSectionEmptyPrompt({
  icon,
  title,
  description,
  to,
  badge,
}: HomeSectionEmptyPromptProps) {
  return (
    <Link to={to} className="home-section-empty">
      <span className="home-section-empty__icon" aria-hidden>
        <Icon name={icon} size={22} />
      </span>
      <span className="home-section-empty__body">
        <span className="home-section-empty__title">{title}</span>
        <span className="home-section-empty__description">{description}</span>
        {badge ? <span className="home-section-empty__badge">{badge}</span> : null}
      </span>
      <span className="home-section-empty__chevron" aria-hidden>
        <Icon name="chevronRight" size={18} />
      </span>
    </Link>
  );
}
