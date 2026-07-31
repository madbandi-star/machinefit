import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  MACHINE_REQUEST_UNKNOWN_VALUE,
  type MachineRequestGymChoiceMode,
  type MachineRequestTextChoiceMode,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BoardIndexPanel } from '@/components/community/BoardIndexPanel';
import { BoardIndexSkeleton } from '@/components/community/BoardIndexSkeleton';
import { BoardRequestRow } from '@/components/community/BoardRequestRow';
import { locationApi, machineRequestApi, userApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { resolveHomeGymName } from '@/utils/resolveHomeGymName';
import '@/styles/components.css';
import '@/styles/community.css';

const MAX_REQUEST_IMAGES = 5;
const MAX_GYM_NAME = 50;

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
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

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.machineRequests,
    queryFn: async () => {
      const res = await machineRequestApi.list({ limit: 30 });
      return res.data.data;
    },
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequests });
      resetForm();
      showToast(t('createSuccess'), 'success');
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const handleNew = () => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    setShowForm(true);
  };

  const onPickFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setImages((prev) => {
      const next = [...prev];
      for (const file of Array.from(fileList)) {
        if (next.length >= MAX_REQUEST_IMAGES) break;
        if (!file.type.startsWith('image/')) continue;
        next.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      return next;
    });
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
    <fieldset className="form-row community-board-page__gym-choice">
      <legend>{params.legend}</legend>
      <label className="checkbox-label">
        <input
          type="radio"
          name={params.name}
          checked={params.mode === 'custom'}
          onChange={() => params.onModeChange('custom')}
        />
        <span>{t('requestFieldChoiceCustom')}</span>
      </label>
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
      <label className="checkbox-label">
        <input
          type="radio"
          name={params.name}
          checked={params.mode === 'unknown'}
          onChange={() => params.onModeChange('unknown')}
        />
        <span>{t('requestFieldChoiceUnknown')}</span>
      </label>
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
              <label className="checkbox-label">
                <input
                  type="radio"
                  name="req-gym-choice"
                  checked={gymChoiceMode === 'custom'}
                  onChange={() => setGymChoiceMode('custom')}
                />
                <span>{t('requestGymChoiceCustom')}</span>
              </label>
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
              <label className="checkbox-label">
                <input
                  type="radio"
                  name="req-gym-choice"
                  checked={gymChoiceMode === 'unknown'}
                  onChange={() => setGymChoiceMode('unknown')}
                />
                <span>{t('requestGymChoiceUnknown')}</span>
              </label>
            </fieldset>

            <div className="form-row">
              <label htmlFor="req-photos">{t('requestPhoto')}</label>
              <input
                id="req-photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  onPickFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <p className="community-board-page__hint">{t('requestPhotoHint')}</p>
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

        {isLoading ? (
          <BoardIndexSkeleton rows={8} />
        ) : data?.items.length ? (
          <BoardIndexPanel countLabel={t('requestCount', { count: data.items.length })}>
            {data.items.map((req) => (
              <BoardRequestRow key={req.id} request={req} />
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
