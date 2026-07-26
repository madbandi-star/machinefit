import type { ReactElement, SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'machines'
  | 'records'
  | 'growthAnalysis'
  | 'user'
  | 'search'
  | 'qr'
  | 'chevronRight'
  | 'chevronDown'
  | 'dumbbell'
  | 'history'
  | 'heart'
  | 'bell'
  | 'refresh'
  | 'mapPin'
  | 'moreHorizontal'
  | 'close'
  | 'share'
  | 'bookmark'
  | 'calendar'
  | 'circleCheck'
  | 'sliders'
  | 'trendingUp'
  | 'weightPlate'
  | 'kettlebell'
  | 'flame'
  | 'clock'
  | 'weightStack'
  | 'barbell'
  | 'seatBack'
  | 'cableHandle'
  | 'totalWeightBag'
  | 'pencil';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

const PATHS: Record<IconName, ReactElement> = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H14v-5.5h-4V20.5H5.5A1.5 1.5 0 0 1 4 19v-8.5Z" />
    </>
  ),
  machines: (
    <>
      <path d="M9 4h6" />
      <path d="M8 7h8" />
      <path d="M9 10h6" />
      <path d="M8 13h8" />
      <path d="M9 16h6" />
      <path d="M12 4v16" />
    </>
  ),
  records: (
    <>
      <path d="M7 4h10a2 2 0 0 1 2 2v14l-4-2.5L11 20V6a2 2 0 0 1 2-2H7a2 2 0 0 0-2 2v12h12" />
    </>
  ),
  growthAnalysis: (
    <>
      <path d="M7 4h10a2 2 0 0 1 2 2v14" />
      <path d="M7 20V6a2 2 0 0 1 2-2" />
      <path d="M9 16l3-3.5 2.5 2 4-5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="5.5" />
      <path d="m16.5 16.5 4 4" />
    </>
  ),
  qr: (
    <>
      <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 3h2v2h-2v-2Zm4 0h2v2h-2v-2ZM14 18h2v2h-2v-2Zm4 4h2v2h-2v-2Z" />
    </>
  ),
  chevronRight: (
    <path d="m9 6 5 6-5 6" />
  ),
  chevronDown: (
    <path d="m6 9 6 6 6-6" />
  ),
  dumbbell: (
    <>
      <path d="M6 9H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 12h8" />
      <path d="M6 7v10M18 7v10" />
    </>
  ),
  history: (
    <>
      <path d="M12 8v4l3 2" />
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
    </>
  ),
  heart: (
    <path d="M12 20s-7-4.4-7-9.5C5 7.5 7.5 5.5 10 5.5c1.5 0 2 1 2 1s.5-1 2-1c2.5 0 5 2 5 5.5C19 15.6 12 20 12 20Z" />
  ),
  bell: (
    <>
      <path d="M12 4a4 4 0 0 0-4 4v2.5c0 .6-.2 1.2-.6 1.7L6 15h12l-1.4-2.8c-.4-.5-.6-1.1-.6-1.7V8a4 4 0 0 0-4-4Z" />
      <path d="M10 17a2 2 0 0 0 4 0" />
    </>
  ),
  refresh: (
    <>
      <path d="M4 12a8 8 0 0 1 13.7-5.7" />
      <path d="M20 4v5h-5" />
      <path d="M20 12a8 8 0 0 1-13.7 5.7" />
      <path d="M4 20v-5h5" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </>
  ),
  moreHorizontal: (
    <>
      <circle cx="6" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  share: (
    <>
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </>
  ),
  bookmark: (
    <>
      <path d="M7 4.5h10a1 1 0 0 1 1 1v14l-6-3.5L6 19.5v-14a1 1 0 0 1 1-1Z" />
    </>
  ),
  calendar: (
    <>
      <path d="M7 3v2M17 3v2M5 8h14" />
      <rect x="4" y="5" width="16" height="16" rx="2" />
    </>
  ),
  circleCheck: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.2 2.2 4.8-5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 8h16" />
      <path d="M4 16h16" />
      <circle cx="9" cy="8" r="2" />
      <circle cx="15" cy="16" r="2" />
    </>
  ),
  trendingUp: (
    <>
      <path d="M4 18h16" />
      <path d="M7 15l3-3 3 2 5-7" />
    </>
  ),
  weightPlate: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  kettlebell: (
    <>
      <path d="M9.5 8.5a2.5 2.5 0 0 1 5 0" />
      <path d="M12 8.5V11" />
      <path d="M8.5 11.5h7l-1.2 8.5h-4.6L8.5 11.5Z" />
    </>
  ),
  flame: (
    <>
      <path d="M12 21c3.2-2.6 5-5.6 5-9.2a5 5 0 0 0-9.2-2.8C7.2 11.5 5 13.5 5 16.8 5 18.4 5.6 19.9 6.6 21Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l2.5 1.5" />
    </>
  ),
  weightStack: (
    <>
      <rect x="7" y="5" width="10" height="2.5" rx="0.75" />
      <rect x="7" y="9" width="10" height="2.5" rx="0.75" />
      <rect x="7" y="13" width="10" height="2.5" rx="0.75" />
      <path d="M12 16v4" />
    </>
  ),
  barbell: (
    <>
      <path d="M4 12h16" />
      <path d="M6 9v6M18 9v6" />
      <rect x="7.5" y="10" width="2" height="4" rx="0.5" />
      <rect x="14.5" y="10" width="2" height="4" rx="0.5" />
    </>
  ),
  seatBack: (
    <>
      <path d="M6 18v-4a2 2 0 0 1 2-2h6" />
      <path d="M8 12V8h4v4" />
      <path d="M16 14h2v4" />
    </>
  ),
  cableHandle: (
    <>
      <path d="M12 4v4.5" />
      <path d="M9.5 8.5h5" />
      <path d="M10 8.5v9a2 2 0 0 0 4 0v-9" />
    </>
  ),
  totalWeightBag: (
    <>
      <path d="M8.5 8h7l1 12H7.5l1-12Z" />
      <path d="M10 8V6.5a2 2 0 0 1 4 0V8" />
      <path d="M12 11.5v3.5M10.5 13h3" />
    </>
  ),
  pencil: (
    <>
      <path d="M14 5l5 5-9 9H5v-5l9-9Z" />
      <path d="M13 6l5 5" />
    </>
  ),
};

export function Icon({ name, size = 24, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
