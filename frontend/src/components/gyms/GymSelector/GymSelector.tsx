import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useAuthStore } from '@/store/auth.store';
import './GymSelector.css';

export function GymSelector() {
  const { t } = useTranslation(['gyms', 'common']);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { gyms, activeGym, activeGymId, isLoading, selectGym, createGym } = useActiveGym();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [brandName, setBrandName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setShowForm(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setShowForm(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!isAuthenticated) return null;

  const label = activeGym?.name ?? t('selector.currentGym');

  const handleSelect = async (gymId: string) => {
    if (gymId === activeGymId) {
      setOpen(false);
      return;
    }
    await selectGym(gymId);
    setOpen(false);
    setShowForm(false);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await createGym({
        name: trimmed,
        address: address.trim() || undefined,
        brandName: brandName.trim() || undefined,
        setActive: true,
      });
      setName('');
      setAddress('');
      setBrandName('');
      setShowForm(false);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gym-selector" ref={rootRef}>
      <button
        type="button"
        className="gym-selector__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('selector.currentGym')}
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

          {!showForm ? (
            <button
              type="button"
              className="gym-selector__add"
              onClick={() => setShowForm(true)}
            >
              {t('selector.addGym')}
            </button>
          ) : (
            <form className="gym-selector__form" onSubmit={(e) => void handleCreate(e)}>
              <label className="gym-selector__field">
                <span>{t('selector.gymName')}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={200}
                  autoFocus
                />
              </label>
              <label className="gym-selector__field">
                <span>{t('selector.address')}</span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={500}
                />
              </label>
              <label className="gym-selector__field">
                <span>{t('selector.brand')}</span>
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  maxLength={100}
                />
              </label>
              <button
                type="submit"
                className="btn btn--primary gym-selector__save"
                disabled={!name.trim() || submitting}
              >
                {t('selector.save')}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
