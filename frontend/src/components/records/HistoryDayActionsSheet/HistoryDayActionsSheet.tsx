import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import './HistoryDayActionsSheet.css';

export interface HistoryDayTemplateOption {
  id: string;
  name: string;
}

export interface HistoryDayActionsSheetProps {
  open: boolean;
  dateLabel: string;
  showPlanAdd: boolean;
  planAddUrl: string;
  canSaveTemplate: boolean;
  templates: HistoryDayTemplateOption[];
  canDeleteDay: boolean;
  deleteLabel: string;
  savingTemplate?: boolean;
  applyingTemplate?: boolean;
  onClose: () => void;
  onSaveTemplate: (name: string) => void;
  onApplyTemplate: (templateId: string) => void;
  onDeleteDay: () => void;
}

export function HistoryDayActionsSheet({
  open,
  dateLabel,
  showPlanAdd,
  planAddUrl,
  canSaveTemplate,
  templates,
  canDeleteDay,
  deleteLabel,
  savingTemplate = false,
  applyingTemplate = false,
  onClose,
  onSaveTemplate,
  onApplyTemplate,
  onDeleteDay,
}: HistoryDayActionsSheetProps) {
  const { t } = useTranslation(['machines', 'common']);
  const titleId = useId();
  const nameInputId = useId();
  const sheetRef = useModalAccessibility({ open, onClose });
  const [savingMode, setSavingMode] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    if (!open) {
      setSavingMode(false);
      setTemplateName('');
    }
  }, [open]);

  if (!open) return null;

  const hasActions = showPlanAdd || canSaveTemplate || templates.length > 0 || canDeleteDay;

  return (
    <div className="bottom-sheet-overlay day-actions-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        ref={sheetRef}
        className="bottom-sheet card day-actions-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="day-actions-sheet__handle" aria-hidden="true" />

        <div className="bottom-sheet__header day-actions-sheet__header">
          <div className="day-actions-sheet__heading">
            <p id={titleId} className="day-actions-sheet__title">
              {t('machines:history.dayActionsTitle')}
            </p>
            <p className="day-actions-sheet__date">{dateLabel}</p>
          </div>
          <button
            type="button"
            className="bottom-sheet__close"
            onClick={onClose}
            aria-label={t('common:actions.close')}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="day-actions-sheet__body">
          {!hasActions ? (
            <p className="day-actions-sheet__empty">{t('machines:history.dayActionsEmpty')}</p>
          ) : null}

          {showPlanAdd ? (
            <Link
              to={planAddUrl}
              className="day-actions-sheet__row"
              onClick={onClose}
            >
              <span className="day-actions-sheet__icon" aria-hidden="true">
                <Icon name="dumbbell" size={20} />
              </span>
              <span className="day-actions-sheet__copy">
                <span className="day-actions-sheet__row-title">
                  {t('machines:history.planAddForDate')}
                </span>
                <span className="day-actions-sheet__row-desc">
                  {t('machines:history.dayActionsAddPlanHint')}
                </span>
              </span>
              <Icon name="chevronRight" size={18} className="day-actions-sheet__chevron" />
            </Link>
          ) : null}

          {canSaveTemplate ? (
            savingMode ? (
              <div className="day-actions-sheet__save-form">
                <label className="day-actions-sheet__field-label" htmlFor={nameInputId}>
                  {t('machines:history.planTemplateNamePrompt')}
                </label>
                <input
                  id={nameInputId}
                  className="day-actions-sheet__input"
                  type="text"
                  value={templateName}
                  autoFocus
                  maxLength={40}
                  placeholder={t('machines:history.planTemplateNamePlaceholder')}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const name = templateName.trim();
                      if (!name || savingTemplate) return;
                      onSaveTemplate(name);
                    }
                  }}
                />
                <div className="day-actions-sheet__save-actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    disabled={savingTemplate}
                    onClick={() => {
                      setSavingMode(false);
                      setTemplateName('');
                    }}
                  >
                    {t('common:actions.cancel')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={savingTemplate || !templateName.trim()}
                    onClick={() => {
                      const name = templateName.trim();
                      if (!name) return;
                      onSaveTemplate(name);
                    }}
                  >
                    {t('machines:history.planTemplateSaveConfirm')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="day-actions-sheet__row"
                disabled={savingTemplate}
                onClick={() => setSavingMode(true)}
              >
                <span className="day-actions-sheet__icon" aria-hidden="true">
                  <Icon name="bookmark" size={20} />
                </span>
                <span className="day-actions-sheet__copy">
                  <span className="day-actions-sheet__row-title">
                    {t('machines:history.planSaveTemplate')}
                  </span>
                  <span className="day-actions-sheet__row-desc">
                    {t('machines:history.dayActionsSaveTemplateHint')}
                  </span>
                </span>
                <Icon name="chevronRight" size={18} className="day-actions-sheet__chevron" />
              </button>
            )
          ) : null}

          {templates.length > 0 ? (
            <section className="day-actions-sheet__section" aria-label={t('machines:history.planApplyTemplate')}>
              <p className="day-actions-sheet__section-label">
                {t('machines:history.planApplyTemplate')}
              </p>
              <p className="day-actions-sheet__section-hint">
                {t('machines:history.dayActionsApplyTemplateHint')}
              </p>
              <ul className="day-actions-sheet__templates">
                {templates.map((template) => (
                  <li key={template.id}>
                    <button
                      type="button"
                      className="day-actions-sheet__template"
                      disabled={applyingTemplate}
                      onClick={() => onApplyTemplate(template.id)}
                    >
                      <Icon name="history" size={16} aria-hidden="true" />
                      <span>{template.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {canDeleteDay ? (
            <button
              type="button"
              className="day-actions-sheet__row day-actions-sheet__row--danger"
              onClick={onDeleteDay}
            >
              <span className="day-actions-sheet__icon day-actions-sheet__icon--danger" aria-hidden="true">
                <Icon name="close" size={18} />
              </span>
              <span className="day-actions-sheet__copy">
                <span className="day-actions-sheet__row-title">{deleteLabel}</span>
                <span className="day-actions-sheet__row-desc">
                  {t('machines:history.dayActionsDeleteHint')}
                </span>
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
