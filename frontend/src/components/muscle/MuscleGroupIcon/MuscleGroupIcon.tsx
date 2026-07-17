import type { ReactNode, SVGProps } from 'react';
import type { MuscleGroup } from '@/constants/muscle-groups';
import '@/styles/muscle-group-icon.css';

interface MuscleGroupIconProps extends SVGProps<SVGSVGElement> {
  group: MuscleGroup | string;
  size?: number;
}

const SKIN = 'var(--muscle-icon-skin, #d4a574)';
const OUTLINE = 'var(--muscle-icon-outline, #8b6914)';

function FigureBase({ children }: { children?: ReactNode }) {
  return (
    <>
      <circle cx="24" cy="8" r="5" fill={SKIN} stroke={OUTLINE} strokeWidth="0.75" />
      <path
        d="M17 14h14c1.5 0 2.5 1.2 2.5 2.8V22c0 1-.8 1.8-1.8 1.8H16.3c-1 0-1.8-.8-1.8-1.8v-5.2c0-1.6 1-2.8 2.5-2.8Z"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth="0.75"
      />
      <path
        d="M14 16.5 10 24v12"
        fill="none"
        stroke={SKIN}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M34 16.5 38 24v12"
        fill="none"
        stroke={SKIN}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M19 24.5h10v14c0 1.1-.9 2-2 2h-6c-1.1 0-2-.9-2-2v-14Z"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth="0.75"
      />
      {children}
    </>
  );
}

const HIGHLIGHTS: Record<MuscleGroup, ReactNode> = {
  chest: (
    <ellipse
      cx="24"
      cy="18.5"
      rx="5.5"
      ry="3.2"
      className="muscle-group-icon__highlight muscle-group-icon__highlight--chest"
    />
  ),
  back: (
    <>
      <path
        d="M18 15.5c2.5-1.2 9.5-1.2 12 0 1.2.6 2 1.8 2 3.2v3.5c-3.5 1.5-9.5 1.5-13 0v-3.5c0-1.4.8-2.6 2-3.2Z"
        className="muscle-group-icon__highlight muscle-group-icon__highlight--back"
      />
      <path
        d="M20 22.5c1.5 2 6.5 2 8 0"
        fill="none"
        stroke="var(--color-muscle-back)"
        strokeWidth="1.2"
        opacity="0.55"
      />
    </>
  ),
  legs: (
    <>
      <path
        d="M19 27h4.5v10c0 .8-.7 1.5-1.5 1.5h-1.5c-.8 0-1.5-.7-1.5-1.5V27Z"
        className="muscle-group-icon__highlight muscle-group-icon__highlight--legs"
      />
      <path
        d="M24.5 27H29v10c0 .8-.7 1.5-1.5 1.5H26c-.8 0-1.5-.7-1.5-1.5V27Z"
        className="muscle-group-icon__highlight muscle-group-icon__highlight--legs"
      />
    </>
  ),
  shoulders: (
    <>
      <circle
        cx="14.5"
        cy="16"
        r="3.2"
        className="muscle-group-icon__highlight muscle-group-icon__highlight--shoulders"
      />
      <circle
        cx="33.5"
        cy="16"
        r="3.2"
        className="muscle-group-icon__highlight muscle-group-icon__highlight--shoulders"
      />
    </>
  ),
};

function isMuscleGroup(value: string): value is MuscleGroup {
  return value in HIGHLIGHTS;
}

export function MuscleGroupIcon({
  group,
  size = 32,
  className,
  ...props
}: MuscleGroupIconProps) {
  const highlight = isMuscleGroup(group) ? HIGHLIGHTS[group] : null;

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden
      className={`muscle-group-icon${className ? ` ${className}` : ''}`}
      {...props}
    >
      <FigureBase>{highlight}</FigureBase>
    </svg>
  );
}
