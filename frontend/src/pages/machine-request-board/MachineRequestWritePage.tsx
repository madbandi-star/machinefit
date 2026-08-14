import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X } from 'lucide-react';
import {
  MACHINE_REQUEST_UNKNOWN_VALUE,
  type MachineRequestGymChoiceMode,
  type MachineRequestSimilarGroup,
  type MachineRequestTextChoiceMode,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { locationApi, machineRequestApi, userApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { resolveHomeGymName } from '@/utils/resolveHomeGymName';
import '@/styles/components.css';
import '@/styles/community.css';
import '@/styles/photo-board.css';

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

function resolveTextField(mode: MachineRequestTextChoiceMode, value: string): string {
  if (mode === 'unknown') return MACHINE_REQUEST_UNKNOWN_VALUE;
  return value.trim();
}

function modeFromStored(value: string | undefined): MachineRequestTextChoiceMode {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed === MACHINE_REQUEST_UNKNOWN_VALUE) return 'unknown';
  return 'custom';
}

function valueFromStored(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed === MACHINE_REQUEST_UNKNOWN_VALUE) return '';
  return trimmed;
}

export function MachineRequestWritePage() {
  const { t } = useTranslation('community');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit') || '';
  const isEdit = Boolean(editId);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);
  const { activeGym, gyms } = useActiveGym();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [brandMode, setBrandMode] = useState<MachineRequestTextChoiceMode>('custom');
  const [machineMode, setMachineMode] = useState<MachineRequestTextChoiceMode>('custom');
  const [descriptionMode, setDescriptionMode] =
    useState<MachineRequestTextChoiceMode>('custom');
  const [brandName, setBrandName] = useState('');
  const [machineName, setMachineName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [commercialUseConsent, setCommercialUseConsent] = useState(false);
  const [gymChoiceMode, setGymChoiceMode] = useState<MachineRequestGymChoiceMode>('profile');
  const [customGymName, setCustomGymName] = useState('');
  const [similarQuery, setSimilarQuery] = useState<{ brandName: string; machineName: string } | null>(
    null
  );

  useEffect(() => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, navigate, showToast, t]);

  const editQuery = useQuery({
    queryKey: QUERY_KEYS.machineRequestDetail(editId),
    queryFn: async () => (await machineRequestApi.get(editId)).data.data,
    enabled: isEdit && isAuthenticated,
  });

  useEffect(() => {
    const request = editQuery.data?.request;
    if (!request) return;
    if (user && request.userId !== user.id && !request.isMine) {
      showToast(t('errorGeneric'), 'error');
      navigate(ROUTES.MACHINE_REQUESTS);
      return;
    }
    setBrandMode(modeFromStored(request.brandName));
    setMachineMode(modeFromStored(request.machineName));
    setDescriptionMode(modeFromStored(request.description));
    setBrandName(valueFromStored(request.brandName));
    setMachineName(valueFromStored(request.machineName));
    setDescription(valueFromStored(request.description));
    setGymChoiceMode(request.gymChoiceMode ?? 'profile');
    setCustomGymName(
      request.gymChoiceMode === 'custom' ? (request.gymName?.trim() ?? '') : ''
    );
    setCommercialUseConsent(Boolean(request.commercialUseConsent));
  }, [editQuery.data, navigate, showToast, t, user]);

  const meQuery = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: async () => (await userApi.getMe()).data.data,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const locationQuery = useQuery({
    queryKey: QUERY_KEYS.userLocation,
    queryFn: async () => (await locationApi.getMine()).data.data,
    enabled: isAuthenticated,
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

  useEffect(() => {
    if (isEdit) {
      setSimilarQuery(null);
      return;
    }
    const brand = brandMode === 'custom' ? brandName.trim() : '';
    const machine = machineMode === 'custom' ? machineName.trim() : '';
    if (!brand && !machine) {
      setSimilarQuery(null);
      return;
    }
    const handle = window.setTimeout(() => {
      setSimilarQuery({ brandName: brand, machineName: machine });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [brandMode, brandName, machineMode, machineName, isEdit]);

  const similarQueryResult = useQuery({
    queryKey: ['machine-requests', 'similar', similarQuery?.brandName, similarQuery?.machineName],
    queryFn: async () =>
      (
        await machineRequestApi.similar({
          brandName: similarQuery?.brandName || undefined,
          machineName: similarQuery?.machineName || undefined,
        })
      ).data.data,
    enabled: Boolean(similarQuery && !isEdit),
    staleTime: 10_000,
  });

  const similarHit: MachineRequestSimilarGroup | undefined = similarQueryResult.data?.[0];

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

  const canSubmit = useMemo(() => {
    if (!textFieldsValid || !gymChoiceValid) return false;
    if (isEdit) return true;
    return Boolean(images.length > 0 && commercialUseConsent);
  }, [textFieldsValid, images.length, commercialUseConsent, gymChoiceValid, isEdit]);

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
      queryClient.invalidateQueries({ queryKey: ['machine-requests'] });
      showToast(t('createSuccess'), 'success');
      const id = res.data.data.id;
      navigate(ROUTES.MACHINE_REQUESTS_DETAIL.replace(':requestId', id));
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      machineRequestApi.update(editId, {
        brandName: resolveTextField(brandMode, brandName),
        machineName: resolveTextField(machineMode, machineName),
        description: resolveTextField(descriptionMode, description),
        gymChoiceMode,
        gymName: gymChoiceMode === 'unknown' ? null : resolvedGymName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machine-requests'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequestDetail(editId) });
      showToast(t('createSuccess'), 'success');
      navigate(ROUTES.MACHINE_REQUESTS_DETAIL.replace(':requestId', editId));
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const saving = createMutation.isPending || updateMutation.isPending;

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
    if (!canSubmit || saving) {
      if (!isEdit && !commercialUseConsent) showToast(t('requestConsentRequired'), 'error');
      else if (!isEdit && !images.length) showToast(t('requestPhotoRequired'), 'error');
      else if (!gymChoiceValid) {
        showToast(
          gymChoiceMode === 'profile' ? t('requestGymProfileEmpty') : t('requestGymRequired'),
          'error'
        );
      }
      return;
    }
    if (isEdit) updateMutation.mutate();
    else createMutation.mutate();
  };

  const photoReady = isEdit || images.length > 0;
  const brandReady = brandMode === 'unknown' || Boolean(brandName.trim());
  const machineReady = machineMode === 'unknown' || Boolean(machineName.trim());
  const descriptionReady = descriptionMode === 'unknown' || Boolean(description.trim());
  const infoReady = brandReady && machineReady && descriptionReady;
  const gymReady = gymChoiceValid;
  const consentReady = isEdit || commercialUseConsent;

  const checklist = isEdit
    ? [
        { id: 'info', label: t('requestStepInfo'), done: infoReady },
        { id: 'gym', label: t('requestStepGym'), done: gymReady },
      ]
    : [
        { id: 'photo', label: t('requestStepPhoto'), done: photoReady },
        { id: 'info', label: t('requestStepInfo'), done: infoReady },
        { id: 'gym', label: t('requestStepGym'), done: gymReady },
        { id: 'consent', label: t('requestStepConsent'), done: consentReady },
      ];
  const checklistDone = checklist.filter((item) => item.done).length;

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
    placeholder?: string;
  }) => (
    <fieldset className="board-write__choice">
      <div className="board-write__choice-head">
        <legend className="board-write__choice-legend">{params.legend}</legend>
        <div className="board-write__segment" role="radiogroup" aria-label={params.legend}>
          <label className={`board-write__segment-btn${params.mode === 'custom' ? ' is-active' : ''}`}>
            <input
              type="radio"
              name={params.name}
              checked={params.mode === 'custom'}
              onChange={() => params.onModeChange('custom')}
            />
            <span>{t('requestFieldChoiceCustom')}</span>
          </label>
          <label className={`board-write__segment-btn${params.mode === 'unknown' ? ' is-active' : ''}`}>
            <input
              type="radio"
              name={params.name}
              checked={params.mode === 'unknown'}
              onChange={() => params.onModeChange('unknown')}
            />
            <span>{t('requestFieldChoiceUnknown')}</span>
          </label>
        </div>
      </div>
      {params.mode === 'custom' ? (
        params.multiline ? (
          <textarea
            id={params.inputId}
            className="input board-write__textarea"
            value={params.value}
            onChange={(e) => params.onChange(e.target.value)}
            required
            maxLength={params.maxLength}
            rows={3}
            placeholder={params.placeholder}
          />
        ) : (
          <input
            id={params.inputId}
            className="input"
            value={params.value}
            onChange={(e) => params.onChange(e.target.value)}
            required
            maxLength={params.maxLength}
            placeholder={params.placeholder}
          />
        )
      ) : (
        <p className="board-write__unknown-note">{t('requestFieldUnknownLabel')}</p>
      )}
    </fieldset>
  );

  if (isEdit && editQuery.isLoading) {
    return (
      <PageShell title={t('requestEdit')}>
        <Skeleton count={4} height={72} />
      </PageShell>
    );
  }

  return (
    <div className="community-board-page board-write-page board-write-page--request">
      <PageShell
        title={isEdit ? t('requestEdit') : t('newRequest')}
        subtitle={t('requestWriteHint')}
      >
        <div className="board-write-checklist" aria-label={t('requestChecklistLabel')}>
          <div className="board-write-checklist__head">
            <p className="board-write-checklist__title">{t('requestChecklistLabel')}</p>
            <span className="board-write-checklist__progress">
              {checklistDone}/{checklist.length}
            </span>
          </div>
          <ul className="board-write-checklist__list">
            {checklist.map((item) => (
              <li
                key={item.id}
                className={[
                  'board-write-checklist__item',
                  item.done ? 'is-done' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="board-write-checklist__mark" aria-hidden>
                  {item.done ? '✓' : '·'}
                </span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {!isEdit && similarHit ? (
          <aside className="board-write__similar" role="status">
            <p className="board-write__similar-title">{t('requestSimilarTitle')}</p>
            <Link
              to={ROUTES.MACHINE_REQUESTS_DETAIL.replace(
                ':requestId',
                similarHit.sampleRequestId
              )}
              className="board-write__similar-link"
            >
              {t('requestWantThisInstead')}
              {similarHit.voteCount > 0
                ? ` · ${t('requestWantThisCount', { count: similarHit.voteCount })}`
                : ''}
            </Link>
          </aside>
        ) : null}

        <form className="board-write board-write--request" onSubmit={handleSubmit}>
          {!isEdit ? (
            <section
              className={[
                'board-write__section',
                photoReady ? 'is-ready' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-labelledby="req-step-photo"
            >
              <header className="board-write__section-head">
                <span className="board-write__step">1</span>
                <div>
                  <h3 id="req-step-photo" className="board-write__section-title">
                    {t('requestStepPhoto')}
                  </h3>
                  <p className="board-write__section-hint">{t('requestPhotoHint')}</p>
                </div>
                <span className="board-write__section-status">
                  {t('requestPhotoAttachedCount', {
                    count: images.length,
                    max: MAX_REQUEST_IMAGES,
                  })}
                </span>
              </header>

              <div className="board-write__media">
                <input
                  ref={fileInputRef}
                  id={fileInputId}
                  className="photo-write__file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    onPickFiles(e.target.files);
                    e.currentTarget.value = '';
                  }}
                />
                <button
                  type="button"
                  className={`photo-write__dropzone${dragOver ? ' is-dragover' : ''}${
                    images.length ? ' has-images' : ''
                  }`}
                  disabled={images.length >= MAX_REQUEST_IMAGES || saving}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (images.length >= MAX_REQUEST_IMAGES) return;
                    setDragOver(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (images.length >= MAX_REQUEST_IMAGES) return;
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (images.length >= MAX_REQUEST_IMAGES) return;
                    onPickFiles(e.dataTransfer.files);
                  }}
                >
                  <span className="photo-write__dropzone-icon" aria-hidden>
                    <ImagePlus size={28} strokeWidth={1.75} />
                  </span>
                  <span className="photo-write__dropzone-title">{t('requestPhotoPick')}</span>
                  <span className="photo-write__dropzone-hint">{t('requestDropHint')}</span>
                </button>

                {images.length ? (
                  <ul className="photo-write__previews" aria-label={t('requestPhoto')}>
                    {images.map((img, index) => (
                      <li key={img.id} className="photo-write__preview">
                        <img src={img.previewUrl} alt="" />
                        <span className="photo-write__preview-index" aria-hidden>
                          {index + 1}
                        </span>
                        <div className="photo-write__preview-actions">
                          <button
                            type="button"
                            className="photo-write__preview-btn photo-write__preview-btn--danger"
                            onClick={() => removeImage(img.id)}
                            aria-label={t('requestPhotoRemove')}
                          >
                            <X size={15} strokeWidth={2.5} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ) : null}

          <section
            className={[
              'board-write__section',
              infoReady ? 'is-ready' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-labelledby="req-step-info"
          >
            <header className="board-write__section-head">
              <span className="board-write__step">{isEdit ? '1' : '2'}</span>
              <div>
                <h3 id="req-step-info" className="board-write__section-title">
                  {t('requestStepInfo')}
                </h3>
                <p className="board-write__section-hint">{t('requestStepInfoHint')}</p>
              </div>
            </header>
            <div className="board-write__fields">
              {renderTextChoice({
                legend: t('brandName'),
                name: 'req-brand-choice',
                mode: brandMode,
                onModeChange: setBrandMode,
                inputId: 'req-brand',
                value: brandName,
                onChange: setBrandName,
                maxLength: 100,
                placeholder: t('brandName'),
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
                placeholder: t('machineName'),
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
                placeholder: t('description'),
              })}
            </div>
          </section>

          <section
            className={[
              'board-write__section',
              gymReady ? 'is-ready' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-labelledby="req-step-gym"
          >
            <header className="board-write__section-head">
              <span className="board-write__step">{isEdit ? '2' : '3'}</span>
              <div>
                <h3 id="req-step-gym" className="board-write__section-title">
                  {t('requestStepGym')}
                </h3>
                <p className="board-write__section-hint">{t('requestStepGymHint')}</p>
              </div>
            </header>

            <fieldset className="board-write__choice">
              <legend className="board-write__choice-legend">{t('requestGymLabel')}</legend>
              <div
                className="board-write__segment board-write__segment--wrap"
                role="radiogroup"
                aria-label={t('requestGymLabel')}
              >
                <label
                  className={`board-write__segment-btn${gymChoiceMode === 'profile' ? ' is-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="req-gym-choice"
                    checked={gymChoiceMode === 'profile'}
                    onChange={() => setGymChoiceMode('profile')}
                  />
                  <span>{t('requestGymChoiceProfileShort')}</span>
                </label>
                <label
                  className={`board-write__segment-btn${gymChoiceMode === 'custom' ? ' is-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="req-gym-choice"
                    checked={gymChoiceMode === 'custom'}
                    onChange={() => setGymChoiceMode('custom')}
                  />
                  <span>{t('requestGymChoiceCustom')}</span>
                </label>
                <label
                  className={`board-write__segment-btn${gymChoiceMode === 'unknown' ? ' is-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="req-gym-choice"
                    checked={gymChoiceMode === 'unknown'}
                    onChange={() => setGymChoiceMode('unknown')}
                  />
                  <span>{t('requestGymChoiceUnknown')}</span>
                </label>
              </div>

              {gymChoiceMode === 'profile' ? (
                profileGymLabel ? (
                  <p className="board-write__profile-gym">{profileGymLabel}</p>
                ) : (
                  <p className="board-write__hint board-write__hint--warn">
                    {t('requestGymProfileEmpty')}
                  </p>
                )
              ) : null}

              {gymChoiceMode === 'custom' ? (
                <input
                  id="req-gym-custom"
                  className="input"
                  value={customGymName}
                  onChange={(e) => setCustomGymName(e.target.value.slice(0, MAX_GYM_NAME))}
                  placeholder={t('requestGymCustomPlaceholder')}
                  maxLength={MAX_GYM_NAME}
                  required
                />
              ) : null}

              {gymChoiceMode === 'unknown' ? (
                <p className="board-write__unknown-note">{t('requestGymUnknownLabel')}</p>
              ) : null}
            </fieldset>
          </section>

          {!isEdit ? (
            <section
              className={[
                'board-write__section',
                consentReady ? 'is-ready' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-labelledby="req-step-consent"
            >
              <header className="board-write__section-head">
                <span className="board-write__step">4</span>
                <div>
                  <h3 id="req-step-consent" className="board-write__section-title">
                    {t('requestStepConsent')}
                  </h3>
                </div>
              </header>
              <div className="board-write__consent">
                <p className="board-write__consent-text">{t('requestCommercialConsentText')}</p>
                <label className="board-write__consent-check">
                  <input
                    type="checkbox"
                    checked={commercialUseConsent}
                    onChange={(e) => setCommercialUseConsent(e.target.checked)}
                    required
                  />
                  <span>{t('requestCommercialConsentLabel')}</span>
                </label>
              </div>
            </section>
          ) : null}

          <div className="board-write__actions">
            <button
              type="submit"
              className="btn btn--primary board-write__submit"
              disabled={!canSubmit || saving}
            >
              {saving ? '…' : isEdit ? t('requestSaveEdit') : t('submit')}
            </button>
            <Link
              to={
                isEdit
                  ? ROUTES.MACHINE_REQUESTS_DETAIL.replace(':requestId', editId)
                  : ROUTES.MACHINE_REQUESTS
              }
              className="btn btn--secondary"
            >
              {t('cancel')}
            </Link>
          </div>
        </form>
      </PageShell>
    </div>
  );
}
