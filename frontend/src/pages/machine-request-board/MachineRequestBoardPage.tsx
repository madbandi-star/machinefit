import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  MACHINE_REQUEST_UNKNOWN_VALUE,
  type MachineRequest,
  type MachineRequestGymChoiceMode,
  type MachineRequestTextChoiceMode,
  type PaginatedResponse,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BoardIndexPanel } from '@/components/community/BoardIndexPanel';
import { BoardIndexSkeleton } from '@/components/community/BoardIndexSkeleton';
import { BoardRequestRow } from '@/components/community/BoardRequestRow';
import { locationApi, machineRequestApi, userApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { resolveHomeGymName } from '@/utils/resolveHomeGymName';
import '@/styles/components.css';
import '@/styles/community.css';

const MAX_REQUEST_IMAGES = 5;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_GYM_NAME = 50;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function isAllowedRequestImage(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  if (ALLOWED_IMAGE_TYPES.has(mime)) return true;
  // Some mobile browsers omit MIME; fall back to extension (matches backend).
  return /\.(jpe?g|png|webp)$/i.test(file.name);
}

function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const payload = error.response?.data as { error?: { code?: string } } | undefined;
  return payload?.error?.code;
}

interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
}

function truncateGymLabel(value: string, max = MAX_GYM_NAME): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max);
}

function buildProfileGymLabel(locationPath?: string, gymName?: string): string {
  const location = locationPath?.trim() || '';
  const gym = gymName?.trim() || '';
  if (location && gym) return truncateGymLabel(`${location} · ${gym}`);
  if (gym) return truncateGymLabel(gym);
  if (location) return truncateGymLabel(location);
  return '';
}

function resolveTextField(
  mode: MachineRequestTextChoiceMode,
  value: string
): string {
  if (mode === 'unknown') return MACHINE_REQUEST_UNKNOWN_VALUE;
  return value.trim();
}

