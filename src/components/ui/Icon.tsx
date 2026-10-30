import type { SVGProps } from 'react';

export type IconName =
  | 'terminal'
  | 'graph'
  | 'files'
  | 'sun'
  | 'moon'
  | 'play'
  | 'reset'
  | 'check'
  | 'chevron'
  | 'branch'
  | 'target'
  | 'lock'
  | 'arrow-right'
  | 'book'
  | 'menu';

const PATHS: Record<IconName, string> = {
  terminal: 'M4 5h16v14H4zM7 9l3 3-3 3M12 15h5',
  graph: 'M6 6v10a2 2 0 0 0 2 2h8M6 6h3M15 18h3M12 6h3M12 6v4',
  files: 'M5 3h9l5 5v13H5zM14 3v5h5M8 13h8M8 17h6',
  sun: 'M12 4v2M12 18v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  play: 'M8 5l11 7-11 7z',
  reset: 'M4 4v6h6M4 10a8 8 0 1 1 2 7',
  check: 'M4 12l5 5L20 6',
  chevron: 'M9 6l6 6-6 6',
  branch: 'M6 4v10a4 4 0 0 0 4 4h6M6 4h.01M18 14h.01M18 18h.01M6 18h.01',
  target: 'M12 2v3M12 19v3M2 12h3M19 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  lock: 'M6 10h12v10H6zM8 10V7a4 4 0 0 1 8 0v3M12 14v2',
  'arrow-right': 'M4 12h16M14 6l6 6-6 6',
  book: 'M4 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-3a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h3z',
  menu: 'M4 7h16M4 12h16M4 17h16',
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
