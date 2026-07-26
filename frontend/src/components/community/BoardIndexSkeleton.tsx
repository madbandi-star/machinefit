import '@/styles/community.css';

interface BoardIndexSkeletonProps {
  rows?: number;
}

export function BoardIndexSkeleton({ rows = 8 }: BoardIndexSkeletonProps) {
  return (
    <div className="board-index board-index--loading" aria-hidden>
      <div className="board-index__head">
        <span className="board-index__count board-index__shimmer" />
      </div>
      <div className="board-index__body">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="board-index-row board-index-row--skeleton">
            <span className="board-index-row__shimmer board-index-row__shimmer--title" />
            <span className="board-index-row__shimmer board-index-row__shimmer--meta" />
          </div>
        ))}
      </div>
    </div>
  );
}
