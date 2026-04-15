"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Palette,
  Bell,
  User,
  Info,
  Moon,
  Sun,
  Download,
  Trash2,
  Plus,
  Check,
  X,
  Pencil,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { clearUserData } from "@/lib/clearUserData";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import type { CustomMode } from "@/components/sidebar/NewModeModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId = "modes" | "appearance" | "notifications" | "account" | "about";

interface Mode {
  id: string;
  label: string;
  icon: string;
  builtin: boolean;
  enabled: boolean;
  sections: { id: string; label: string; enabled: boolean }[];
}

interface NotificationSettings {
  reminderMinutes: number;
  enabledModes: string[];
  quietStart: string;
  quietEnd: string;
}

interface AppearanceSettings {
  darkMode: boolean;
  theme: string;
  accentColor: string;
}

interface AccountSettings {
  displayName: string;
  email: string;
  avatarInitial: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "modes", label: "Modes", icon: <Settings size={16} /> },
  { id: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { id: "account", label: "Account", icon: <User size={16} /> },
  { id: "about", label: "About", icon: <Info size={16} /> },
];

const THEMES = [
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep dark blue-black",
    vars: {
      background: "#0a0a0a",
      card: "#1a1a1a",
      sidebar: "#111111",
      border: "#2a2a2a",
      textPrimary: "#f1f1f1",
      textSecondary: "#888888",
    },
    preview: ["#0a0a0a", "#1a1a1a", "#6366f1"],
  },
  {
    id: "arctic",
    label: "Arctic",
    description: "Clean white and ice blue",
    vars: {
      background: "#f0f4f8",
      card: "#ffffff",
      sidebar: "#e2eaf2",
      border: "#c8d6e5",
      textPrimary: "#1a2332",
      textSecondary: "#5a7a99",
    },
    preview: ["#f0f4f8", "#ffffff", "#38bdf8"],
  },
  {
    id: "forest",
    label: "Forest",
    description: "Dark green tones",
    vars: {
      background: "#0d1a12",
      card: "#172414",
      sidebar: "#122018",
      border: "#1f3324",
      textPrimary: "#d4edda",
      textSecondary: "#6aab78",
    },
    preview: ["#0d1a12", "#172414", "#22c55e"],
  },
  {
    id: "amber",
    label: "Amber",
    description: "Warm golden tones",
    vars: {
      background: "#1a1200",
      card: "#261a00",
      sidebar: "#1f1600",
      border: "#3d2e00",
      textPrimary: "#fef3c7",
      textSecondary: "#b5922e",
    },
    preview: ["#1a1200", "#261a00", "#f59e0b"],
  },
  {
    id: "rose",
    label: "Rose",
    description: "Soft pink and warm white",
    vars: {
      background: "#1a0d12",
      card: "#261420",
      sidebar: "#201018",
      border: "#3d1e2c",
      textPrimary: "#fde8ef",
      textSecondary: "#c07a90",
    },
    preview: ["#1a0d12", "#261420", "#f43f5e"],
  },
];

const DEFAULT_MODES: Mode[] = [
  {
    id: "study",
    label: "Study",
    icon: "📚",
    builtin: true,
    enabled: true,
    sections: [
      { id: "tasks", label: "Tasks", enabled: true },
      { id: "goals", label: "Goals", enabled: true },
      { id: "pomodoro", label: "Pomodoro", enabled: true },
      { id: "notes", label: "Notes", enabled: false },
    ],
  },
  {
    id: "professional",
    label: "Professional",
    icon: "💼",
    builtin: true,
    enabled: true,
    sections: [
      { id: "tasks", label: "Tasks", enabled: true },
      { id: "meetings", label: "Meetings", enabled: true },
      { id: "goals", label: "Goals", enabled: false },
    ],
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: "💪",
    builtin: true,
    enabled: true,
    sections: [
      { id: "workouts", label: "Workouts", enabled: true },
      { id: "nutrition", label: "Nutrition", enabled: true },
      { id: "goals", label: "Goals", enabled: true },
    ],
  },
  {
    id: "financial",
    label: "Financial",
    icon: "💰",
    builtin: true,
    enabled: true,
    sections: [
      { id: "budget", label: "Budget", enabled: true },
      { id: "goals", label: "Goals", enabled: true },
      { id: "tracker", label: "Expense Tracker", enabled: false },
    ],
  },
  {
    id: "general",
    label: "General",
    icon: "🏠",
    builtin: true,
    enabled: true,
    sections: [
      { id: "habits", label: "Habits", enabled: true },
      { id: "journal", label: "Journal", enabled: true },
      { id: "tasks", label: "Tasks", enabled: true },
    ],
  },
];

