import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MACHINE_REQUEST_UNKNOWN_VALUE, type MachineRequest } from '@machinefit/shared';
import { Icon } from '@/components/icons/Icon';
import { ROUTES } from '@/constants/routes';
import { resolveMachineRequestMediaUrl } from '@/utils/machineRequestMediaUrl';
import '@/styles/community.css';

interface BoardRequestRowProps {
  request: MachineRequest;
  onWantThis?: (requestId: string) => void;
  isVoting?: boolean;
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

export function BoardRequestRow({ request, onWantThis, isVoting }: BoardRequestRowProps) {
  const { t } = useTranslation('community');
  const unknownLabel = t('requestFieldUnknownLabel');
  const statusLabel = t(`requestStatus_${request.status}`, { defaultValue: request.status });
  const thumbUrl = resolveMachineRequestMediaUrl(request.primaryImageUrl);
  const href = ROUTES.MACHINE_REQUEST_DETAIL.replace(':requestId', request.id);
  const gymLabel =
    request.gymChoiceMode === 'unknown'
      ? t('requestGymUnknownLabel')
      : request.gymName?.trim() || undefined;
  const voteCount = request.voteCount ?? 0;
  const voted = Boolean(request.votedByMe);
  const isMine = Boolean(request.isMine);

  return (
    <div className="board-index-row-wrap">
      <div className="board-index-row board-index-row--with-thumb board-index-row--request">
        <Link to={href} className="board-index-row__main-link" aria-label={requestTitle(request, unknownLabel)}>
          {thumbUrl ? (
            <span className="board-index-row__thumb" aria-hidden>
              <img src={thumbUrl} alt="" loading="lazy" decoding="async" />
            </span>
          ) : (
            <span className="board-index-row__thumb board-index-row__thumb--empty" aria-hidden>
              —
            </span>
          )}
          <span className="board-index-row__body">
            <span className="board-index-row__title">{requestTitle(request, unknownLabel)}</span>
            <span className="board-index-row__request-sub">
              {request.authorName ? (
                <span className="board-index-row__author">{request.authorName}</span>
              ) : null}
              {gymLabel ? <span className="board-index-row__gym">{gymLabel}</span> : null}
            </span>
          </span>
          <span className="board-index-row__meta board-index-row__meta--request">
            <span className={`board-index-row__status board-index-row__status--${request.status}`}>
              {statusLabel}
            </span>
            <span
              className={`board-index-row__stat board-index-row__stat--want${
                voted ? ' board-index-row__stat--want-active' : ''
              }`}
              title={t('requestWantThisCount', { count: voteCount })}
            >
              <Icon name="users" size={12} className="board-index-row__stat-icon" aria-hidden />
              <span className="board-index-row__stat-num">{voteCount}</span>
            </span>
            <time className="board-index-row__date" dateTime={request.createdAt}>
              {formatDateShort(request.createdAt)}
            </time>
          </span>
        </Link>
        <div className="board-index-row__side-actions">
          {isMine ? (
            <span className="board-index-row__mine">{t('requestMine')}</span>
          ) : (
            <button
              type="button"
              className={`board-index-row__want-btn${voted ? ' board-index-row__want-btn--active' : ''}`}
              disabled={isVoting || !onWantThis}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onWantThis?.(request.id);
              }}
            >
              {voted ? t('requestWantThisDone') : t('requestWantThis')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
