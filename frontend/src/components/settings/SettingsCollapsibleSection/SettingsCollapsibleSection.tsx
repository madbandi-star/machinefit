import { useEffect, useId, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';

export interface SettingsCollapsibleSectionProps {
  id?: string;
  title: string;
  description?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export function SettingsCollapsibleSection({
  id,
  title,
  description,
  defaultExpanded = false,
  children,
}: SettingsCollapsibleSectionProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const generatedId = useId();
  const bodyId = id ? `${id}-body` : generatedId;
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (!id) return;
    if (location.hash === `#${id}`) {
      setExpanded(true);
    }
  }, [id, location.hash]);

  return (
    <section
      id={id}
      className={`form-section settings-collapsible-section${
        expanded ? ' settings-collapsible-section--expanded' : ''
      }`}
    >
      <button
        type="button"
        className="settings-collapsible-section__toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls={bodyId}
      >
        <h3 className="form-section__title settings-collapsible-section__title">{title}</h3>
        <Icon
          name="chevronDown"
          size={18}
          className={`settings-collapsible-section__chevron${
            expanded ? ' settings-collapsible-section__chevron--open' : ''
          }`}
          aria-hidden
        />
        <span className="visually-hidden">{expanded ? t('collapse') : t('expand')}</span>
      </button>

      {expanded ? (
        <div id={bodyId} className="settings-collapsible-section__body">
          {description ? <div className="form-section__desc">{description}</div> : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}
