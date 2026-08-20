import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { FavoriteItem } from '@/api';
import { favoriteApi } from '@/api';
import { Icon } from '@/components/icons/Icon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import { SafeImage } from '@/components/media/SafeImage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useFavoritesList } from '@/hooks/useFavoritesList';
import { useUIStore } from '@/store/ui.store';
import { machinePlaceholderUrl, resolveMachineImageUrl } from '@/utils/catalogAssets';
import { shouldShowDefaultMachineMuscle, formatBrandedMachineLabel } from '@/utils/freeWeightDisplay';
import { formatHistoryTime, normalizeDateKey } from '@/utils/historyDate';
import '@/styles/records.css';

function formatFavoriteDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

function formatWorkoutDate(dateKey: string | undefined, locale: string): string {
  if (!dateKey) return '—';
  const key = normalizeDateKey(dateKey);
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return '—';
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

export function FavoritesListPanel() {
  const { t, i18n } = useTranslation(['common', 'machines']);
  const locale = i18n.language || 'ko';
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const memberKey = activeMemberId ?? '';
  const favoritesKey = QUERY_KEYS.favorites(activeGymId ?? '', memberKey);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const { data, isLoading, isError } = useFavoritesList();

  const allIds = useMemo(() => (data ?? []).map((item) => item.id), [data]);
  const selectedCount = selectedIds.size;
  const allSelected = allIds.length > 0 && selectedCount === allIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const clearSelection = () => setSelectedIds(new Set());

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (allIds.length > 0 && prev.size === allIds.length) return new Set();
      return new Set(allIds);
    });
  };

  const removeMutation = useMutation({
    mutationFn: (item: { id: string; machineCode: string }) => favoriteApi.remove(item.id),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: favoritesKey });
      const previous = queryClient.getQueryData<FavoriteItem[]>(favoritesKey);
      if (previous) {
        queryClient.setQueryData(
          favoritesKey,
          previous.filter((favorite) => favorite.id !== item.id)
        );
      }
      setSelectedIds((prev) => {
        if (!prev.has(item.id)) return prev;
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });

      const favoriteCheckKey = QUERY_KEYS.favoriteCheck(
        activeGymId ?? '',
        item.machineCode,
        memberKey
      );
      await queryClient.cancelQueries({ queryKey: favoriteCheckKey });
      const previousCheck = queryClient.getQueryData<{ favorited: boolean; favoriteId?: string }>(
        favoriteCheckKey
      );
      queryClient.setQueryData(favoriteCheckKey, { favorited: false, favoriteId: undefined });

      return { previous, previousCheck, favoriteCheckKey };
    },
    onSuccess: async (_data, item, context) => {
      const favoriteCheckKey =
        context?.favoriteCheckKey ??
        QUERY_KEYS.favoriteCheck(activeGymId ?? '', item.machineCode, memberKey);
      queryClient.setQueryData(favoriteCheckKey, { favorited: false, favoriteId: undefined });
      await queryClient.invalidateQueries({ queryKey: ['user', 'home-bootstrap'] });
      showToast(t('machines:recommendation.removedFavorite'), 'success');
    },
    onError: (_error, _item, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favoritesKey, context.previous);
      }
      if (context?.previousCheck && context.favoriteCheckKey) {
        queryClient.setQueryData(context.favoriteCheckKey, context.previousCheck);
      }
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: (ids: string[]) => favoriteApi.removeBulk(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: favoritesKey });
      const previous = queryClient.getQueryData<FavoriteItem[]>(favoritesKey);
      const idSet = new Set(ids);
      if (previous) {
        queryClient.setQueryData(
          favoritesKey,
          previous.filter((favorite) => !idSet.has(favorite.id))
        );
      }
      clearSelection();
      return { previous };
    },
    onSuccess: async (res, ids) => {
      const removed = res.data.data?.removed ?? ids.length;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['favorites'] }),
        queryClient.invalidateQueries({ queryKey: ['user', 'home-bootstrap'] }),
      ]);
      showToast(t('machines:favorites.bulkRemoved', { count: removed }), 'success');
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favoritesKey, context.previous);
      }
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    if (!window.confirm(t('machines:favorites.confirmBulkDelete', { count: selectedCount }))) {
      return;
    }
    bulkRemoveMutation.mutate([...selectedIds]);
  };

  if (!activeGymId || !memberScopeReady || isLoading) return <Skeleton count={3} height={72} />;
  if (isError) return <QueryErrorMessage />;
  if (!data?.length) {
    return <Navigate to={ROUTES.FAVORITES_EMPTY} replace />;
  }

  const busy = removeMutation.isPending || bulkRemoveMutation.isPending;

  return (
    <div className="favorites-list">
      <div className="favorites-list__toolbar">
        <label className="favorites-list__select-all">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleAll}
            disabled={busy}
          />
          <span>{allSelected ? t('machines:favorites.deselectAll') : t('machines:favorites.selectAll')}</span>
        </label>
        <button
          type="button"
          className="btn btn--secondary btn--sm favorites-list__bulk-delete"
          disabled={selectedCount === 0 || busy}
          onClick={handleBulkDelete}
        >
          {t('machines:favorites.bulkDelete')}
          {selectedCount > 0 ? ` (${selectedCount})` : ''}
        </button>
      </div>

      <div className="records-list favorites-list__rows">
        {data.map((item) => {
          const primaryUrl = item.recommendationId
            ? `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', item.machineCode)}?id=${item.recommendationId}&from=favorites`
            : ROUTES.MACHINE_DETAIL.replace(':machineCode', item.machineCode);
          const displayName = formatBrandedMachineLabel(
            item.machineName,
            item.brandName,
            item.machineCode
          );
          const imageUrl = resolveMachineImageUrl(item.machineCode, item.primaryImageUrl);
          const checked = selectedIds.has(item.id);
          const workoutDate = formatWorkoutDate(item.lastWorkoutLogDate, locale);
          const workoutTime = item.lastWorkoutAt
            ? formatHistoryTime(item.lastWorkoutAt, locale)
            : '—';

          return (
            <article
              key={item.id}
              className={`favorite-row${checked ? ' favorite-row--selected' : ''}`}
            >
              <label className="favorite-row__check">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOne(item.id)}
                  disabled={busy}
                  aria-label={t('machines:favorites.selectItem', { name: displayName })}
                />
              </label>

              <Link to={primaryUrl} className="favorite-row__link">
                <div className="favorite-row__thumb">
                  <SafeImage
                    src={imageUrl || machinePlaceholderUrl()}
                    fallbackSrc={machinePlaceholderUrl()}
                    alt=""
                    loading="lazy"
                    width={56}
                    height={56}
                  />
                </div>
                <div className="favorite-row__main">
                  <MachineNameWithMuscle
                    muscleGroup={
                      shouldShowDefaultMachineMuscle(item.machineCode) ? item.muscleGroup : undefined
                    }
                    name={displayName}
                    iconSize={18}
                    labelClassName="favorite-row__name"
                  />
                  <dl className="favorite-row__meta">
                    <div>
                      <dt>{t('machines:favorites.favoritedAt')}</dt>
                      <dd>{formatFavoriteDate(item.createdAt, locale)}</dd>
                    </div>
                    <div>
                      <dt>{t('machines:favorites.lastWorkoutDate')}</dt>
                      <dd>{workoutDate}</dd>
                    </div>
                    <div>
                      <dt>{t('machines:favorites.lastWorkoutTime')}</dt>
                      <dd>{workoutTime}</dd>
                    </div>
                  </dl>
                </div>
              </Link>

              <button
                type="button"
                className="favorite-row__remove"
                aria-label={t('machines:favorites.remove')}
                onClick={() => removeMutation.mutate({ id: item.id, machineCode: item.machineCode })}
                disabled={busy}
              >
                <Icon name="heart" size={18} />
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
