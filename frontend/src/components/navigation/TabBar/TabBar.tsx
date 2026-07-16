import '@/styles/components.css';

export interface TabBarItem {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: TabBarItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}

export function TabBar({ tabs, activeId, onChange, ariaLabel }: TabBarProps) {
  return (
    <div className="tab-bar" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          className={`tab-bar__item${activeId === tab.id ? ' tab-bar__item--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