const DEFAULT_NOTIFICATION: NotificationSettings = {
  reminderMinutes: 15,
  enabledModes: ["study", "professional", "fitness", "financial", "general"],
  quietStart: "22:00",
  quietEnd: "08:00",
};

const DEFAULT_APPEARANCE: AppearanceSettings = {
  darkMode: true,
  theme: "midnight",
  accentColor: "#6366f1",
};

const DEFAULT_ACCOUNT: AccountSettings = {
  displayName: "",
  email: "",
  avatarInitial: "?",
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed",
        checked ? "bg-primary" : "bg-border"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

// ─── Section Row ──────────────────────────────────────────────────────────────

function SectionRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && (
          <p className="text-xs text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── Apply Theme ──────────────────────────────────────────────────────────────

function applyTheme(themeId: string, accentColor: string) {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const root = document.documentElement;
  root.style.setProperty("--color-background", theme.vars.background);
  root.style.setProperty("--color-card", theme.vars.card);
  root.style.setProperty("--color-sidebar", theme.vars.sidebar);
  root.style.setProperty("--color-border", theme.vars.border);
  root.style.setProperty("--color-text-primary", theme.vars.textPrimary);
  root.style.setProperty("--color-text-secondary", theme.vars.textSecondary);
  root.style.setProperty("--color-primary", accentColor);
  document.body.style.background = theme.vars.background;
  document.body.style.color = theme.vars.textPrimary;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ─── Helpers: convert CustomMode ↔ Mode ──────────────────────────────────────

const SECTION_LABEL_MAP: Record<string, string> = {
  tasks: "Tasks",
  habits: "Habits",
  routine: "Routine",
  notes: "Notes",
  timer: "Timer",
  tracker: "Tracker",
  goals: "Goals",
  log: "Log",
};

function customModeToMode(cm: CustomMode): Mode {
  return {
    id: cm.id,
    label: cm.name,
    icon: cm.icon,
    builtin: false,
    enabled: true,
    sections: cm.sections.map((s) => ({
      id: s,
      label: SECTION_LABEL_MAP[s] ?? s,
      enabled: true,
    })),
  };
}

function modeToCustomMode(m: Mode): CustomMode {
  return {
    id: m.id,
    name: m.label,
    icon: m.icon,
    sections: m.sections.filter((s) => s.enabled).map((s) => s.id),
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { user, session, isGuest, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionId>("modes");

  // ── Modes state: merges settings_modes + custom_modes ──────────────────────

  const [modes, setModes] = useState<Mode[]>(() => {
    const stored = readStorage<Mode[]>("settings_modes", DEFAULT_MODES);
    // Merge in any custom_modes not already tracked in settings_modes
    const customStored = readStorage<CustomMode[]>("custom_modes", []);
    const storedIds = new Set(stored.map((m) => m.id));
    const merged = [...stored];
    for (const cm of customStored) {
      if (!storedIds.has(cm.id)) {
        merged.push(customModeToMode(cm));
      }
    }
    return merged;
  });

  const [expandedMode, setExpandedMode] = useState<string | null>(null);
  const [editingModeId, setEditingModeId] = useState<string | null>(null);
  const [editingModeLabel, setEditingModeLabel] = useState("");
  const [newModeName, setNewModeName] = useState("");
  const [showAddMode, setShowAddMode] = useState(false);

  const [appearance, setAppearance] = useState<AppearanceSettings>(() => {
    const stored = readStorage<AppearanceSettings | null>("settings_appearance", null);
    const themeKey = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (stored) {
      return {
        ...stored,
        darkMode: themeKey === "light" ? false : themeKey === "dark" ? true : stored.darkMode,
      };
    }
    return DEFAULT_APPEARANCE;
  });

  const [notifications, setNotifications] = useState<NotificationSettings>(() =>
    readStorage("settings_notifications", DEFAULT_NOTIFICATION)
  );

  // Account: initialised from auth user, NOT from localStorage dummy data
  const [account, setAccount] = useState<AccountSettings>(DEFAULT_ACCOUNT);
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [currency, setCurrency] = useState<string>(() => {
    if (typeof window === "undefined") return "USD";
    return localStorage.getItem("settings_currency") ?? "USD";
  });
  const [deleteInput, setDeleteInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  // Sync account state from auth whenever user changes
  useEffect(() => {
    if (user) {
      const name = (user.user_metadata?.full_name as string | undefined) ?? "";
      const email = user.email ?? "";
      const initial = name ? name[0].toUpperCase() : (email ? email[0].toUpperCase() : "?");
      setAccount({ displayName: name, email, avatarInitial: initial });
      setNameInput(name);
      setEmailInput(email);
    } else if (isGuest) {
      setAccount({ displayName: "Guest", email: "", avatarInitial: "G" });
      setNameInput("Guest");
      setEmailInput("");
    }
  }, [user, isGuest]);

  // Apply theme on first render
  useEffect(() => {
    applyTheme(appearance.theme, appearance.accentColor);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist modes to settings_modes AND sync back to custom_modes
  useEffect(() => {
    localStorage.setItem("settings_modes", JSON.stringify(modes));
    // Sync non-builtin modes back to custom_modes
    const customModes = modes.filter((m) => !m.builtin).map(modeToCustomMode);
    localStorage.setItem("custom_modes", JSON.stringify(customModes));
    // Notify sidebar in the same tab
    window.dispatchEvent(new CustomEvent("settings_modes_changed"));
  }, [modes]);

  // Persist appearance + apply theme
  useEffect(() => {
    localStorage.setItem("settings_appearance", JSON.stringify(appearance));
    localStorage.setItem("theme", appearance.darkMode ? "dark" : "light");
    applyTheme(appearance.theme, appearance.accentColor);
  }, [appearance]);

  // Persist notifications
  useEffect(() => {
    localStorage.setItem("settings_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function flash(msg: string) {
    setSaved(msg);
    setTimeout(() => setSaved(null), 2000);
  }

  function toggleModeEnabled(id: string) {
    setModes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  }

  function toggleModeSection(modeId: string, sectionId: string) {
    setModes((prev) =>
      prev.map((m) =>
        m.id === modeId
          ? {
              ...m,
              sections: m.sections.map((s) =>
                s.id === sectionId ? { ...s, enabled: !s.enabled } : s
              ),
            }
          : m
      )
    );
  }

  function moveMode(index: number, direction: "up" | "down") {
    setModes((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function startEditModeLabel(mode: Mode) {
    setEditingModeId(mode.id);
    setEditingModeLabel(mode.label);
  }

  function saveModeLabel(id: string) {
    const trimmed = editingModeLabel.trim();
    if (!trimmed) return;
    setModes((prev) => prev.map((m) => (m.id === id ? { ...m, label: trimmed } : m)));
    setEditingModeId(null);
    flash("Mode renamed");
  }

  function addMode() {
    const trimmed = newModeName.trim();
    if (!trimmed) return;
    const id = `custom_${crypto.randomUUID()}`;
    setModes((prev) => [
      ...prev,
      {
        id,
        label: trimmed,
        icon: "⚙️",
        builtin: false,
        enabled: true,
        sections: [{ id: "tasks", label: "Tasks", enabled: true }],
      },
    ]);
    setNewModeName("");
    setShowAddMode(false);
    flash("Mode added");
  }

  function removeMode(id: string) {
    setModes((prev) => prev.filter((m) => m.id !== id));
    flash("Mode removed");
  }

  function toggleNotificationMode(id: string) {
    setNotifications((prev) => ({
      ...prev,
      enabledModes: prev.enabledModes.includes(id)
        ? prev.enabledModes.filter((m) => m !== id)
        : [...prev.enabledModes, id],
    }));
  }

  function handleExport() {
    const data = {
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
      modes,
      appearance,
      notifications,
      account: { displayName: account.displayName, email: account.email },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `routinely-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Data exported");
  }

  const handleSaveName = useCallback(async () => {
    if (!nameInput.trim() || isGuest) return;
    const { error } = await supabase.auth.updateUser({
      data: { full_name: nameInput.trim() },
    });
    if (error) {
      flash("Failed to update name");
      return;
    }
    setAccount((prev) => ({
      ...prev,
      displayName: nameInput.trim(),
      avatarInitial: nameInput.trim()[0].toUpperCase(),
    }));
    setEditingName(false);
    flash("Name updated");
  }, [nameInput, isGuest]);

  const handleSaveEmail = useCallback(async () => {
    if (!emailInput.trim() || isGuest) return;
    const { error } = await supabase.auth.updateUser({ email: emailInput.trim() });
    if (error) {
      flash("Failed to update email: " + error.message);
      return;
    }
    setAccount((prev) => ({ ...prev, email: emailInput.trim() }));
    setEditingEmail(false);
    flash("Confirmation email sent — check your inbox");
  }, [emailInput, isGuest]);

  async function handleChangePassword() {
    if (!account.email || isGuest) return;
    const { error } = await supabase.auth.resetPasswordForEmail(account.email);
    if (error) {
      flash("Failed to send reset email");
    } else {
      flash("Password reset email sent");
    }
  }

  const handleDeleteAccount = useCallback(async () => {
    if (deleteInput !== "DELETE") return;
    setDeleteError("");

    const userId = user?.id ?? null;

    // Call the delete API (only for authenticated users)
    if (!isGuest && session) {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        let errorMsg = "Failed to delete account";
        try {
          const data = await res.json() as { error?: string };
          if (data.error) errorMsg = data.error;
        } catch { /* use default message */ }
        setDeleteError(errorMsg);
        return;
      }
    }

    // Clear all local data
    await clearUserData(userId);

    // Sign out and redirect to landing
    await signOut();
    router.push("/");
  }, [deleteInput, isGuest, session, user, signOut, router]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">
          Manage your preferences and account
        </p>
      </div>

      {/* Toast */}
      {saved && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-3 shadow-lg animate-fade-in">
          <Check size={16} className="text-success" />
          <span className="text-sm text-text-primary">{saved}</span>
        </div>
      )}

      <div className="flex gap-6">
        {/* Left nav */}
        <aside className="w-48 flex-shrink-0">
          <nav className="flex flex-col gap-1 sticky top-6">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 text-left",
                  activeSection === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-card"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* ── Modes ─────────────────────────────────────────────────────── */}
          {activeSection === "modes" && (
            <>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">
                      Modes Manager
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Enable, reorder, and configure sections for each mode
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddMode((v) => !v)}
                  >
                    <Plus size={14} />
                    Add Mode
                  </Button>
                </div>

                {showAddMode && (
                  <div className="mb-4 flex gap-2">
                    <Input
                      placeholder="Mode name…"
                      value={newModeName}
                      onChange={(e) => setNewModeName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addMode()}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={addMode}>
                      <Check size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowAddMode(false); setNewModeName(""); }}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {modes.map((mode, idx) => (
                    <div key={mode.id} className="border border-border rounded-lg overflow-hidden">
                      {/* Mode row */}
                      <div className="flex items-center gap-3 p-3 bg-card">
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveMode(idx, "up")}
                            disabled={idx === 0}
                            className="p-0.5 text-text-secondary hover:text-text-primary disabled:opacity-20 transition-colors"
                            aria-label="Move up"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            onClick={() => moveMode(idx, "down")}
                            disabled={idx === modes.length - 1}
                            className="p-0.5 text-text-secondary hover:text-text-primary disabled:opacity-20 transition-colors"
                            aria-label="Move down"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>

                        <span className="text-base leading-none">{mode.icon}</span>

                        {/* Label — inline editable for custom modes */}
                        {editingModeId === mode.id ? (
                          <div className="flex-1 flex items-center gap-1">
                            <input
                              value={editingModeLabel}
                              onChange={(e) => setEditingModeLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveModeLabel(mode.id);
                                if (e.key === "Escape") setEditingModeId(null);
                              }}
                              autoFocus
                              className="flex-1 text-sm bg-background border border-primary rounded px-2 py-0.5 text-text-primary focus:outline-none"
                            />
                            <button onClick={() => saveModeLabel(mode.id)} className="text-primary hover:text-primary/80">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingModeId(null)} className="text-text-secondary hover:text-text-primary">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-text-primary truncate">
                              {mode.label}
                            </span>
                            {!mode.builtin && (
                              <>
                                <span className="text-xs text-text-secondary border border-border rounded px-1.5 py-0.5 shrink-0">
                                  custom
                                </span>
                                <button
                                  onClick={() => startEditModeLabel(mode)}
                                  className="text-text-secondary hover:text-text-primary transition-colors shrink-0"
                                  aria-label="Rename mode"
                                >
                                  <Pencil size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Expand sections */}
                        <button
                          onClick={() =>
                            setExpandedMode((v) => (v === mode.id ? null : mode.id))
                          }
                          className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 shrink-0"
                        >
                          Sections
                        </button>

                        <Toggle
                          checked={mode.enabled}
                          onChange={() => toggleModeEnabled(mode.id)}
                        />

                        {!mode.builtin && (
                          <button
                            onClick={() => removeMode(mode.id)}
                            className="text-text-secondary hover:text-error transition-colors ml-1 shrink-0"
                            aria-label="Delete mode"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Section toggles */}
                      {expandedMode === mode.id && (
                        <div className="border-t border-border bg-background px-4 py-3 space-y-2">
                          <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-2">
                            Sections
                          </p>
                          {mode.sections.length === 0 && (
                            <p className="text-xs text-text-secondary italic">No sections configured.</p>
                          )}
                          {mode.sections.map((section) => (
                            <div
                              key={section.id}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm text-text-secondary">
                                {section.label}
                              </span>
                              <Toggle
                                checked={section.enabled}
                                onChange={() => toggleModeSection(mode.id, section.id)}
                                disabled={!mode.enabled}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── Appearance ────────────────────────────────────────────────── */}
          {activeSection === "appearance" && (
            <>
              <Card>
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  Appearance
                </h2>

                <SectionRow
                  label="Dark Mode"
                  description="Toggle between dark and light interface"
                >
                  <div className="flex items-center gap-2">
                    <Sun size={14} className="text-text-secondary" />
                    <Toggle
                      checked={appearance.darkMode}
                      onChange={(v) =>
                        setAppearance((prev) => ({ ...prev, darkMode: v }))
                      }
                    />
                    <Moon size={14} className="text-text-secondary" />
                  </div>
                </SectionRow>

                <SectionRow label="Accent Colour" description="Primary highlight colour">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ background: appearance.accentColor }}
                    />
                    <input
                      type="color"
                      value={appearance.accentColor}
                      onChange={(e) =>
                        setAppearance((prev) => ({
                          ...prev,
                          accentColor: e.target.value,
                        }))
                      }
                      className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
                      aria-label="Accent colour"
                    />
                  </div>
                </SectionRow>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Preset Themes
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() =>
                        setAppearance((prev) => ({ ...prev, theme: theme.id }))
                      }
                      className={cn(
                        "relative rounded-xl p-3 border-2 transition-all duration-200 text-left",
                        appearance.theme === theme.id
                          ? "border-primary"
                          : "border-border hover:border-border/80"
                      )}
                      style={{ background: theme.vars.background }}
                    >
                      {/* Preview swatches */}
                      <div className="flex gap-1 mb-2">
                        {theme.preview.map((color, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full"
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: theme.vars.textPrimary }}
                      >
                        {theme.label}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: theme.vars.textSecondary }}
                      >
                        {theme.description}
                      </p>
                      {appearance.theme === theme.id && (
                        <span className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
                          <Check size={10} className="text-white" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── Notifications ─────────────────────────────────────────────── */}
          {activeSection === "notifications" && (
            <>
              <Card>
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  Notifications &amp; Routines
                </h2>

                <SectionRow
                  label="Reminder Lead Time"
                  description="How many minutes before a routine to be notified"
                >
                  <select
                    value={notifications.reminderMinutes}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        reminderMinutes: Number(e.target.value),
                      }))
                    }
                    className="bg-card border border-border text-text-primary text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {[5, 10, 15, 30, 60].map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </SectionRow>

                <SectionRow
                  label="Quiet Hours"
                  description="No notifications will be sent during this window"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={notifications.quietStart}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          quietStart: e.target.value,
                        }))
                      }
                      className="bg-card border border-border text-text-primary text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-text-secondary text-sm">to</span>
                    <input
                      type="time"
                      value={notifications.quietEnd}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          quietEnd: e.target.value,
                        }))
                      }
                      className="bg-card border border-border text-text-primary text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </SectionRow>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Modes with Notifications
                </h3>
                <p className="text-xs text-text-secondary mb-4">
                  Choose which modes will send you routine reminders
                </p>
                <div className="space-y-1">
                  {modes.map((mode) => (
                    <SectionRow key={mode.id} label={`${mode.icon}  ${mode.label}`}>
                      <Toggle
                        checked={notifications.enabledModes.includes(mode.id)}
                        onChange={() => toggleNotificationMode(mode.id)}
                        disabled={!mode.enabled}
                      />
                    </SectionRow>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── Account ───────────────────────────────────────────────────── */}
          {activeSection === "account" && (
            <>
              {isGuest && (
                <Card className="border-warning/30 bg-warning/5">
                  <p className="text-sm text-text-secondary">
                    You are browsing as a guest. Sign in to access account settings.
                  </p>
                </Card>
              )}

              <Card>
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  Profile
                </h2>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                    {account.avatarInitial}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {account.displayName || "—"}
                    </p>
                    <p className="text-xs text-text-secondary">{account.email || "—"}</p>
                  </div>
                </div>

                {/* Display name */}
                <div className="py-4 border-b border-border">
                  <p className="text-sm font-medium text-text-primary mb-2">
                    Display Name
                  </p>
                  {editingName ? (
                    <div className="flex gap-2">
                      <Input
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void handleSaveName()}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => void handleSaveName()}>
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingName(false); setNameInput(account.displayName); }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">
                        {account.displayName || "—"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isGuest}
                        onClick={() => setEditingName(true)}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="py-4 border-b border-border">
                  <p className="text-sm font-medium text-text-primary mb-2">
                    Email Address
                  </p>
                  {editingEmail ? (
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void handleSaveEmail()}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => void handleSaveEmail()}>
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingEmail(false); setEmailInput(account.email); }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">
                        {account.email || "—"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isGuest}
                        onClick={() => setEditingEmail(true)}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="py-4 border-b border-border">
                  <p className="text-sm font-medium text-text-primary mb-2">
                    Password
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">••••••••</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isGuest}
                      onClick={() => void handleChangePassword()}
                    >
                      Reset via email
                    </Button>
                  </div>
                </div>

                {/* Currency */}
                <div className="py-4">
                  <p className="text-sm font-medium text-text-primary mb-2">
                    Currency
                  </p>
                  <div className="flex items-center gap-3">
                    <select
                      value={currency}
                      onChange={(e) => {
                        setCurrency(e.target.value);
                        localStorage.setItem("settings_currency", e.target.value);
                      }}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-text-secondary">Used in Financial mode</span>
                  </div>
                </div>
              </Card>

              {/* Data */}
              <Card>
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  Data
                </h2>

                <SectionRow
                  label="Export All Data"
                  description="Download a JSON export of your Routinely settings"
                >
                  <Button variant="secondary" size="sm" onClick={handleExport}>
                    <Download size={14} />
                    Export
                  </Button>
                </SectionRow>
              </Card>

              {/* Danger zone */}
              <Card className="border-error/30">
                <h2 className="text-base font-semibold text-error mb-1">
                  Danger Zone
                </h2>
                <p className="text-xs text-text-secondary mb-4">
                  Irreversible and destructive actions
                </p>

                {!showDeleteConfirm ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={14} />
                    {isGuest ? "Clear All Data" : "Delete Account"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-text-secondary">
                      {isGuest
                        ? "This will clear all your local data and reset the app."
                        : "This will permanently delete your account and all associated data."}{" "}
                      Type{" "}
                      <span className="font-mono font-bold text-error">DELETE</span>{" "}
                      to confirm.
                    </p>
                    {deleteError && (
                      <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-xs text-error">
                        <AlertCircle size={14} />
                        <span>{deleteError}</span>
                      </div>
                    )}
                    <Input
                      placeholder='Type "DELETE" to confirm'
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={deleteInput !== "DELETE"}
                        onClick={() => void handleDeleteAccount()}
                      >
                        <Trash2 size={14} />
                        {isGuest ? "Clear & Reset" : "Permanently Delete"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); setDeleteError(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ── About ─────────────────────────────────────────────────────── */}
          {activeSection === "about" && (
            <Card>
              <h2 className="text-base font-semibold text-text-primary mb-6">
                About Routinely
              </h2>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-black text-primary">R</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-text-primary">Routinely</p>
                  <p className="text-sm text-text-secondary">
                    Your all-in-one routine management app
                  </p>
                </div>
              </div>

              <div className="space-y-0">
                <SectionRow label="Version">
                  <span className="text-sm font-mono text-text-secondary">1.0.0</span>
                </SectionRow>
                <SectionRow label="Build Date">
                  <span className="text-sm font-mono text-text-secondary">
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </SectionRow>
                <SectionRow label="Framework">
                  <span className="text-sm text-text-secondary">Next.js 16</span>
                </SectionRow>
                <SectionRow label="License">
                  <span className="text-sm text-text-secondary">MIT</span>
                </SectionRow>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm font-medium text-text-primary mb-3">Credits</p>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>
                    <span className="text-text-primary font-medium">Icons</span> —{" "}
                    <a
                      href="https://lucide.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Lucide React
                    </a>
                  </li>
                  <li>
                    <span className="text-text-primary font-medium">UI</span> —{" "}
                    Tailwind CSS v4
                  </li>
                  <li>
                    <span className="text-text-primary font-medium">Auth</span> —{" "}
                    Supabase Auth
                  </li>
                  <li>
                    <span className="text-text-primary font-medium">Database</span> —{" "}
                    Supabase + Dexie (offline-first)
                  </li>
                  <li>
                    <span className="text-text-primary font-medium">AI</span> —{" "}
                    Google Gemini
                  </li>
                  <li>
                    <span className="text-text-primary font-medium">Typography</span> —{" "}
                    Inter (Google Fonts)
                  </li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
