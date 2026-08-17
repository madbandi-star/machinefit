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
  /**
   * When true, only 근육군 대표이미지 관리 (admin) URLs are used — never bundled
   * green anatomy seed art. Missing admin cover → letter fallback.
   */
  adminOnly?: boolean;
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
  adminOnly = false,
  className,
  style,
  ...props
}: MuscleGroupIconProps) {
  const { map: remoteMap, ready } = useMuscleGroupImageMap();
  const preferThumb = size <= 64;
  // Search chips: wait for admin catalog; never paint bundled seed anatomy.
  const src = resolveMuscleGroupDisplayUrl(group, remoteMap, preferThumb, {
    allowSeedFallback: adminOnly ? false : true,
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (adminOnly && !ready) {
    return (
      <MuscleFallback group={String(group)} size={size} className={className} style={style} />
    );
  }

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
