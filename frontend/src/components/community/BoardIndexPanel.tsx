import type { ReactNode } from 'react';
import '@/styles/community.css';

interface BoardIndexPanelProps {
  countLabel: string;
  children: ReactNode;
}

export function BoardIndexPanel({ countLabel, children }: BoardIndexPanelProps) {
  return (
    <div className="board-index">
      <div className="board-index__head">
        <span className="board-index__count">{countLabel}</span>
      </div>
      <div className="board-index__body">{children}</div>
    </div>
  );
}
