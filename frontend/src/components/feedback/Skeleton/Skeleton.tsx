import '@/styles/components.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({ width = '100%', height = 80, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ width, height, marginBottom: count > 1 ? '0.5rem' : 0 }}
        />
      ))}
    </>
  );
}
