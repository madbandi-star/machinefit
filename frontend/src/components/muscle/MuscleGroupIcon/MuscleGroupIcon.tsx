import type { ImgHTMLAttributes } from 'react';
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

export function MuscleGroupIcon({
  group,
  size = 32,
  className,
  style,
  ...props
}: MuscleGroupIconProps) {
  const remoteMap = useMuscleGroupImageMap();
  const preferThumb = size <= 64;
  const src = resolveMuscleGroupDisplayUrl(group, remoteMap, preferThumb);

  if (!src) {
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
      {...props}
    />
  );
}
