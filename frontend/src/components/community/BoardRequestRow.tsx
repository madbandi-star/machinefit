import { useTranslation } from 'react-i18next';
import type { MachineRequest } from '@machinefit/shared';
import '@/styles/community.css';

interface BoardRequestRowProps {
  request: MachineRequest;
}

function formatDateShort(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
    ...(sameYear ? {} : { year: '2-digit' }),
  });
}

function requestTitle(request: MachineRequest) {
  if (request.brandName) {
    return `${request.brandName} · ${request.machineName}`;
  }
  return request.machineName;
}

export function BoardRequestRow({ request }: BoardRequestRowProps) {
  const { t } = useTranslation('community');
  const statusLabel = t(`requestStatus_${request.status}`, { defaultValue: request.status });

  return (
    <div className="board-index-row-wrap">
      <article className="board-index-row board-index-row--static">
        <span className="board-index-row__title">{requestTitle(request)}</span>
        <span className="board-index-row__meta">
          <span className={`board-index-row__status board-index-row__status--${request.status}`}>
            {statusLabel}
          </span>
          <time dateTime={request.createdAt}>{formatDateShort(request.createdAt)}</time>
        </span>
      </article>
    </div>
  );
}
