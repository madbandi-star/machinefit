import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X } from 'lucide-react';
import { isAllGymsId, isRareOrHigher } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { gymApi, machineApi } from '@/api';
import { machineShowcaseApi } from '@/api/machine-showcase.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/components.css';
import '@/styles/machine-showcase.css';

const MAX_TAGS = 8;
const MAX_CAPTION = 500;

function normalizeTag(raw: string): string | null {
  const cleaned = raw
    .replace(/^#+/, '')
    .trim()
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .slice(0, 40);
  return cleaned || null;
}

export function MachineShowcaseWritePage() {
  const { t, i18n } = useTranslation('community');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { gyms, activeGymId } = useActiveGym();
  const [searchParams] = useSearchParams();
  const presetMachineCode = searchParams.get('machineCode')?.trim() ?? '';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userGymId, setUserGymId] = useState(activeGymId ?? '');
  const [gymId, setGymId] = useState('');
  const [gymQ, setGymQ] = useState('');
  const [gymSearchOpen, setGymSearchOpen] = useState(false);
  const [pickedGymName, setPickedGymName] = useState('');
  const [machineQ, setMachineQ] = useState('');
  const [machineCode, setMachineCode] = useState(presetMachineCode);
  const [machineSearchOpen, setMachineSearchOpen] = useState(!presetMachineCode);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const myGyms = gyms.filter((g) => !isAllGymsId(g.id));
  const photoReady = files.length > 0;
  const gymReady = Boolean(userGymId || gymId);
  const machineReady = Boolean(machineCode);
  const doneCount = Number(photoReady) + Number(gymReady) + Number(machineReady);

  useEffect(() => {
    if (userGymId || !activeGymId || isAllGymsId(activeGymId)) return;
    setUserGymId(activeGymId);
  }, [activeGymId, userGymId]);

  const machinesQuery = useQuery({
    queryKey: [...QUERY_KEYS.machines, 'showcase-picker', machineQ] as const,
    queryFn: async () => {
      const res = await machineApi.list({ q: machineQ, limit: 30 });
      return res.data.data.items;
    },
    enabled: machineSearchOpen && machineQ.trim().length >= 1,
  });

  const directoryQuery = useQuery({
    queryKey: [...QUERY_KEYS.gymDirectory, gymQ] as const,
    queryFn: async () => (await gymApi.searchDirectory({ q: gymQ, limit: 12 })).data.data.items,
    enabled: gymSearchOpen && gymQ.trim().length >= 2,
  });

  const presetMachineQuery = useQuery({
    queryKey: QUERY_KEYS.machine(presetMachineCode),
    queryFn: async () => (await machineApi.getByCode(presetMachineCode)).data.data,
    enabled: Boolean(presetMachineCode),
    staleTime: 5 * 60_000,
  });

  const selectedMachine = useMemo(
    () =>
      machinesQuery.data?.find((m) => m.code === machineCode) ??
      (presetMachineQuery.data?.code === machineCode ? presetMachineQuery.data : undefined),
    [machinesQuery.data, machineCode, presetMachineQuery.data]
  );

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const machineLabel = selectedMachine
    ? getLocalizedName(selectedMachine.name, i18n.language, selectedMachine.code)
    : machineCode;
  const machineBrand = selectedMachine?.brandCode ?? '';

  const mutation = useMutation({
    mutationFn: () =>
      machineShowcaseApi.create({
        machineCode,
        caption,
        tags,
        userGymId: userGymId || undefined,
        gymId: gymId || undefined,
        files,
      }),
    onSuccess: async (res) => {
      const data = res.data.data;
      await queryClient.invalidateQueries({ queryKey: ['machine-showcase'] });
      showToast(t('showcase.createSuccess'), 'success');
      if (data.discovery.isNew && isRareOrHigher(data.discovery.grade)) {
        showToast(
          t('showcase.rareFound', {
            grade: data.discovery.grade,
            count: data.discovery.gymHoldingCount,
          }),
          'success'
        );
      }
      navigate(ROUTES.MACHINE_SHOWCASE_DETAIL.replace(':postId', data.post.id));
    },
    onError: (error) => {
      showToast(getApiErrorMessage(error, t('errorGeneric')), 'error');
    },
  });

  const canSubmit = gymReady && machineReady && photoReady && !mutation.isPending;

  const showMissing = () => {
    if (!photoReady) showToast(t('showcase.writeNeedPhoto'), 'error');
    else if (!gymReady) showToast(t('showcase.writeNeedGym'), 'error');
    else if (!machineReady) showToast(t('showcase.writeNeedMachine'), 'error');
  };

  const addTag = (raw: string) => {
    const next = normalizeTag(raw);
    if (!next) return;
    setTags((prev) => {
      if (prev.length >= MAX_TAGS || prev.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
        return prev;
      }
      return [...prev, next];
    });
    setTagDraft('');
  };

  const commitTagDraft = () => {
    if (tagDraft.trim()) addTag(tagDraft);
  };

  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 6));
  };

  return (
    <div className="showcase-page showcase-page--write">
      <PageShell>
        <nav className="showcase-write__nav">
          <Link to={ROUTES.MACHINE_SHOWCASE} className="showcase-detail__back">
            {t('showcase.backList')}
          </Link>
          <h1 className="showcase-write__title">{t('showcase.writeTitle')}</h1>
        </nav>

        <ul className="showcase-write__checks" aria-label={t('showcase.writeHint')}>
          {[
            { done: photoReady, label: t('showcase.stepPhoto') },
            { done: gymReady, label: t('showcase.stepGym') },
            { done: machineReady, label: t('showcase.stepMachine') },
          ].map((item) => (
            <li key={item.label} className={item.done ? 'is-done' : ''}>
              <span aria-hidden>{item.done ? '✓' : '·'}</span>
              {item.label}
            </li>
          ))}
          <li className="showcase-write__checks-count">
            {t('showcase.writeReady', { done: doneCount })}
          </li>
        </ul>

        <form
          className="showcase-write"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) {
              showMissing();
              return;
            }
            mutation.mutate();
          }}
        >
          <section className={`showcase-write__card${photoReady ? ' is-ready' : ''}`}>
            <header className="showcase-write__card-head">
              <span className="showcase-write__step">1</span>
              <div>
                <h2>{t('showcase.stepPhoto')}</h2>
                <p>{t('showcase.photoHint')}</p>
              </div>
              <span className="showcase-write__count">
                {t('showcase.photoCount', { count: files.length })}
              </span>
            </header>
            <input
              ref={fileInputRef}
              className="showcase-write__file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                addFiles(e.target.files);
                e.currentTarget.value = '';
              }}
            />
            {previewUrls.length === 0 ? (
              <button
                type="button"
                className="showcase-write__drop"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={28} strokeWidth={2} aria-hidden />
                <strong>{t('showcase.photoAdd')}</strong>
                <span>{t('showcase.photoHint')}</span>
              </button>
            ) : (
              <div className="showcase-write__gallery">
                <div className="showcase-write__hero">
                  <img src={previewUrls[0]} alt="" />
                  <span className="showcase-write__cover">{t('showcase.photoCover')}</span>
                  <button
                    type="button"
                    className="showcase-write__remove"
                    aria-label={t('showcase.removePhoto')}
                    onClick={() => setFiles((prev) => prev.slice(1))}
                  >
                    <X size={16} strokeWidth={2.4} aria-hidden />
                  </button>
                </div>
                <div className="showcase-write__thumbs">
                  {previewUrls.slice(1).map((url, idx) => (
                    <div key={`${url}-${idx}`} className="showcase-write__thumb">
                      <img src={url} alt="" />
                      <button
                        type="button"
                        className="showcase-write__remove"
                        aria-label={t('showcase.removePhoto')}
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, i) => i !== idx + 1))
                        }
                      >
                        <X size={14} strokeWidth={2.4} aria-hidden />
                      </button>
                    </div>
                  ))}
                  {files.length < 6 ? (
                    <button
                      type="button"
                      className="showcase-write__add"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus size={18} strokeWidth={2.2} aria-hidden />
                      {files.length}/6
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </section>

          <section className={`showcase-write__card${gymReady ? ' is-ready' : ''}`}>
            <header className="showcase-write__card-head">
              <span className="showcase-write__step">2</span>
              <div>
                <h2>{t('showcase.stepGym')}</h2>
                <p>{t('showcase.selectGym')}</p>
              </div>
            </header>
            {myGyms.length > 0 ? (
              <div className="showcase-write__choices">
                {myGyms.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={userGymId === g.id ? 'is-on' : ''}
                    onClick={() => {
                      setUserGymId(g.id);
                      setGymId('');
                      setPickedGymName('');
                      setGymSearchOpen(false);
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            ) : (
              <Link className="btn btn--secondary btn--block" to={ROUTES.MY_GYMS}>
                {t('showcase.registerGym')}
              </Link>
            )}
            {gymId && pickedGymName && !userGymId ? (
              <p className="showcase-write__picked">{pickedGymName}</p>
            ) : null}
            <button
              type="button"
              className="showcase-write__more"
              onClick={() => setGymSearchOpen((open) => !open)}
            >
              {t('showcase.otherGym')}
            </button>
            {gymSearchOpen ? (
              <div className="showcase-write__search">
                <input
                  className="input"
                  value={gymQ}
                  onChange={(e) => setGymQ(e.target.value)}
                  placeholder={t('showcase.searchGym')}
                />
                {directoryQuery.data?.length ? (
                  <div className="showcase-write__results">
                    {directoryQuery.data.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className={gymId === g.id ? 'is-on' : ''}
                        onClick={() => {
                          setGymId(g.id);
                          setUserGymId('');
                          setPickedGymName(g.name);
                          setGymSearchOpen(false);
                        }}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className={`showcase-write__card${machineReady ? ' is-ready' : ''}`}>
            <header className="showcase-write__card-head">
              <span className="showcase-write__step">3</span>
              <div>
                <h2>{t('showcase.stepMachine')}</h2>
                <p>{t('showcase.searchMachineHint')}</p>
              </div>
            </header>
            {machineCode && !machineSearchOpen ? (
              <div className="showcase-write__selected">
                <div>
                  <strong>{machineLabel}</strong>
                  {machineBrand ? <span>{machineBrand}</span> : null}
                </div>
                <button
                  type="button"
                  className="showcase-write__more"
                  onClick={() => setMachineSearchOpen(true)}
                >
                  {t('showcase.changeMachine')}
                </button>
              </div>
            ) : (
              <div className="showcase-write__search">
                <input
                  className="input"
                  value={machineQ}
                  onChange={(e) => setMachineQ(e.target.value)}
                  placeholder={t('showcase.searchMachine')}
                  autoComplete="off"
                />
                {machineQ.trim().length >= 1 && machinesQuery.data?.length === 0 && !machinesQuery.isFetching ? (
                  <p className="showcase-write__empty">{t('showcase.noMachineResults')}</p>
                ) : null}
                {(machinesQuery.data ?? []).length > 0 ? (
                  <div className="showcase-write__results">
                    {(machinesQuery.data ?? []).map((m) => (
                      <button
                        key={m.code}
                        type="button"
                        className={machineCode === m.code ? 'is-on' : ''}
                        onClick={() => {
                          setMachineCode(m.code);
                          setMachineSearchOpen(false);
                          setMachineQ('');
                        }}
                      >
                        <strong>{getLocalizedName(m.name, i18n.language, m.code)}</strong>
                        {m.brandCode ? <span>{m.brandCode}</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
                <Link className="showcase-write__more" to={ROUTES.MACHINE_REQUESTS_WRITE}>
                  {t('showcase.suggestMachine')}
                </Link>
              </div>
            )}
          </section>

          <section className={`showcase-write__card${caption.trim() || tags.length ? ' is-ready' : ''}`}>
            <header className="showcase-write__card-head">
              <span className="showcase-write__step">4</span>
              <div>
                <h2>{t('showcase.stepCaption')}</h2>
                <p>{t('showcase.captionHint')}</p>
              </div>
              <span className="showcase-write__count">
                {t('showcase.captionCount', { count: caption.length, max: MAX_CAPTION })}
              </span>
            </header>
            <label className="visually-hidden" htmlFor="showcase-caption">
              {t('showcase.stepCaption')}
            </label>
            <textarea
              id="showcase-caption"
              className="input showcase-write__compose"
              maxLength={MAX_CAPTION}
              rows={5}
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
              placeholder={t('showcase.captionPlaceholder')}
            />

            <div className="showcase-write__field">
              <div className="showcase-write__field-head">
                <h3>{t('showcase.stepTags')}</h3>
                <span>{t('showcase.tagsCount', { count: tags.length, max: MAX_TAGS })}</span>
              </div>
              <p className="showcase-write__field-hint">{t('showcase.tagsHint')}</p>
              <div className={`showcase-write__tagbox${tags.length >= MAX_TAGS ? ' is-full' : ''}`}>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="showcase-write__tag"
                    aria-label={t('showcase.tagRemoveAria', { tag })}
                    onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                  >
                    #{tag}
                    <X size={14} strokeWidth={2.4} aria-hidden />
                  </button>
                ))}
                {tags.length < MAX_TAGS ? (
                  <input
                    className="showcase-write__tag-input"
                    value={tagDraft}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.includes(',') || value.includes('#')) {
                        const parts = value.split(/[,#]+/);
                        const tail = parts.pop() ?? '';
                        setTags((prev) => {
                          const next = [...prev];
                          for (const part of parts) {
                            const tag = normalizeTag(part);
                            if (
                              !tag ||
                              next.length >= MAX_TAGS ||
                              next.some((item) => item.toLowerCase() === tag.toLowerCase())
                            ) {
                              continue;
                            }
                            next.push(tag);
                          }
                          return next;
                        });
                        setTagDraft(tail);
                        return;
                      }
                      setTagDraft(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        commitTagDraft();
                      } else if (e.key === 'Backspace' && !tagDraft && tags.length) {
                        setTags((prev) => prev.slice(0, -1));
                      }
                    }}
                    onBlur={commitTagDraft}
                    placeholder={tags.length ? t('showcase.tagsMorePlaceholder') : t('showcase.tagsPlaceholder')}
                    aria-label={t('showcase.tagsAddAria')}
                    autoComplete="off"
                    enterKeyHint="done"
                  />
                ) : null}
              </div>
            </div>
          </section>

          <div className="showcase-write__foot">
            <button type="submit" className="btn btn--primary btn--block" disabled={mutation.isPending}>
              {mutation.isPending ? t('showcase.submitting') : t('showcase.submit')}
            </button>
          </div>
        </form>
      </PageShell>
    </div>
  );
}
