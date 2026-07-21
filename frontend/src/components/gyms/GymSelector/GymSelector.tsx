import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { ALL_GYMS_ID, isAllGymsId } from '@machinefit/shared';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useAuthStore } from '@/store/auth.store';
import './GymSelector.css';

/** Top-of-page gym picker: view and select only (create/manage is on My Page). */
export function GymSelector() {
  const { t } = useTranslation(['gyms', 'common']);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { gyms, activeGym, activeGymId, isLoading, selectGym } = useActiveGym();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const isAllGyms = isAllGymsId(activeGymId);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!isAuthenticated) return null;

  const label = isAllGyms
    ? t('gyms:selector.allGyms')
    : (activeGym?.name ?? t('gyms:selector.currentGym'));

  const handleSelect = async (gymId: string) => {
    if (gymId === activeGymId) {
      setOpen(false);
      return;
    }
    await selectGym(gymId);
    setOpen(false);
  };

  return (
    <div className="gym-selector" ref={rootRef}>
      <button
        type="button"
        className="gym-selector__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('gyms:selector.currentGym')}
        disabled={isLoading}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="gym-selector__label">{isLoading ? '…' : label}</span>
        <ChevronDown
          size={16}
          strokeWidth={2.25}
          className={`gym-selector__chevron${open ? ' gym-selector__chevron--open' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="gym-selector__menu" id={menuId} role="listbox">
          <ul className="gym-selector__list">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={isAllGyms}
                className={`gym-selector__option${isAllGyms ? ' gym-selector__option--active' : ''}`}
                onClick={() => void handleSelect(ALL_GYMS_ID)}
              >
                <span className="gym-selector__option-name">{t('gyms:selector.allGyms')}</span>
                <span className="gym-selector__option-meta">{t('gyms:selector.allGymsDesc')}</span>
              </button>
            </li>
            {gyms.map((gym) => (
              <li key={gym.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={gym.id === activeGymId}
                  className={`gym-selector__option${gym.id === activeGymId ? ' gym-selector__option--active' : ''}`}
                  onClick={() => void handleSelect(gym.id)}
                >
                  <span className="gym-selector__option-name">{gym.name}</span>
                  {gym.brandName ? (
                    <span className="gym-selector__option-meta">{gym.brandName}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
