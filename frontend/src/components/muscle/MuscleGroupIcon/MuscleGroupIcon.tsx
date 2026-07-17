import type { ImgHTMLAttributes } from 'react';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { getMuscleGroupImage } from '@/constants/muscle-group-images';
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
  const src = getMuscleGroupImage(group);

  if (!src) return null;

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
