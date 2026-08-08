import { useTranslation } from 'react-i18next';
import { buildPillarDisplay } from '@/components/fortune/reading/ganzhiLabels';

interface FortunePillarCardProps {
  title: string;
  stemHan: string | null | undefined;
  branchHan: string | null | undefined;
  roleKey: 'year' | 'month' | 'day' | 'hour';
  emptyLabel?: string;
}

export function FortunePillarCard({
  title,
  stemHan,
  branchHan,
  roleKey,
  emptyLabel,
}: FortunePillarCardProps) {
  const { t } = useTranslation('fortune');
  const pillar = buildPillarDisplay(stemHan, branchHan);

  if (!pillar) {
    return (
      <div className="fr-pillar">
        <p className="fr-pillar__title">{title}</p>
        <p className="fr-pillar__empty">{emptyLabel ?? '—'}</p>
      </div>
    );
  }

  const stemElement = pillar.stemElement
    ? t(`element.${pillar.stemElement}`)
    : '';
  const branchElement = pillar.branchElement
    ? t(`element.${pillar.branchElement}`)
    : '';
  const yy = pillar.stemYinYang ? t(`ganzhi.yinYang.${pillar.stemYinYang}`) : '';

  return (
    <div className="fr-pillar">
      <p className="fr-pillar__title">{title}</p>
      <p className="fr-pillar__han" aria-hidden>
        {pillar.stemHan}
        {pillar.branchHan}
      </p>
      <p className="fr-pillar__ko">
        {pillar.stemKo}
        {pillar.branchKo}
        <span className="fr-pillar__ko-han">
          ({pillar.stemHan}
          {pillar.branchHan})
        </span>
      </p>
      <p className="fr-pillar__meta">
        {t('ganzhi.stemLabel')}: {pillar.stemKo}({pillar.stemHan})
        {stemElement ? ` · ${stemElement}` : ''}
        {yy ? ` · ${yy}` : ''}
      </p>
      <p className="fr-pillar__meta">
        {t('ganzhi.branchLabel')}: {pillar.branchKo}({pillar.branchHan})
        {branchElement ? ` · ${branchElement}` : ''}
      </p>
      <p className="fr-pillar__role">{t(`ganzhi.role.${roleKey}`)}</p>
      <p className="fr-pillar__hint">
        {t('ganzhi.comboHint', {
          stem: `${pillar.stemKo}(${pillar.stemHan})`,
          branch: `${pillar.branchKo}(${pillar.branchHan})`,
          stemEl: stemElement || t('ganzhi.unknownElement'),
          branchEl: branchElement || t('ganzhi.unknownElement'),
        })}
      </p>
      {pillar.stemCode ? (
        <p className="fr-pillar__gym">💪 {t(`ganzhi.stemGym.${pillar.stemCode}`)}</p>
      ) : null}
    </div>
  );
}
