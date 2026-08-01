import type { ReactNode } from 'react';
import '@/styles/community.css';

interface BoardIndexPanelProps {
  countLabel: string;
  columnHeader?: ReactNode;
  children: ReactNode;
}

export function BoardIndexPanel({ countLabel, columnHeader, children }: BoardIndexPanelProps) {
  return (
    <div className="board-index">
      <div className="board-index__head">
        <span className="board-index__count">{countLabel}</span>
      </div>
      {columnHeader ? <div className="board-index__cols">{columnHeader}</div> : null}
      <div className="board-index__body">{children}</div>
    </div>
  );
}
