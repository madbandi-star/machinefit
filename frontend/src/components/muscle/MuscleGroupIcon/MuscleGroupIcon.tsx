import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import type { MuscleGroup } from '@/constants/muscle-groups';
import {
  resolveMuscleGroupDisplayUrl,
  useMuscleGroupImageMap,
} from '@/hooks/useMuscleGroupImages';
import '@/styles/muscle-group-icon.css';

interface MuscleGroupIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  group: MuscleGroup | string;
  size?: number;
}

function MuscleFallback({
  group,
  size,
  className,
  style,
}: {
  group: string;
  size: number;
  className?: string;
  style?: ImgHTMLAttributes<HTMLImageElement>['style'];
}) {
  const label = String(group).slice(0, 2).toUpperCase();
  return (
    <span
      aria-hidden
      className={`muscle-group-icon muscle-group-icon--fallback${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34), ...style }}
    >
      {label}
    </span>
  );
}

export function MuscleGroupIcon({
  group,
  size = 32,
  className,
  style,
  ...props
}: MuscleGroupIconProps) {
  const { map: remoteMap } = useMuscleGroupImageMap();
  const preferThumb = size <= 64;
  // Seed covers immediately; remote admin URLs replace them when the catalog arrives.
  // Blocking seed until ready left letter-only chips on first search-page visit.
  const src = resolveMuscleGroupDisplayUrl(group, remoteMap, preferThumb, {
    allowSeedFallback: true,
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <MuscleFallback group={String(group)} size={size} className={className} style={style} />
    );
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`muscle-group-icon${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, ...style }}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
