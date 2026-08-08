import { useTranslation } from 'react-i18next';
import type { ProseBlock } from '@/components/fortune/fortuneContent';

const EQUIPMENT_KEYS = new Set(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight']);

interface FortuneProseProps {
  block: ProseBlock;
  /** Plain API strings (already human-readable). */
  extraBullets?: string[];
  numbered?: boolean;
  className?: string;
}

function resolveValues(
  values: Record<string, string | number> | undefined,
  t: (key: string) => string
): Record<string, string | number> | undefined {
  if (!values) return undefined;
  const next = { ...values };
  if (typeof next.equipment === 'string' && EQUIPMENT_KEYS.has(next.equipment)) {
    next.equipment = t(next.equipment);
  }
  return next;
}

export function FortuneProse({
  block,
  extraBullets,
  numbered = false,
  className = '',
}: FortuneProseProps) {
  const { t } = useTranslation('fortune');

  return (
    <article className={`fortune-prose${className ? ` ${className}` : ''}`}>
      <p className="fortune-prose__eyebrow">
        <span aria-hidden>{block.emoji}</span> {t(block.eyebrowKey)}
      </p>
      {block.leadKey ? (
        <p className="fortune-prose__lead">
          {t(block.leadKey, resolveValues(block.leadValues, t))}
        </p>
      ) : null}
      {numbered ? (
        <ol className="fortune-prose__list fortune-prose__list--numbered">
          {block.lines.map((line) => (
            <li key={line.key + JSON.stringify(line.values ?? {})}>
              {t(line.key, resolveValues(line.values, t))}
            </li>
          ))}
        </ol>
      ) : (
        <div className="fortune-prose__body">
          {block.lines.map((line) => (
            <p key={line.key + JSON.stringify(line.values ?? {})}>
              {t(line.key, resolveValues(line.values, t))}
            </p>
          ))}
        </div>
      )}
      {extraBullets?.length ? (
        <ul className="fortune-prose__bullets">
          {extraBullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {block.checklistKeys?.length ? (
        <ul className="fortune-prose__checks">
          {block.checklistKeys.map((key) => (
            <li key={key}>
              <span aria-hidden>☑</span> {t(key)}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
