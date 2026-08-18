import type { ReactElement } from 'react';
import type { MachineRarityGrade } from '@machinefit/shared';
import { MACHINE_RARITY_META } from '@machinefit/shared';

const INNER: Record<MachineRarityGrade, ReactElement> = {
  COMMON: (
    <>
      <circle cx="16" cy="16" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.1" />
      <circle cx="16" cy="16" r="2.2" fill="currentColor" />
    </>
  ),
  UNCOMMON: (
    <polygon
      points="16,7.5 24.2,12.2 24.2,19.8 16,24.5 7.8,19.8 7.8,12.2"
      fill="currentColor"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinejoin="round"
    />
  ),
  RARE: (
    <rect
      x="9.8"
      y="9.8"
      width="12.4"
      height="12.4"
      rx="1.1"
      transform="rotate(45 16 16)"
      fill="currentColor"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.85"
    />
  ),
  EPIC: (
    <>
      <path
        d="M16 6.4 24.6 9.2v7.1c0 5.1-3.7 8.4-8.6 10.3-4.9-1.9-8.6-5.2-8.6-10.3V9.2L16 6.4Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M16 12.1 16.85 14.7h2.7l-2.18 1.58.83 2.56L16 17.28l-2.2 1.56.83-2.56-2.18-1.58h2.7Z"
        fill="currentColor"
      />
    </>
  ),
  LEGENDARY: (
    <path
      d="M7.6 12.1 11.5 16.4 16 8.5l4.5 7.9 3.9-4.3v9.7H7.6Z"
      fill="currentColor"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ),
  MYTHIC: (
    <>
      <path
        d="M16.2 25.2c3.8 0 6.6-2.7 6.6-6.4 0-3.2-1.9-5.4-3.8-7.5 0 2.2-.8 3.7-2.2 4.7.4-3.6-.4-6.6-3.4-8.8 0 2.8-1.4 5.1-1.6 7.4-1.6-.8-3.2-2.4-3.4-4.8 0 4 .8 7.6 2.8 10 1.3 1.6 2.8 2.6 5 5.4Z"
        fill="currentColor"
        fillOpacity="0.28"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M20.8 8.2 21.4 10h1.9l-1.55 1.12.6 1.84L20.8 11.9l-1.55 1.06.6-1.84L18.3 10h1.9Z"
        fill="currentColor"
      />
    </>
  ),
  UNIQUE: (
    <>
      <path
        d="M16 5.2 18.15 13.1 26.8 16 18.15 18.9 16 26.8 13.85 18.9 5.2 16 13.85 13.1Z"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="1.7" fill="currentColor" />
    </>
  ),
};

export function RarityEmblem({
  grade,
  size = 24,
  className = '',
}: {
  grade: MachineRarityGrade;
  size?: number;
  className?: string;
}) {
  const resolved = MACHINE_RARITY_META[grade] ? grade : 'COMMON';
  const meta = MACHINE_RARITY_META[resolved];

  return (
    <svg
      className={`rarity-emblem rarity-emblem--${resolved.toLowerCase()}${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      style={{ ['--rarity-swatch' as string]: meta.swatch }}
    >
      <circle
        cx="16"
        cy="16"
        r="14.2"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.55"
      />
      {INNER[resolved]}
    </svg>
  );
}
