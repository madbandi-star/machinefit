import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { FitRating } from '@/api';
import { Icon } from '@/components/icons/Icon';
import '@/styles/recommendation.css';

interface FitFeedbackPanelProps {
  savedRating?: FitRating | null;
  onRating: (fitRating: FitRating) => void;
  isPending?: boolean;
  /** Shown only when “셋팅값 조정필요” is selected. */
  onSavePreferences?: () => void;
  isPreferencesPending?: boolean;
  /** Unsaved adjustment edits — pulses the save control like plan-save attention. */
  preferencesDirty?: boolean;
  /** When false, hide title/desc intro copy (e.g. records page). */
  showIntroText?: boolean;
  /** Records: bad button shows save label and triggers onBadSave instead of re-rating. */
  badButtonSaveMode?: boolean;
  onBadSave?: () => void;
}

export function FitFeedbackPanel({
  savedRating,
  onRating,
  isPending = false,
  onSavePreferences,
  isPreferencesPending = false,
  preferencesDirty = false,
  showIntroText = true,
  badButtonSaveMode = false,
  onBadSave,
}: FitFeedbackPanelProps) {
  const { t } = useTranslation('machines');
  const goodRef = useRef<HTMLButtonElement>(null);
  const badRef = useRef<HTMLButtonElement>(null);
  const wasPendingRef = useRef(false);
  const showSavePreferences = Boolean(onSavePreferences) && savedRating === 'bad';
  const hasIntro = showIntroText || showSavePreferences;

  const showBadAsSave = badButtonSaveMode && savedRating === 'bad';
  const prefsAttention =
    preferencesDirty && !isPreferencesPending && !(showBadAsSave && isPending);
  // Records: after 「셋팅값 조정 필요」 → 「셋팅값 저장하기」, pulse like plan-save.
  const badSaveAttention = showBadAsSave && !isPending && !isPreferencesPending;

  const selectRating = (fitRating: FitRating) => {
    if (isPending) return;
    onRating(fitRating);
  };

  // After the request finishes, restore focus to the selected button.
  // Native `disabled` during pending moves focus away (often to the sibling).
  useEffect(() => {
    if (isPending) {
      wasPendingRef.current = true;
      return;
    }
    if (!wasPendingRef.current) return;
    wasPendingRef.current = false;
    const target = savedRating === 'good' ? goodRef.current : savedRating === 'bad' ? badRef.current : null;
    target?.focus({ preventScroll: true });
  }, [isPending, savedRating]);

  return (
    <section className="fit-feedback-panel" aria-label={t('feedback.actionsLabel')} aria-busy={isPending}>
      {hasIntro ? (
        <div className="fit-feedback-panel__intro">
          {showIntroText || showSavePreferences ? (
            <div className="fit-feedback-panel__intro-heading">
              {showIntroText ? (
                <h3 className="fit-feedback-panel__title">{t('feedback.title')}</h3>
              ) : null}
              {showSavePreferences ? (
                <button
                  type="button"
                  className={`btn btn--primary fit-feedback-panel__save-btn${
                    prefsAttention ? ' fit-feedback-panel__save-btn--attention' : ''
                  }`}
                  disabled={isPreferencesPending}
                  onClick={onSavePreferences}
                  aria-live={prefsAttention ? 'polite' : undefined}
                >
                  {isPreferencesPending ? t('feedback.preferencesSaving') : t('feedback.savePreferences')}
                </button>
              ) : null}
            </div>
          ) : null}
          {showIntroText ? <p className="fit-feedback-panel__desc">{t('feedback.desc')}</p> : null}
        </div>
      ) : null}
      <div className="fit-feedback-panel__actions" role="group" aria-label={t('feedback.actionsLabel')}>
        <button
          ref={goodRef}
          type="button"
          className={`fit-feedback-panel__btn${savedRating === 'good' ? ' fit-feedback-panel__btn--active' : ''}`}
          onClick={() => selectRating('good')}
          disabled={isPending}
          aria-pressed={savedRating === 'good'}
        >
          <Icon name="circleCheck" size={20} />
          {t('feedback.good')}
        </button>
        <button
          ref={badRef}
          type="button"
          className={`fit-feedback-panel__btn${savedRating === 'bad' ? ' fit-feedback-panel__btn--active' : ''}${
            showBadAsSave ? ' fit-feedback-panel__btn--save' : ''
          }${badSaveAttention ? ' fit-feedback-panel__btn--save-attention' : ''}`}
          onClick={() => {
            if (showBadAsSave) {
              if (isPending) return;
              onBadSave?.();
              return;
            }
            selectRating('bad');
          }}
          disabled={isPending || (showBadAsSave && !onBadSave)}
          aria-pressed={savedRating === 'bad'}
          aria-live={badSaveAttention ? 'polite' : undefined}
        >
          <Icon name="sliders" size={20} />
          {showBadAsSave ? t('feedback.saveSettings') : t('feedback.bad')}
        </button>
      </div>
      {isPending ? (
        <p className="fit-feedback-panel__pending" aria-live="polite">
          {t('feedback.saving')}
        </p>
      ) : null}
    </section>
  );
}