export function MachineRequestBoardPage() {
  const { t } = useTranslation('community');
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authReady = useAuthHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const viewerId = user?.id ?? null;
  const showToast = useUIStore((s) => s.showToast);
  const { activeGym, gyms } = useActiveGym();

  const [showForm, setShowForm] = useState(false);
  const [brandMode, setBrandMode] = useState<MachineRequestTextChoiceMode>('custom');
  const [machineMode, setMachineMode] = useState<MachineRequestTextChoiceMode>('custom');
  const [descriptionMode, setDescriptionMode] =
    useState<MachineRequestTextChoiceMode>('custom');
  const [brandName, setBrandName] = useState('');
  const [machineName, setMachineName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [commercialUseConsent, setCommercialUseConsent] = useState(false);
  const [gymChoiceMode, setGymChoiceMode] = useState<MachineRequestGymChoiceMode>('profile');
  const [customGymName, setCustomGymName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listQueryKey = QUERY_KEYS.machineRequests(viewerId);

  const { data, isLoading } = useQuery({
    queryKey: listQueryKey,
    queryFn: async () => {
      const res = await machineRequestApi.list({ limit: 30 });
      return res.data.data;
    },
    // Wait for access-token restore so isMine is computed for the real viewer.
    enabled: authReady,
  });
  const listLoading = !authReady || isLoading;

  const meQuery = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: async () => (await userApi.getMe()).data.data,
    enabled: isAuthenticated && showForm,
    staleTime: 30_000,
  });

  const locationQuery = useQuery({
    queryKey: QUERY_KEYS.userLocation,
    queryFn: async () => (await locationApi.getMine()).data.data,
    enabled: isAuthenticated && showForm,
    staleTime: 60_000,
  });

  const profileGymLabel = useMemo(() => {
    const locationPath = activeGym?.locationSet
      ? activeGym.location?.label?.path
      : locationQuery.data?.isSet
        ? locationQuery.data.label?.path
        : undefined;
    const gymName = resolveHomeGymName(meQuery.data ?? user, activeGym, gyms);
    return buildProfileGymLabel(locationPath, gymName);
  }, [activeGym, gyms, locationQuery.data, meQuery.data, user]);

  useEffect(() => {
    return () => {
      for (const img of images) URL.revokeObjectURL(img.previewUrl);
    };
  }, [images]);

  const resetForm = () => {
    for (const img of images) URL.revokeObjectURL(img.previewUrl);
    setBrandMode('custom');
    setMachineMode('custom');
    setDescriptionMode('custom');
    setBrandName('');
    setMachineName('');
    setDescription('');
    setImages([]);
    setCommercialUseConsent(false);
    setGymChoiceMode('profile');
    setCustomGymName('');
    setShowForm(false);
  };

  const resolvedGymName = useMemo(() => {
    if (gymChoiceMode === 'unknown') return '';
    if (gymChoiceMode === 'custom') return truncateGymLabel(customGymName);
    return profileGymLabel;
  }, [customGymName, gymChoiceMode, profileGymLabel]);

  const gymChoiceValid = useMemo(() => {
    if (gymChoiceMode === 'unknown') return true;
    if (gymChoiceMode === 'custom') return Boolean(customGymName.trim());
    return Boolean(profileGymLabel);
  }, [customGymName, gymChoiceMode, profileGymLabel]);

  const textFieldsValid = useMemo(() => {
    const brandOk = brandMode === 'unknown' || Boolean(brandName.trim());
    const machineOk = machineMode === 'unknown' || Boolean(machineName.trim());
    const descriptionOk = descriptionMode === 'unknown' || Boolean(description.trim());
    return brandOk && machineOk && descriptionOk;
  }, [brandMode, brandName, machineMode, machineName, descriptionMode, description]);

  const canSubmit = useMemo(
    () =>
      Boolean(
        textFieldsValid && images.length > 0 && commercialUseConsent && gymChoiceValid
      ),
    [textFieldsValid, images.length, commercialUseConsent, gymChoiceValid]
  );

  const createMutation = useMutation({
    mutationFn: () =>
      machineRequestApi.create({
        brandName: resolveTextField(brandMode, brandName),
        machineName: resolveTextField(machineMode, machineName),
        description: resolveTextField(descriptionMode, description),
        commercialUseConsent: true,
        gymChoiceMode,
        gymName: gymChoiceMode === 'unknown' ? undefined : resolvedGymName,
        files: images.map((img) => img.file),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequestsRoot });
      const createdId = res.data.data.id;
      resetForm();
      showToast(t('requestSubmitSuccess'), 'success');
      navigate(ROUTES.MACHINE_REQUEST_DETAIL.replace(':requestId', createdId));
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && !error.response) {
        showToast(t('requestSubmitNetworkError'), 'error');
        return;
      }
      const code = getApiErrorCode(error);
      if (code === 'UNSUPPORTED_FILE_TYPE') {
        showToast(t('requestPhotoTypeError'), 'error');
        return;
      }
      if (code === 'FILE_TOO_LARGE') {
        showToast(t('requestPhotoSizeError'), 'error');
        return;
      }
      if (code === 'TOO_MANY_FILES') {
        showToast(t('requestPhotoMaxError', { max: MAX_REQUEST_IMAGES }), 'error');
        return;
      }
      if (code === 'IMAGES_REQUIRED') {
        showToast(t('requestPhotoRequired'), 'error');
        return;
      }
      if (code === 'CONSENT_REQUIRED') {
        showToast(t('requestConsentRequired'), 'error');
        return;
      }
      showToast(t('requestSubmitError'), 'error');
    },
  });

  const voteMutation = useMutation({
    mutationFn: (requestId: string) => machineRequestApi.toggleVote(requestId),
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previous =
        queryClient.getQueryData<PaginatedResponse<MachineRequest>>(listQueryKey);
      const target = previous?.items.find((item) => item.id === requestId);
      if (target?.isMine === true) {
        // Abort mutation (skips mutationFn) — own requests cannot be voted.
        throw new Error('OWN_REQUEST');
      }
      queryClient.setQueryData<PaginatedResponse<MachineRequest>>(listQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((item) => {
            if (item.id !== requestId) return item;
            if (item.isMine === true) return item;
            const voted = !item.votedByMe;
            const voteCount = Math.max(0, (item.voteCount ?? 0) + (voted ? 1 : -1));
            return { ...item, votedByMe: voted, voteCount };
          }),
        };
      });
      return { previous };
    },
    onSuccess: (res) => {
      const { voted, voteCount } = res.data.data;
      showToast(
        voted
          ? t('requestWantThisSuccess', { count: voteCount })
          : t('requestWantThisRemoved', { count: voteCount }),
        'success'
      );
    },
    onError: (error, _requestId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listQueryKey, context.previous);
      }
      const code = getApiErrorCode(error);
      if (code === 'OWN_REQUEST' || (error instanceof Error && error.message === 'OWN_REQUEST')) {
        showToast(t('requestWantThisOwnError'), 'error');
        return;
      }
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        showToast(t('loginRequired'), 'error');
        navigate(ROUTES.LOGIN);
        return;
      }
      showToast(t('requestWantThisError'), 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequestsRoot });
    },
  });

  const handleNew = () => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    setShowForm(true);
  };

  const handleWantThis = (requestId: string) => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    const target = data?.items.find((item) => item.id === requestId);
    if (target?.isMine === true) {
      showToast(t('requestWantThisOwnError'), 'error');
      return;
    }
    voteMutation.mutate(requestId);
  };

  const onPickFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;

    const selected = Array.from(fileList);
    const remainingSlots = MAX_REQUEST_IMAGES - images.length;
    let skippedType = 0;
    let skippedSize = 0;
    let skippedMax = 0;
    const accepted: LocalImage[] = [];

    for (const file of selected) {
      if (accepted.length >= remainingSlots) {
        skippedMax += 1;
        continue;
      }
      if (!isAllowedRequestImage(file)) {
        skippedType += 1;
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        skippedSize += 1;
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) {
      setImages((prev) => [...prev, ...accepted].slice(0, MAX_REQUEST_IMAGES));
      showToast(t('requestPhotoAttachSuccess', { count: accepted.length }), 'success');
    }

    if (skippedType > 0) {
      showToast(t('requestPhotoTypeError'), 'error');
    } else if (skippedSize > 0) {
      showToast(t('requestPhotoSizeError'), 'error');
    } else if (skippedMax > 0) {
      showToast(t('requestPhotoMaxError', { max: MAX_REQUEST_IMAGES }), 'error');
    } else if (accepted.length === 0) {
      showToast(t('requestPhotoAttachFailed'), 'error');
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || createMutation.isPending) {
      if (!commercialUseConsent) showToast(t('requestConsentRequired'), 'error');
      else if (!images.length) showToast(t('requestPhotoRequired'), 'error');
      else if (!gymChoiceValid) {
        showToast(
          gymChoiceMode === 'profile' ? t('requestGymProfileEmpty') : t('requestGymRequired'),
          'error'
        );
      }
      return;
    }
    createMutation.mutate();
  };

  const renderTextChoice = (params: {
    legend: string;
    name: string;
    mode: MachineRequestTextChoiceMode;
    onModeChange: (mode: MachineRequestTextChoiceMode) => void;
    inputId: string;
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
    multiline?: boolean;
  }) => (
    <fieldset className="form-row community-board-page__choice">
      <legend>{params.legend}</legend>
      <div className="community-board-page__choice-radios">
        <label className="checkbox-label">
          <input
            type="radio"
            name={params.name}
            checked={params.mode === 'custom'}
            onChange={() => params.onModeChange('custom')}
          />
          <span>{t('requestFieldChoiceCustom')}</span>
        </label>
        <label className="checkbox-label">
          <input
            type="radio"
            name={params.name}
            checked={params.mode === 'unknown'}
            onChange={() => params.onModeChange('unknown')}
          />
          <span>{t('requestFieldChoiceUnknown')}</span>
        </label>
      </div>
      {params.mode === 'custom' &&
        (params.multiline ? (
          <textarea
            id={params.inputId}
            className="input"
            value={params.value}
            onChange={(e) => params.onChange(e.target.value)}
            required
            maxLength={params.maxLength}
            rows={4}
          />
        ) : (
          <input
            id={params.inputId}
            className="input"
            value={params.value}
            onChange={(e) => params.onChange(e.target.value)}
            required
            maxLength={params.maxLength}
          />
        ))}
    </fieldset>
  );

  return (
    <div className="community-board-page">
      <PageShell
        title={t('machineRequests')}
        subtitle={t('machineRequestsSubtitle')}
        action={
          <div className="page-shell__header-action">
            <button type="button" className="btn btn--primary" onClick={handleNew}>
              {t('newRequest')}
            </button>
          </div>
        }
      >
        {showForm && (
          <form className="card community-board-page__form" onSubmit={handleSubmit}>
            {renderTextChoice({
              legend: t('brandName'),
              name: 'req-brand-choice',
              mode: brandMode,
              onModeChange: setBrandMode,
              inputId: 'req-brand',
              value: brandName,
              onChange: setBrandName,
              maxLength: 100,
            })}
            {renderTextChoice({
              legend: t('machineName'),
              name: 'req-machine-choice',
              mode: machineMode,
              onModeChange: setMachineMode,
              inputId: 'req-machine',
              value: machineName,
              onChange: setMachineName,
              maxLength: 200,
            })}
            {renderTextChoice({
              legend: t('description'),
              name: 'req-desc-choice',
              mode: descriptionMode,
              onModeChange: setDescriptionMode,
              inputId: 'req-desc',
              value: description,
              onChange: setDescription,
              maxLength: 2000,
              multiline: true,
            })}

            <fieldset className="form-row community-board-page__gym-choice">
              <legend>{t('requestGymLabel')}</legend>
              <label className="checkbox-label">
                <input
                  type="radio"
                  name="req-gym-choice"
                  checked={gymChoiceMode === 'profile'}
                  onChange={() => setGymChoiceMode('profile')}
                />
                <span>
                  {t('requestGymChoiceProfile')}
                  {profileGymLabel ? ` — ${profileGymLabel}` : ''}
                </span>
              </label>
              {!profileGymLabel && gymChoiceMode === 'profile' && (
                <p className="community-board-page__hint">{t('requestGymProfileEmpty')}</p>
              )}
              <div className="community-board-page__choice-radios">
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="req-gym-choice"
                    checked={gymChoiceMode === 'custom'}
                    onChange={() => setGymChoiceMode('custom')}
                  />
                  <span>{t('requestGymChoiceCustom')}</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="req-gym-choice"
                    checked={gymChoiceMode === 'unknown'}
                    onChange={() => setGymChoiceMode('unknown')}
                  />
                  <span>{t('requestGymChoiceUnknown')}</span>
                </label>
              </div>
              {gymChoiceMode === 'custom' && (
                <input
                  id="req-gym-custom"
                  className="input"
                  value={customGymName}
                  onChange={(e) => setCustomGymName(e.target.value.slice(0, MAX_GYM_NAME))}
                  placeholder={t('requestGymCustomPlaceholder')}
                  maxLength={MAX_GYM_NAME}
                  required
                />
              )}
            </fieldset>

            <div className="form-row community-board-page__photo-field">
              <span className="community-board-page__photo-label" id="req-photos-label">
                {t('requestPhoto')}
              </span>
              <input
                ref={fileInputRef}
                id="req-photos"
                className="community-board-page__file-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                aria-labelledby="req-photos-label"
                onChange={(e) => {
                  onPickFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                className="btn btn--secondary community-board-page__photo-pick"
                disabled={images.length >= MAX_REQUEST_IMAGES || createMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('requestPhotoPick')}
              </button>
              <p className="community-board-page__hint">{t('requestPhotoHint')}</p>
              <p
                className={`community-board-page__photo-status${
                  images.length > 0 ? ' community-board-page__photo-status--ok' : ''
                }`}
                aria-live="polite"
              >
                {images.length > 0
                  ? t('requestPhotoAttachedCount', {
                      count: images.length,
                      max: MAX_REQUEST_IMAGES,
                    })
                  : t('requestPhotoNone')}
              </p>
              {images.length > 0 && (
                <div className="community-board-page__previews" aria-label={t('requestPhoto')}>
                  {images.map((img) => (
                    <div key={img.id} className="community-board-page__preview">
                      <img src={img.previewUrl} alt="" />
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => removeImage(img.id)}
                      >
                        {t('requestPhotoRemove')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="community-board-page__consent">
              <p className="community-board-page__consent-text">{t('requestCommercialConsentText')}</p>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={commercialUseConsent}
                  onChange={(e) => setCommercialUseConsent(e.target.checked)}
                  required
                />
                <span>{t('requestCommercialConsentLabel')}</span>
              </label>
            </div>

            <div className="community-board-page__form-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!canSubmit || createMutation.isPending}
              >
                {t('submit')}
              </button>
              <button type="button" className="btn btn--secondary" onClick={resetForm}>
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        <p className="community-board-page__hint community-board-page__public-hint">
          {t('requestBoardPublicHint')}
        </p>

        {listLoading ? (
          <BoardIndexSkeleton rows={8} />
        ) : data?.items.length ? (
          <BoardIndexPanel
            countLabel={t('requestCount', { count: data.meta?.total ?? data.items.length })}
          >
            {data.items.map((req) => (
              <BoardRequestRow
                key={req.id}
                request={req}
                onWantThis={handleWantThis}
                isVoting={voteMutation.isPending && voteMutation.variables === req.id}
              />
            ))}
          </BoardIndexPanel>
        ) : (
          <p className="community-board-page__empty">{t('noRequests')}</p>
        )}

        <Link to={ROUTES.MY_PAGE} className="btn btn--secondary btn--block community-board-page__back">
          ← {tCommon('nav.myPage')}
        </Link>
      </PageShell>
    </div>
  );
}
