import { useTranslation } from 'react-i18next';
import { MACHINE_REQUEST_UNKNOWN_VALUE, type MachineRequest } from '@machinefit/shared';
import { API_BASE_URL } from '@/services/http/axios-client';
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

function displayField(value: string | undefined, unknownLabel: string) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed === MACHINE_REQUEST_UNKNOWN_VALUE) return unknownLabel;
  return trimmed;
}

function requestTitle(request: MachineRequest, unknownLabel: string) {
  const brand = displayField(request.brandName, unknownLabel);
  const machine = displayField(request.machineName, unknownLabel);
  return `${brand} · ${machine}`;
}

function resolveRequestThumb(url?: string) {
  if (!url) return undefined;
  const apiBase = API_BASE_URL.replace(/\/+$/, '');
  if (url.startsWith('http')) {
    try {
      const parsed = new URL(url);
      const marker = '/machine-requests/images/';
      const idx = parsed.pathname.indexOf(marker);
      if (idx >= 0) return `${apiBase}${parsed.pathname.slice(idx)}${parsed.search}`;
    } catch {
      /* keep original */
    }
    return url;
  }
  if (url.startsWith('/')) return `${apiBase}${url}`;
  return url;
}

export function BoardRequestRow({ request }: BoardRequestRowProps) {
  const { t } = useTranslation('community');
  const unknownLabel = t('requestFieldUnknownLabel');
  const statusLabel = t(`requestStatus_${request.status}`, { defaultValue: request.status });
  const thumbUrl = resolveRequestThumb(request.primaryImageUrl);
  const gymLabel =
    request.gymChoiceMode === 'unknown'
      ? t('requestGymUnknownLabel')
      : request.gymName?.trim() || undefined;

  return (
    <div className="board-index-row-wrap">
      <article className="board-index-row board-index-row--static board-index-row--with-thumb">
        {thumbUrl ? (
          <span className="board-index-row__thumb" aria-hidden>
            <img src={thumbUrl} alt="" loading="lazy" decoding="async" />
          </span>
        ) : null}
        <span className="board-index-row__body">
          <span className="board-index-row__title">{requestTitle(request, unknownLabel)}</span>
          {gymLabel ? <span className="board-index-row__gym">{gymLabel}</span> : null}
        </span>
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
