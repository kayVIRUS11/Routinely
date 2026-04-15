"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Home,
  Timer,
  BookOpen,
  Briefcase,
  Dumbbell,
  DollarSign,
  LayoutGrid,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NewModeModal, { type CustomMode } from "./NewModeModal";
import { ModeIcon } from "@/components/icons/icons";
import { db, todayISO } from "@/db/db";

const navItems = [
  { href: "/home", icon: Home, label: "Home Hub" },
  { href: "/pomodoro", icon: Timer, label: "Pomodoro" },
];

// Static mode config — badges are computed dynamically below
const modeItemsConfig = [
  { href: "/study", icon: BookOpen, label: "Study", modeKey: "study" as const },
  { href: "/professional", icon: Briefcase, label: "Professional", modeKey: "professional" as const },
  { href: "/fitness", icon: Dumbbell, label: "Fitness", modeKey: "fitness" as const },
  { href: "/financial", icon: DollarSign, label: "Financial", modeKey: "financial" as const },
  { href: "/general", icon: LayoutGrid, label: "General", modeKey: "general" as const },
];

type ModeKey = (typeof modeItemsConfig)[number]["modeKey"];

interface SettingsMode {
  id: string;
  enabled: boolean;
  builtin: boolean;
}

function useEnabledModes(): Set<string> {
  const [enabledIds, setEnabledIds] = useState<Set<string>>(() => {
    // All modes enabled by default
    return new Set(modeItemsConfig.map((m) => m.modeKey));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadEnabled = () => {
      try {
        const raw = localStorage.getItem("settings_modes");
        if (raw) {
          const stored = JSON.parse(raw) as SettingsMode[];
          const ids = new Set(stored.filter((m) => m.enabled).map((m) => m.id));
          setEnabledIds(ids);
        }
      } catch { /* ignore */ }
    };

    loadEnabled();

    // Re-check when storage changes (cross-tab) or custom event fires (same-tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "settings_modes") loadEnabled();
    };
    const onCustom = () => loadEnabled();
    window.addEventListener("storage", onStorage);
    window.addEventListener("settings_modes_changed", onCustom);
    // Also poll on focus to catch same-tab changes
    const onFocus = () => loadEnabled();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("settings_modes_changed", onCustom);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return enabledIds;
}

function useBadges(): Record<ModeKey | string, number> {
  const [badges, setBadges] = useState<Record<string, number>>({
    study: 0,
    professional: 0,
    fitness: 0,
    financial: 0,
    general: 0,
  });

  const computeBadges = useCallback(async () => {
    const today = todayISO();

    try {
      // Study: tasks due today (mode_id = 'study') + overdue assignments
      const [studyTasksDueToday, overdueAssignments] = await Promise.all([
        db.tasks
          .where("due_date")
          .equals(today)
          .filter((t) => t.mode_id === "study" && !t.completed && !t.is_deleted)
          .count(),
        db.assignments
          .filter((a) => !a.completed && !a.is_deleted && !!a.due_date && a.due_date < today)
          .count(),
      ]);

      // Financial: bills due within next 3 days
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      const in3DaysISO = in3Days.toISOString().split("T")[0]!;
      const upcomingBills = await db.bills
        .filter(
          (b) =>
            !b.is_paid &&
            !b.is_deleted &&
            b.due_date >= today &&
            b.due_date <= in3DaysISO,
        )
        .count();

      // Professional: tasks due today or overdue
      const professionalDue = await db.tasks
        .filter(
          (t) =>
            t.mode_id === "professional" &&
            !t.completed &&
            !t.is_deleted &&
            !!t.due_date &&
            t.due_date <= today,
        )
        .count();

      // Fitness: 1 if today's planned workout has no log, 0 otherwise
      const todayPlan = await db.workout_plans
        .filter(
          (p) =>
            !p.is_deleted &&
            (p.scheduled_date === today ||
              p.day_of_week === new Date().getDay()),
        )
        .count();
      const todayLog = await db.workout_logs
        .where("log_date")
        .equals(today)
        .filter((l) => !l.is_deleted)
        .count();
      const fitnessBadge = todayPlan > 0 && todayLog === 0 ? 1 : 0;

      // General: habits not yet checked in today
      const allHabits = await db.habits.filter((h) => !h.is_deleted).toArray();
      const todayLogs = await db.habit_logs
        .where("logged_date")
        .equals(today)
        .filter((l) => !l.is_deleted)
        .toArray();
      const loggedHabitIds = new Set(todayLogs.map((l) => l.habit_id));
      const generalBadge = allHabits.filter((h) => !loggedHabitIds.has(h.id)).length;

      setBadges({
        study: studyTasksDueToday + overdueAssignments,
        professional: professionalDue,
        fitness: fitnessBadge,
        financial: upcomingBills,
        general: generalBadge,
      });
    } catch {
      // IndexedDB not available (SSR or first render) — leave badges at 0
    }
  }, []); // no deps needed since todayISO() reads from Date.now()

  useEffect(() => {
    void computeBadges();

    // Re-query on window focus or when task/habit data changes
    const onFocus = () => void computeBadges();
    window.addEventListener("focus", onFocus);
    // Also respond to custom events dispatched when data changes (same-tab)
    const onDataChange = () => void computeBadges();
    window.addEventListener("routinely_data_changed", onDataChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("routinely_data_changed", onDataChange);
    };
  }, [computeBadges]);

  return badges;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [showNewMode, setShowNewMode] = useState(false);
  const [customModes, setCustomModes] = useState<CustomMode[]>([]);
  const badges = useBadges();
  const enabledModes = useEnabledModes();

  const loadCustomModes = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("custom_modes");
      setCustomModes(stored ? (JSON.parse(stored) as CustomMode[]) : []);
    } catch {
      // localStorage contained malformed JSON — reset to empty list
      setCustomModes([]);
    }
  }, []);

  useEffect(() => {
    loadCustomModes();
    // Re-load when settings change (storage event covers cross-tab; custom events cover same-tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "custom_modes" || e.key === "settings_modes") loadCustomModes();
    };
    const onCustom = () => loadCustomModes();
    const onFocus = () => loadCustomModes();
    window.addEventListener("storage", onStorage);
    window.addEventListener("settings_modes_changed", onCustom);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("settings_modes_changed", onCustom);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadCustomModes]);

  const handleModeCreated = (mode: CustomMode) => {
    setCustomModes((prev) => [...prev, mode]);
    setShowNewMode(false);
  };

  // Filter built-in modes based on enabled state from settings
  const visibleBuiltinModes = modeItemsConfig.filter((item) => enabledModes.has(item.modeKey));

  // Filter custom modes: show if in enabledModes set OR if settings_modes hasn't been set yet
  // (enabledModes starts as all built-in ids, so custom modes always show until explicitly disabled)
  const settingsModesLoaded = typeof window !== "undefined" && !!localStorage.getItem("settings_modes");
  const visibleCustomModes = customModes.filter((mode) =>
    !settingsModesLoaded || enabledModes.has(mode.id)
  );

  return (
    <>
      {showNewMode && (
        <NewModeModal
          onClose={() => setShowNewMode(false)}
          onCreated={handleModeCreated}
        />
      )}
      <aside
        className="fixed left-0 top-0 h-full z-50 flex flex-col bg-sidebar border-r border-border transition-all duration-300 ease-in-out"
        style={{ width: hovered ? "220px" : "52px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-3.5 border-b border-border shrink-0 overflow-hidden">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">R</span>
          </div>
          {hovered && (
            <span className="ml-3 text-text-primary font-semibold text-sm whitespace-nowrap">
              Routinely
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 flex flex-col gap-1 overflow-hidden overflow-y-auto">
          {navItems.map((item) => (
            <SidebarItem
              key={item.href}
              {...item}
              active={pathname === item.href}
              expanded={hovered}
            />
          ))}

          {/* Divider */}
          <div className="my-2 mx-3 border-t border-border" />

          {/* Built-in mode items */}
          {visibleBuiltinModes.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              badge={badges[item.modeKey] ?? 0}
              active={pathname.startsWith(item.href)}
              expanded={hovered}
            />
          ))}

          {/* Custom modes */}
          {visibleCustomModes.map((mode) => (
            <SidebarCustomItem
              key={mode.id}
              mode={mode}
              active={pathname.startsWith(`/custom/${mode.id}`)}
              expanded={hovered}
            />
          ))}

          {/* Add mode */}
          <button
            onClick={() => setShowNewMode(true)}
            className={cn(
              "flex items-center mx-2 px-2 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-card transition-colors duration-200 gap-3",
              "overflow-hidden whitespace-nowrap"
            )}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {hovered && <span className="text-sm">New Mode</span>}
          </button>
        </nav>

        {/* Bottom items */}
        <div className="py-3 border-t border-border flex flex-col gap-1 overflow-hidden">
          <SidebarItem
            href="/settings"
            icon={Settings}
            label="Settings"
            active={pathname === "/settings"}
            expanded={hovered}
          />
          <SidebarItem
            href="/profile"
            icon={User}
            label="Profile"
            active={pathname === "/profile"}
            expanded={hovered}
          />
        </div>
      </aside>
    </>
  );
}

interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  expanded?: boolean;
  badge?: number;
}

