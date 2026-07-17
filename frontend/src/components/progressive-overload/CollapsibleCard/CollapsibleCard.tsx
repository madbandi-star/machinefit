import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/icons/Icon';

interface CollapsibleCardProps {
  title: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  bodyClassName?: string;
}

export function CollapsibleCard({
  title,
  summary,
  children,
  defaultOpen = true,
  className,
  bodyClassName,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`collapsible-card card${open ? '' : ' collapsible-card--collapsed'}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        className="collapsible-card__header"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="collapsible-card__heading">
          <div className="collapsible-card__title">{title}</div>
          {summary ? <div className="collapsible-card__summary">{summary}</div> : null}
        </div>
        <Icon
          name="chevronDown"
          size={18}
          className={`collapsible-card__chevron${open ? ' collapsible-card__chevron--open' : ''}`}
        />
      </button>
      {open ? (
        <div className={`collapsible-card__body${bodyClassName ? ` ${bodyClassName}` : ''}`}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
