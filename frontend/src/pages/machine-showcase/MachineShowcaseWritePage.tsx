import { useMemo, useState } from 'react';
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
  const [machineQ, setMachineQ] = useState('');
  const [machineCode, setMachineCode] = useState(presetMachineCode);
  const [caption, setCaption] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [files, setFiles] = useState<File[]>([]);

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
    enabled: gymQ.trim().length >= 2,
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
    <PageShell title={t('showcase.writeTitle')} subtitle={t('showcase.writeHint')}>
      <form
        className="showcase-write"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          mutation.mutate();
        }}
      >
        <section className="showcase-step">
          <h2>1. {t('showcase.stepGym')}</h2>
          <select value={userGymId} onChange={(e) => setUserGymId(e.target.value)}>
            <option value="">{t('showcase.selectGym')}</option>
            {gyms.filter((g) => !isAllGymsId(g.id)).map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
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
                  onClick={() => setGymId(g.id)}
                >
                  {g.name}
                </button>
              ))}
            </div>
          ) : null}
          <Link to={ROUTES.MY_GYMS}>{t('showcase.registerGym')}</Link>
        </section>

        <section className="showcase-step">
          <h2>2. {t('showcase.stepMachine')}</h2>
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
                onClick={() => setMachineCode(m.code)}
              >
                {getLocalizedName(m.name, i18n.language, m.code)}
                {m.brandCode ? ` · ${m.brandCode}` : ''}
              </button>
            ))}
          </div>
          {selectedMachine ? (
            <p className="showcase-write__picked">
              {getLocalizedName(selectedMachine.name, i18n.language, selectedMachine.code)}
              {selectedMachine.brandCode ? ` · ${selectedMachine.brandCode}` : ''}
            </p>
          ) : machineCode ? (
            <p className="showcase-write__picked">{machineCode}</p>
          ) : null}
          <Link to={ROUTES.MACHINE_REQUESTS_WRITE}>{t('showcase.suggestMachine')}</Link>
        </section>

        <section className="showcase-step">
          <h2>3. {t('showcase.stepPhoto')}</h2>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))}
          />
          <p className="showcase-empty">{t('showcase.photoHint')}</p>
        </section>

        <section className="showcase-step">
          <h2>4. {t('showcase.stepCaption')}</h2>
          <textarea
            maxLength={500}
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t('showcase.captionPlaceholder')}
          />
        </section>

        <section className="showcase-step">
          <h2>5. {t('showcase.stepTags')}</h2>
          <input
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder={t('showcase.tagsPlaceholder')}
          />
        </section>

        <button type="submit" className="btn btn--primary btn--block" disabled={!canSubmit}>
          {mutation.isPending ? t('showcase.submitting') : t('showcase.submit')}
        </button>
      </form>
    </PageShell>
  );
}
