import { useEffect } from 'react';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';

const TOAST_DURATION_MS = 3000;

export function Toast() {
  const toast = useUIStore((s) => s.toast);
  const hideToast = useUIStore((s) => s.hideToast);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(hideToast, TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  return (
    <div
      className={`toast toast--${toast.type}`}
      role="alert"
      onClick={hideToast}
    >
      {toast.message}
    </div>
  );
}
