import type { ImgHTMLAttributes } from 'react';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { getMuscleGroupImage } from '@/constants/muscle-group-images';
import '@/styles/muscle-group-icon.css';

const FALLBACK_LABELS: Partial<Record<MuscleGroup, string>> = {
  biceps: 'Bi',
  triceps: 'Tr',
};

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
  const src = getMuscleGroupImage(group);

  if (!src) {
    const label = FALLBACK_LABELS[group as MuscleGroup] ?? String(group).slice(0, 2).toUpperCase();
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
      className={`muscle-group-icon${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, ...style }}
      {...props}
    />
  );
}
