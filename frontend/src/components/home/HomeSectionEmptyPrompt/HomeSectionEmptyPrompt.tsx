import { Link } from 'react-router-dom';
import { Icon, type IconName } from '@/components/icons/Icon';
import '@/styles/home.css';

interface HomeSectionEmptyPromptProps {
  icon: IconName;
  title: string;
  description: string;
  to: string;
}

export function HomeSectionEmptyPrompt({
  icon,
  title,
  description,
  to,
}: HomeSectionEmptyPromptProps) {
  return (
    <Link to={to} className="home-section-empty">
      <span className="home-section-empty__icon" aria-hidden>
        <Icon name={icon} size={24} />
      </span>
      <span className="home-section-empty__body">
        <span className="home-section-empty__title">{title}</span>
        <span className="home-section-empty__description">{description}</span>
      </span>
      <Icon name="chevronRight" size={20} className="home-section-empty__chevron" aria-hidden />
    </Link>
  );
}
