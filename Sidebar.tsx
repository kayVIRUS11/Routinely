"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

// ─── Icons (inline SVG — no extra deps needed) ───────────────────────────────

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);

const StudyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const WorkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/>
    <line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);

const FitnessIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/>
    <line x1="10" y1="1" x2="10" y2="4"/>
    <line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
);

const FinanceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const GeneralIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4l3 3"/>
  </svg>
);

const PomodoroIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <polyline points="12 7 12 12 15 15"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const MODES: Mode[] = [
  { id: "study",      label: "Study",      icon: <StudyIcon />,   badge: 3 },
  { id: "work",       label: "Professional", icon: <WorkIcon />,  badge: 2 },
  { id: "fitness",    label: "Fitness",    icon: <FitnessIcon /> },
  { id: "finance",    label: "Financial",  icon: <FinanceIcon />, badge: 1 },
  { id: "general",    label: "General",    icon: <GeneralIcon /> },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar() {
  return (
    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none">
      FL
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
  expanded: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, badge, active, expanded, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full flex items-center gap-3 px-2.5 py-2 rounded-md
        transition-all duration-150 cursor-pointer text-left
        ${active
          ? "bg-white/10 text-white"
          : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
        }
      `}
    >
      {/* Active indicator bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400 rounded-r-full" />
      )}

      {/* Icon */}
      <span className="shrink-0 w-[18px] flex items-center justify-center">
        {icon}
      </span>

      {/* Label */}
      <span
        className={`
          text-sm font-medium whitespace-nowrap overflow-hidden
          transition-all duration-200
          ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}
        `}
      >
        {label}
      </span>

      {/* Badge */}
      {badge && expanded && (
        <span className="ml-auto shrink-0 text-[10px] font-semibold bg-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}

      {/* Tooltip when collapsed */}
      {!expanded && (
        <span className="
          pointer-events-none absolute left-full ml-3 px-2.5 py-1.5
          bg-[#1e293b] text-white text-xs font-medium rounded-md
          whitespace-nowrap opacity-0 group-hover:opacity-100
          transition-opacity duration-150 z-50
          shadow-lg border border-white/10
        ">
          {label}
          {badge && (
            <span className="ml-1.5 text-violet-300">({badge})</span>
          )}
        </span>
      )}
    </button>
  );
}

function Divider() {
  return <div className="my-1 mx-2.5 h-px bg-white/5" />;
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [activeMode, setActiveMode] = useState("study");

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`
        relative flex flex-col h-screen
        bg-[#0f1117] border-r border-white/[0.06]
        transition-all duration-200 ease-in-out
        ${expanded ? "w-[220px]" : "w-[52px]"}
        shrink-0 overflow-hidden
      `}
    >
      {/* ── Top: Logo / App name ── */}
      <div className="flex items-center gap-3 px-2.5 py-4 mb-1">
        <Avatar />
        <span
          className={`
            text-white font-semibold text-sm tracking-tight whitespace-nowrap
            transition-all duration-200
            ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}
          `}
        >
          FlowLife
        </span>
        {expanded && (
          <button className="ml-auto text-[#475569] hover:text-white transition-colors">
            <ChevronRight />
          </button>
        )}
      </div>

      <Divider />

      {/* ── Home hub ── */}
      <div className="px-2 mt-1">
        <NavItem
          icon={<HomeIcon />}
          label="Home Hub"
          expanded={expanded}
          active={activeMode === "home"}
          onClick={() => setActiveMode("home")}
        />
        <NavItem
          icon={<PomodoroIcon />}
          label="Pomodoro"
          expanded={expanded}
          active={activeMode === "pomodoro"}
          onClick={() => setActiveMode("pomodoro")}
        />
      </div>

      <Divider />

      {/* ── Modes label ── */}
      {expanded && (
        <p className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-widest uppercase text-[#475569]">
          Modes
        </p>
      )}

      {/* ── Mode items ── */}
      <div className="px-2 flex flex-col gap-0.5">
        {MODES.map((mode) => (
          <NavItem
            key={mode.id}
            icon={mode.icon}
            label={mode.label}
            badge={mode.badge}
            expanded={expanded}
            active={activeMode === mode.id}
            onClick={() => setActiveMode(mode.id)}
          />
        ))}
      </div>

      {/* ── Add custom mode ── */}
      <div className="px-2 mt-1">
        <button
          className={`
            w-full flex items-center gap-3 px-2.5 py-2 rounded-md
            text-[#475569] hover:text-white hover:bg-white/5
            transition-all duration-150 cursor-pointer
          `}
        >
          <span className="shrink-0 w-[18px] flex items-center justify-center">
            <PlusIcon />
          </span>
          <span
            className={`
              text-sm font-medium whitespace-nowrap overflow-hidden
              transition-all duration-200
              ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}
            `}
          >
            New mode
          </span>
        </button>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      <Divider />

      {/* ── Bottom: Settings + user avatar ── */}
      <div className="px-2 pb-4 flex flex-col gap-0.5">
        <NavItem
          icon={<SettingsIcon />}
          label="Settings"
          expanded={expanded}
          active={activeMode === "settings"}
          onClick={() => setActiveMode("settings")}
        />

        {/* User row */}
        <div
          className={`
            flex items-center gap-3 px-2.5 py-2 rounded-md
            hover:bg-white/5 cursor-pointer transition-all duration-150
          `}
        >
          <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shrink-0" />
          <span
            className={`
              text-sm text-[#94a3b8] whitespace-nowrap overflow-hidden
              transition-all duration-200
              ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}
            `}
          >
            My Account
          </span>
        </div>
      </div>
    </div>
  );
}
