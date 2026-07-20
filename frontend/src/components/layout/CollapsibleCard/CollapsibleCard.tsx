import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/icons/Icon';

interface CollapsibleCardProps {
  title: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
}

export function CollapsibleCard({
  title,
  summary,
  children,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  className,
  bodyClassName,
  headerClassName,
}: CollapsibleCardProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;

  const toggle = () => {
    const next = !open;
    onOpenChange?.(next);
    if (controlledOpen === undefined) {
      setUncontrolledOpen(next);
    }
  };

  return (
    <section
      className={`collapsible-card card${open ? '' : ' collapsible-card--collapsed'}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        className={`collapsible-card__header${headerClassName ? ` ${headerClassName}` : ''}`}
        aria-expanded={open}
        onClick={toggle}
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
