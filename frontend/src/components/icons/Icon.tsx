import type { ReactElement, SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'machines'
  | 'records'
  | 'user'
  | 'search'
  | 'qr'
  | 'chevronRight'
  | 'dumbbell'
  | 'history'
  | 'heart'
  | 'bell';

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
      <path d="M14.7 6.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0l-1.6 1.6 4 4 1.6-1.6ZM3 17l3.8-3.8 4 4L7 21H3v-4ZM18 3l-1.5 1.5 2 2L20 5l-2-2Z" />
      <path d="m11.5 8.5 6 6" />
    </>
  ),
  records: (
    <>
      <path d="M7 4h10a2 2 0 0 1 2 2v14l-4-2.5L11 20V6a2 2 0 0 1 2-2H7a2 2 0 0 0-2 2v12h12" />
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
