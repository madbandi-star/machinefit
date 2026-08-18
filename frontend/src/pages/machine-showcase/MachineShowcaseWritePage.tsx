import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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

export function MachineShowcaseWritePage() {
  const { t, i18n } = useTranslation('community');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { gyms, activeGymId } = useActiveGym();
  const [searchParams] = useSearchParams();
  const presetMachineCode = searchParams.get('machineCode')?.trim() ?? '';

  const [userGymId, setUserGymId] = useState(activeGymId ?? '');
  const [gymId, setGymId] = useState('');
  const [gymQ, setGymQ] = useState('');
  const [gymSearchOpen, setGymSearchOpen] = useState(false);
  const [pickedGymName, setPickedGymName] = useState('');
  const [machineQ, setMachineQ] = useState('');
  const [machineCode, setMachineCode] = useState(presetMachineCode);
  const [machineSearchOpen, setMachineSearchOpen] = useState(!presetMachineCode);
  const [caption, setCaption] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const myGyms = gyms.filter((g) => !isAllGymsId(g.id));

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
    enabled: machineQ.trim().length >= 1,
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
    ? `${getLocalizedName(selectedMachine.name, i18n.language, selectedMachine.code)}${
        selectedMachine.brandCode ? ` · ${selectedMachine.brandCode}` : ''
      }`
    : machineCode;

  const mutation = useMutation({
    mutationFn: () =>
      machineShowcaseApi.create({
        machineCode,
        caption,
        tags: tagsRaw
          .split(/[,\s#]+/)
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 8),
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

  const canSubmit =
    Boolean((userGymId || gymId) && machineCode && files.length > 0) && !mutation.isPending;

  return (
    <div className="showcase-page showcase-page--write">
      <PageShell>
        <nav className="showcase-write__nav">
          <Link to={ROUTES.MACHINE_SHOWCASE} className="showcase-detail__back">
            {t('showcase.backList')}
          </Link>
          <h1 className="showcase-write__title">{t('showcase.writeTitle')}</h1>
          <button
            type="submit"
            form="showcase-write-form"
            className="showcase-write__nav-submit"
            disabled={!canSubmit}
          >
            {mutation.isPending ? t('showcase.submitting') : t('showcase.submit')}
          </button>
        </nav>

        <form
          id="showcase-write-form"
          className="showcase-write"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            mutation.mutate();
          }}
        >
          <section className="showcase-write__photos">
            <input
              id="showcase-photos"
              className="showcase-write__file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const next = Array.from(e.target.files ?? []);
                setFiles((prev) => [...prev, ...next].slice(0, 6));
                e.target.value = '';
              }}
            />
            {previewUrls.length > 0 ? (
              <div className="showcase-write__thumbs">
                {previewUrls.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    className="showcase-write__thumb"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label={t('showcase.removePhoto')}
                  >
                    <img src={url} alt="" />
                    <span className="showcase-write__thumb-x" aria-hidden>
                      ×
                    </span>
                  </button>
                ))}
                {files.length < 6 ? (
                  <label htmlFor="showcase-photos" className="showcase-write__add">
                    +
                    <span>
                      {files.length}/6
                    </span>
                  </label>
                ) : null}
              </div>
            ) : (
              <label htmlFor="showcase-photos" className="showcase-write__drop">
                <strong>{t('showcase.photoAdd')}</strong>
                <span>{t('showcase.photoHint')}</span>
              </label>
            )}
          </section>

          <section className="showcase-write__picks">
            <div className="showcase-write__pick">
              <span className="showcase-write__label">{t('showcase.stepGym')}</span>
              {myGyms.length > 0 ? (
                <select
                  value={userGymId}
                  onChange={(e) => {
                    setUserGymId(e.target.value);
                    if (e.target.value) {
                      setGymId('');
                      setPickedGymName('');
                    }
                  }}
                >
                  <option value="">{t('showcase.selectGym')}</option>
                  {myGyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Link className="showcase-write__textlink" to={ROUTES.MY_GYMS}>
                  {t('showcase.registerGym')}
                </Link>
              )}
              <button
                type="button"
                className="showcase-write__textlink showcase-write__textlink--btn"
                onClick={() => setGymSearchOpen((open) => !open)}
              >
                {t('showcase.otherGym')}
              </button>
              {gymSearchOpen ? (
                <>
                  <input
                    value={gymQ}
                    onChange={(e) => setGymQ(e.target.value)}
                    placeholder={t('showcase.searchGym')}
                  />
                  {directoryQuery.data?.length ? (
                    <div className="showcase-picker">
                      {directoryQuery.data.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          className={gymId === g.id ? 'is-selected' : ''}
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
                </>
              ) : null}
              {gymId && pickedGymName && !userGymId ? (
                <p className="showcase-write__picked">{pickedGymName}</p>
              ) : null}
            </div>

            <div className="showcase-write__pick">
              <span className="showcase-write__label">{t('showcase.stepMachine')}</span>
              {machineCode && !machineSearchOpen ? (
                <div className="showcase-write__chiprow">
                  <span className="showcase-write__chip">{machineLabel}</span>
                  <button
                    type="button"
                    className="showcase-write__textlink showcase-write__textlink--btn"
                    onClick={() => setMachineSearchOpen(true)}
                  >
                    {t('showcase.changeMachine')}
                  </button>
                </div>
              ) : (
                <>
                  <input
                    value={machineQ}
                    onChange={(e) => setMachineQ(e.target.value)}
                    placeholder={t('showcase.searchMachine')}
                  />
                  <div className="showcase-picker">
                    {(machinesQuery.data ?? []).map((m) => (
                      <button
                        key={m.code}
                        type="button"
                        className={machineCode === m.code ? 'is-selected' : ''}
                        onClick={() => {
                          setMachineCode(m.code);
                          setMachineSearchOpen(false);
                        }}
                      >
                        {getLocalizedName(m.name, i18n.language, m.code)}
                        {m.brandCode ? ` · ${m.brandCode}` : ''}
                      </button>
                    ))}
                  </div>
                  <Link className="showcase-write__textlink" to={ROUTES.MACHINE_REQUESTS_WRITE}>
                    {t('showcase.suggestMachine')}
                  </Link>
                </>
              )}
            </div>
          </section>

          <section className="showcase-write__copy">
            <textarea
              maxLength={500}
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t('showcase.captionPlaceholder')}
            />
            <input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder={t('showcase.tagsPlaceholder')}
            />
          </section>
        </form>
      </PageShell>
    </div>
  );
}
