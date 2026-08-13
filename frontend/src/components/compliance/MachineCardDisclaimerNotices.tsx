import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, Check, ChevronRight, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import './MachineCardDisclaimerNotices.css';

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Bottom notices on individual machine recommendation card — UI only. */
export function MachineCardDisclaimerNotices() {
  const { t } = useTranslation();
  const healthParagraphs = splitParagraphs(t('compliance.disclaimer.healthCardBody'));
  const aiBody = t('compliance.disclaimer.aiCardBody');
  const aiHighlight = t('compliance.disclaimer.aiCardHighlight');
  const learnMore = t('compliance.disclaimer.learnMoreCard');

  return (
    <div className="mcd-notices" aria-label={t('compliance.disclaimer.noticesLabel')}>
      <aside className="mcd-card mcd-card--health" role="note">
        <div className="mcd-card__icon" aria-hidden>
          <ShieldCheck size={22} strokeWidth={1.75} />
        </div>
        <div className="mcd-card__body">
          <h3 className="mcd-card__title">{t('compliance.disclaimer.healthTitle')}</h3>
          {healthParagraphs.map((p) => (
            <p key={p.slice(0, 24)} className="mcd-card__text">
              {p}
            </p>
          ))}
          <Link className="mcd-card__more" to={ROUTES.LEGAL_AI}>
            {learnMore}
            <ChevronRight size={14} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </aside>

      <aside className="mcd-card mcd-card--ai" role="note">
        <div className="mcd-card__icon" aria-hidden>
          <BrainCircuit size={22} strokeWidth={1.75} />
        </div>
        <div className="mcd-card__body">
          <h3 className="mcd-card__title">{t('compliance.disclaimer.aiTitle')}</h3>
          <p className="mcd-card__text">{aiBody}</p>
          <p className="mcd-card__highlight">
            <Check size={15} strokeWidth={2.5} aria-hidden />
            <span>{aiHighlight}</span>
          </p>
          <Link className="mcd-card__more" to={ROUTES.LEGAL_AI}>
            {learnMore}
            <ChevronRight size={14} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </aside>
    </div>
  );
}
