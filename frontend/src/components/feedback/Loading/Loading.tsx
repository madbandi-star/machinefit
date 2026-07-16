import '@/styles/components.css';

export function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div className="skeleton" style={{ width: 120, height: 24 }} />
    </div>
  );
}