function SidebarItem({ href, icon: Icon, label, active, expanded, badge }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center mx-2 px-2 py-2 rounded-lg transition-colors duration-200 gap-3 overflow-hidden whitespace-nowrap",
        active
          ? "bg-primary/10 text-primary"
          : "text-text-secondary hover:text-text-primary hover:bg-card"
      )}
    >
      <div className="relative shrink-0">
        <Icon className="w-4 h-4" />
        {badge != null && badge > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-medium">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </div>
      {expanded && <span className="text-sm">{label}</span>}
    </Link>
  );
}

function SidebarCustomItem({
  mode,
  active,
  expanded,
}: {
  mode: CustomMode;
  active: boolean;
  expanded: boolean;
}) {
  return (
    <Link
      href={`/custom/${mode.id}`}
      className={cn(
        "flex items-center mx-2 px-2 py-2 rounded-lg transition-colors duration-200 gap-3 overflow-hidden whitespace-nowrap",
        active
          ? "bg-primary/10 text-primary"
          : "text-text-secondary hover:text-text-primary hover:bg-card"
      )}
    >
      <div className="shrink-0 w-4 h-4 flex items-center justify-center">
        <ModeIcon
          iconKey={mode.icon}
          className="w-4 h-4"
        />
      </div>
      {expanded && <span className="text-sm truncate">{mode.name}</span>}
    </Link>
  );
}


