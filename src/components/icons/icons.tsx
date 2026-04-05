/**
 * SVG icon library for custom modes.
 * Each icon is a React component accepting `className` for styling.
 */

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

// ─── Shared wrapper ───────────────────────────────────────────────────────────

function Svg({ children, className, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

// ─── Education ────────────────────────────────────────────────────────────────

export function IconBook(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </Svg>
  );
}

export function IconGradCap(p: IconProps) {
  return (
    <Svg {...p}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="6 9.5 6 16" />
      <path d="M20 7v9a8 8 0 0 1-16 0V7" />
    </Svg>
  );
}

export function IconPencil(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </Svg>
  );
}

export function IconMicroscope(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 18h8" />
      <path d="M3 22h18" />
      <path d="M14 22a7 7 0 1 0 0-14h-1" />
      <path d="M9 14h2" />
      <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
      <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
    </Svg>
  );
}

export function IconCalculator(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="8" x2="8" y1="12" y2="12" />
      <line x1="12" x2="12" y1="12" y2="12" />
      <line x1="16" x2="16" y1="12" y2="12" />
      <line x1="8" x2="8" y1="16" y2="16" />
      <line x1="12" x2="12" y1="16" y2="16" />
      <line x1="16" x2="16" y1="16" y2="16" />
    </Svg>
  );
}

export function IconGlobe(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Svg>
  );
}

// ─── Health ───────────────────────────────────────────────────────────────────

export function IconHeart(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  );
}

export function IconDumbbell(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14.4 14.4 9.6 9.6" />
      <path d="M18.657 4.757a2 2 0 0 1 2.829 2.828l-.707.707-2.829-2.828.707-.707z" />
      <path d="m17.243 6.172-6.072 6.072" />
      <path d="m5.343 19.071-1.414-1.414 9.9-9.9 1.414 1.414" />
      <path d="m4.636 20.485 1.414-1.414-1.414-1.415-1.414 1.414a1 1 0 0 0 1.414 1.415z" />
      <path d="m19.778 4.222 1.414 1.414a1 1 0 0 1-1.414 1.415l-1.414-1.415 1.414-1.414z" />
    </Svg>
  );
}

export function IconRunning(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="4" r="1" />
      <path d="m6 8 2-2 4 1 3-3 3 1" />
      <path d="m6 12 2 6h2l2-4 2 4h2l1-6" />
    </Svg>
  );
}

export function IconApple(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06z" />
      <path d="M10 2c1 .5 2 2 2 5" />
    </Svg>
  );
}

export function IconMoon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  );
}

export function IconDroplet(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </Svg>
  );
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export function IconCoin(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 8.5h3a2 2 0 0 1 0 4H10v3.5" />
      <line x1="10" y1="7.5" x2="10" y2="8.5" />
      <line x1="10" y1="16" x2="10" y2="17" />
    </Svg>
  );
}

export function IconWallet(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </Svg>
  );
}

export function IconChartBar(p: IconProps) {
  return (
    <Svg {...p}>
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
      <line x1="2" x2="22" y1="20" y2="20" />
    </Svg>
  );
}

export function IconPiggyBank(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8.5 3.2 1.5 4.3A8.5 8.5 0 0 0 9 19h2v-1.5A1.5 1.5 0 0 1 12.5 16H14a1.5 1.5 0 0 1 1.5 1.5V19h1a6 6 0 0 0 4.5-2.1l.5.6V19h2v-5.4c0-.8-.3-1.6-.8-2.2A9.5 9.5 0 0 0 19 5z" />
      <circle cx="9" cy="11" r="1" />
      <path d="M17 8h.01" />
    </Svg>
  );
}

export function IconCreditCard(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="22" height="16" x="1" y="4" rx="2" ry="2" />
      <line x1="1" x2="23" y1="10" y2="10" />
    </Svg>
  );
}

export function IconTrendingUp(p: IconProps) {
  return (
    <Svg {...p}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </Svg>
  );
}

// ─── Work ─────────────────────────────────────────────────────────────────────

export function IconBriefcase(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Svg>
  );
}

export function IconLaptop(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
    </Svg>
  );
}

export function IconCalendar(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </Svg>
  );
}

export function IconClock(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Svg>
  );
}

export function IconTarget(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </Svg>
  );
}

export function IconChartLine(p: IconProps) {
  return (
    <Svg {...p}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </Svg>
  );
}

// ─── Creative ─────────────────────────────────────────────────────────────────

export function IconMusicNote(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </Svg>
  );
}

export function IconPalette(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="13.5" cy="6.5" r=".5" />
      <circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" />
      <circle cx="6.5" cy="12.5" r=".5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </Svg>
  );
}

export function IconCamera(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </Svg>
  );
}

export function IconPen(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </Svg>
  );
}

