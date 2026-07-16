import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';

export function Toast() {
  const toast = useUIStore((s) => s.toast);
  const hideToast = useUIStore((s) => s.hideToast);

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