export function IconFilm(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" />
      <line x1="7" x2="7" y1="2" y2="22" />
      <line x1="17" x2="17" y1="2" y2="22" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <line x1="2" x2="7" y1="7" y2="7" />
      <line x1="2" x2="7" y1="17" y2="17" />
      <line x1="17" x2="22" y1="17" y2="17" />
      <line x1="17" x2="22" y1="7" y2="7" />
    </Svg>
  );
}

export function IconMic(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="23" />
      <line x1="8" x2="16" y1="23" y2="23" />
    </Svg>
  );
}

// ─── Personal ─────────────────────────────────────────────────────────────────

export function IconStar(p: IconProps) {
  return (
    <Svg {...p}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Svg>
  );
}

export function IconHome(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  );
}

export function IconLeaf(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </Svg>
  );
}

export function IconSun(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" x2="12" y1="1" y2="3" />
      <line x1="12" x2="12" y1="21" y2="23" />
      <line x1="4.22" x2="5.64" y1="4.22" y2="5.64" />
      <line x1="18.36" x2="19.78" y1="18.36" y2="19.78" />
      <line x1="1" x2="3" y1="12" y2="12" />
      <line x1="21" x2="23" y1="12" y2="12" />
      <line x1="4.22" x2="5.64" y1="19.78" y2="18.36" />
      <line x1="18.36" x2="19.78" y1="5.64" y2="4.22" />
    </Svg>
  );
}

export function IconCoffee(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </Svg>
  );
}

export function IconFlame(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Svg>
  );
}

// ─── Icon registry ────────────────────────────────────────────────────────────

export type IconKey =
  // Education
  | "book" | "grad_cap" | "pencil" | "microscope" | "calculator" | "globe"
  // Health
  | "heart" | "dumbbell" | "running" | "apple" | "moon" | "droplet"
  // Finance
  | "coin" | "wallet" | "chart_bar" | "piggy_bank" | "credit_card" | "trending_up"
  // Work
  | "briefcase" | "laptop" | "calendar" | "clock" | "target" | "chart_line"
  // Creative
  | "music_note" | "palette" | "camera" | "pen" | "film" | "mic"
  // Personal
  | "star" | "home" | "leaf" | "sun" | "coffee" | "flame";

export const ICON_MAP: Record<IconKey, React.ComponentType<IconProps>> = {
  // Education
  book: IconBook,
  grad_cap: IconGradCap,
  pencil: IconPencil,
  microscope: IconMicroscope,
  calculator: IconCalculator,
  globe: IconGlobe,
  // Health
  heart: IconHeart,
  dumbbell: IconDumbbell,
  running: IconRunning,
  apple: IconApple,
  moon: IconMoon,
  droplet: IconDroplet,
  // Finance
  coin: IconCoin,
  wallet: IconWallet,
  chart_bar: IconChartBar,
  piggy_bank: IconPiggyBank,
  credit_card: IconCreditCard,
  trending_up: IconTrendingUp,
  // Work
  briefcase: IconBriefcase,
  laptop: IconLaptop,
  calendar: IconCalendar,
  clock: IconClock,
  target: IconTarget,
  chart_line: IconChartLine,
  // Creative
  music_note: IconMusicNote,
  palette: IconPalette,
  camera: IconCamera,
  pen: IconPen,
  film: IconFilm,
  mic: IconMic,
  // Personal
  star: IconStar,
  home: IconHome,
  leaf: IconLeaf,
  sun: IconSun,
  coffee: IconCoffee,
  flame: IconFlame,
};

export const ICON_CATEGORIES: { label: string; keys: IconKey[] }[] = [
  {
    label: "Education",
    keys: ["book", "grad_cap", "pencil", "microscope", "calculator", "globe"],
  },
  {
    label: "Health",
    keys: ["heart", "dumbbell", "running", "apple", "moon", "droplet"],
  },
  {
    label: "Finance",
    keys: ["coin", "wallet", "chart_bar", "piggy_bank", "credit_card", "trending_up"],
  },
  {
    label: "Work",
    keys: ["briefcase", "laptop", "calendar", "clock", "target", "chart_line"],
  },
  {
    label: "Creative",
    keys: ["music_note", "palette", "camera", "pen", "film", "mic"],
  },
  {
    label: "Personal",
    keys: ["star", "home", "leaf", "sun", "coffee", "flame"],
  },
];

/** Render a named SVG icon with optional className. Falls back to ⭐ if key is unrecognised. */
export function ModeIcon({
  iconKey,
  className,
}: {
  iconKey: string;
  className?: string;
}) {
  const Component = ICON_MAP[iconKey as IconKey];
  if (!Component) {
    return <span className={className} aria-hidden="true">⭐</span>;
  }
  return <Component className={className} />;
}
