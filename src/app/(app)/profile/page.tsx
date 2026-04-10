"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Shield,
  Award,
  Trophy,
  User,
  Zap,
  Target,
  Flame,
  Lock,
  Check,
  ChevronRight,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/db";
import { levelFromXP, xpThresholdsForLevel } from "@/lib/xp";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stat {
  name: string;
  key: string;
  value: number;
  color: string;
  description: string;
}

interface Skill {
  name: string;
  description: string;
  unlocked: boolean;
}

interface ModeSkillTree {
  mode: string;
  icon: React.ReactNode;
  color: string;
  skills: Skill[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_TITLES = [
  { minLevel: 1, maxLevel: 5, title: "The Focused Scholar" },
  { minLevel: 6, maxLevel: 10, title: "The Disciplined One" },
  { minLevel: 11, maxLevel: 20, title: "The Life Architect" },
  { minLevel: 21, maxLevel: Infinity, title: "The Balanced One" },
];

const AVATAR_COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Orange", value: "#f97316" },
];

const RARITY_STYLES: Record<Achievement["rarity"], string> = {
  common: "border-border",
  rare: "border-blue-500/50",
  epic: "border-purple-500/50",
  legendary: "border-amber-500/50",
};

const RARITY_LABEL: Record<Achievement["rarity"], string> = {
  common: "text-text-secondary",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLevelTitle(level: number): string {
  const entry = LEVEL_TITLES.find((t) => level >= t.minLevel && level <= t.maxLevel);
  return entry?.title ?? "The Balanced One";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function XpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min(100, Math.round((current / max) * 100));
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-text-secondary mb-1">
        <span>{current} XP</span>
        <span>{max} XP</span>
      </div>
      <div className="h-3 bg-background rounded-full overflow-hidden border border-border">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-text-secondary mt-1 text-right">{pct}% to next level</p>
    </div>
  );
}

function StatBar({ stat }: { stat: Stat }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{stat.name}</span>
          <span className="text-xs text-text-secondary">{stat.description}</span>
        </div>
        <span className="text-sm font-bold" style={{ color: stat.color }}>
          {stat.value}
        </span>
      </div>
      <div className="h-2.5 bg-background rounded-full overflow-hidden border border-border">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${stat.value}%`, backgroundColor: stat.color }}
        />
      </div>
    </div>
  );
}

function SkillNode({ skill }: { skill: Skill }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        skill.unlocked
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card opacity-50"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
          skill.unlocked ? "bg-primary" : "bg-border"
        )}
      >
        {skill.unlocked ? (
          <Check className="w-3 h-3 text-white" />
        ) : (
          <Lock className="w-3 h-3 text-text-secondary" />
        )}
      </div>
      <div>
        <p className={cn("text-sm font-medium", skill.unlocked ? "text-text-primary" : "text-text-secondary")}>
          {skill.name}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">{skill.description}</p>
      </div>
    </div>
  );
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all",
        achievement.unlocked ? RARITY_STYLES[achievement.rarity] : "border-border opacity-40",
        achievement.unlocked && "bg-card"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          achievement.unlocked ? "bg-primary/10" : "bg-border/30"
        )}
      >
        {achievement.icon}
      </div>
      <div>
        <p className={cn("text-xs font-semibold", achievement.unlocked ? "text-text-primary" : "text-text-secondary")}>
          {achievement.name}
        </p>
        <p className="text-xs text-text-secondary mt-0.5 leading-snug">{achievement.description}</p>
        {achievement.unlocked && (
          <span className={cn("text-xs font-medium capitalize mt-1 inline-block", RARITY_LABEL[achievement.rarity])}>
            {achievement.rarity}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [tab, setTab] = useState<"overview" | "stats" | "skills" | "achievements">("overview");
  const [characterName, setCharacterName] = useState("Hero");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [userXp, setUserXp] = useState(0);
  const { user, isGuest } = useAuth();

  // Compute level and XP info from real data
  const level = levelFromXP(userXp);
  const { levelStart, levelEnd } = xpThresholdsForLevel(userXp);
  const currentXp = userXp - levelStart;
  const maxXp = levelEnd - levelStart;
  const title = getLevelTitle(level);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prefer auth user's full name, then onboarding localStorage, then fallback
    const authName = user?.user_metadata?.full_name as string | undefined;
    const storedName = localStorage.getItem("onboarding_characterName");
    setCharacterName(authName ?? storedName ?? (isGuest ? "Guest" : "Hero"));

    const storedColor = localStorage.getItem("profile_avatarColor");
    if (storedColor) setAvatarColor(storedColor);

    // Load XP from db.users
    const loadXp = async () => {
      try {
        const userId = user?.id ?? localStorage.getItem("routinely_guest_user_id");
        if (!userId) return;
        const dbUser = await db.users.where("user_id").equals(userId).first();
        if (dbUser) setUserXp(dbUser.xp ?? 0);
      } catch { /* IndexedDB not available */ }
    };
    void loadXp();
  }, [user, isGuest]);

  function handleColorSelect(color: string) {
    setAvatarColor(color);
    localStorage.setItem("profile_avatarColor", color);
    setShowColorPicker(false);
  }

  const stats: Stat[] = [
    { name: "Focus", key: "focus", value: 62, color: "#6366f1", description: "fed by Study" },
    { name: "Drive", key: "drive", value: 48, color: "#3b82f6", description: "fed by Professional" },
    { name: "Vitality", key: "vitality", value: 71, color: "#22c55e", description: "fed by Fitness" },
    { name: "Wealth", key: "wealth", value: 35, color: "#f59e0b", description: "fed by Financial" },
    { name: "Balance", key: "balance", value: 55, color: "#8b5cf6", description: "fed by General" },
  ];

  const skillTrees: ModeSkillTree[] = [
    {
      mode: "Study",
      icon: <Star className="w-4 h-4" />,
      color: "#6366f1",
      skills: [
        { name: "Consistent", description: "Study at least 5 days a week for a month", unlocked: true },
        { name: "Night Owl", description: "Log a study session after 10 PM", unlocked: true },
        { name: "Exam Crusher", description: "Complete 5 exam prep sessions", unlocked: false },
        { name: "Speed Reader", description: "Finish a reading plan ahead of schedule", unlocked: false },
        { name: "Deep Diver", description: "Log a single session of 3+ hours", unlocked: false },
      ],
    },
    {
      mode: "Professional",
      icon: <Shield className="w-4 h-4" />,
      color: "#3b82f6",
      skills: [
        { name: "Deadline Keeper", description: "Complete 10 tasks before their due date", unlocked: true },
        { name: "Deep Worker", description: "Log 20+ hours of focused work sessions", unlocked: false },
        { name: "Project Finisher", description: "Mark a full project complete", unlocked: false },
      ],
    },
    {
      mode: "Fitness",
      icon: <Flame className="w-4 h-4" />,
      color: "#22c55e",
      skills: [
        { name: "Iron Streak", description: "Work out 7 days in a row", unlocked: true },
        { name: "Heavy Lifter", description: "Log 30 strength sessions", unlocked: true },
        { name: "Rest Day Respector", description: "Schedule and honour 8 rest days", unlocked: false },
        { name: "Early Bird", description: "Log 10 workouts before 7 AM", unlocked: false },
      ],
    },
    {
      mode: "Financial",
      icon: <Target className="w-4 h-4" />,
      color: "#f59e0b",
      skills: [
        { name: "Budget Master", description: "Stay under budget for a full month", unlocked: false },
        { name: "Saver", description: "Reach a savings milestone", unlocked: false },
        { name: "Zero Waste", description: "No unnecessary expenses for 2 weeks", unlocked: false },
        { name: "Bill Slayer", description: "Pay all bills on time for 3 months", unlocked: false },
      ],
    },
    {
      mode: "General",
      icon: <Zap className="w-4 h-4" />,
      color: "#8b5cf6",
      skills: [
        { name: "Goal Getter", description: "Complete a personal goal", unlocked: true },
        { name: "Habit Hero", description: "Maintain a habit for 21 days straight", unlocked: false },
        { name: "Journal Keeper", description: "Log reflections 10 days in a row", unlocked: false },
      ],
    },
  ];

  const achievements: Achievement[] = [
    {
      id: "first_step",
      name: "First Step",
      description: "Completed onboarding",
      icon: <Check className="w-6 h-6 text-primary" />,
      unlocked: true,
      rarity: "common",
    },
    {
      id: "week_warrior",
      name: "Week Warrior",
      description: "Stuck to a full week of routines",
      icon: <Flame className="w-6 h-6 text-orange-400" />,
      unlocked: true,
      rarity: "common",
    },
    {
      id: "multi_mode",
      name: "Multi-Mode",
      description: "Activated 3 or more modes",
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      unlocked: true,
      rarity: "rare",
    },
    {
      id: "pomodoro_pro",
      name: "Pomodoro Pro",
      description: "Completed 50 Pomodoro sessions",
      icon: <Target className="w-6 h-6 text-red-400" />,
      unlocked: false,
      rarity: "rare",
    },
    {
      id: "life_architect",
      name: "Life Architect",
      description: "Had all 5 built-in modes active simultaneously",
      icon: <Shield className="w-6 h-6 text-purple-400" />,
      unlocked: false,
      rarity: "epic",
    },
    {
      id: "debt_free",
      name: "Debt-Free Mindset",
      description: "Stayed under budget for 3 months straight",
      icon: <Trophy className="w-6 h-6 text-green-400" />,
      unlocked: false,
      rarity: "epic",
    },
    {
      id: "scholar",
      name: "Scholar",
      description: "Studied every day for 30 days",
      icon: <Star className="w-6 h-6 text-indigo-400" />,
      unlocked: false,
      rarity: "epic",
    },
    {
      id: "iron_will",
      name: "Iron Will",
      description: "Maintained active streak in every active mode simultaneously",
      icon: <Award className="w-6 h-6 text-amber-400" />,
      unlocked: false,
      rarity: "legendary",
    },
    {
      id: "goal_getter",
      name: "Goal Getter",
      description: "Completed a personal goal in General mode",
      icon: <ChevronRight className="w-6 h-6 text-teal-400" />,
      unlocked: true,
      rarity: "common",
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "stats", label: "Stats" },
    { key: "skills", label: "Skills" },
    { key: "achievements", label: "Achievements" },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Profile</h1>
        <p className="text-text-secondary text-sm">Your RPG character &amp; progression</p>
      </div>

      {/* Character Card */}
      <Card className="relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowColorPicker((v) => !v)}
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
              style={{ backgroundColor: avatarColor }}
              title="Change avatar colour"
            >
              <User className="w-10 h-10" />
            </button>
            {showColorPicker && (
              <div className="absolute left-0 top-22 z-20 bg-card border border-border rounded-xl p-3 shadow-xl mt-2 min-w-[180px]">
                <p className="text-xs text-text-secondary mb-2">Pick avatar colour</p>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleColorSelect(c.value)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                        avatarColor === c.value ? "border-white scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{characterName}</h2>
              <p className="text-sm text-primary font-medium">{title}</p>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                Level {level}
              </span>
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                {userXp} total XP
              </span>
            </div>
            <XpBar current={currentXp} max={maxXp} />
          </div>

          {/* Quick stats */}
          <div className="flex sm:flex-col gap-4 sm:gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-text-primary">{unlockedCount}</p>
              <p className="text-xs text-text-secondary">Achievements</p>
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">
                {skillTrees.reduce((acc, t) => acc + t.skills.filter((s) => s.unlocked).length, 0)}
              </p>
              <p className="text-xs text-text-secondary">Skills</p>
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">
                {Math.round(stats.reduce((a, s) => a + s.value, 0) / stats.length)}
              </p>
              <p className="text-xs text-text-secondary">Avg Stat</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-text-primary hover:bg-background"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> XP Sources
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Task Completion", xp: "+10 XP per task", icon: <Check className="w-4 h-4 text-green-400" /> },
                { label: "Streak Bonus", xp: "+5 XP/day streak", icon: <Flame className="w-4 h-4 text-orange-400" /> },
                { label: "Goal Achieved", xp: "+50 XP per goal", icon: <Target className="w-4 h-4 text-blue-400" /> },
                { label: "Achievement Unlocked", xp: "+25–100 XP", icon: <Trophy className="w-4 h-4 text-amber-400" /> },
              ].map((src) => (
                <div key={src.label} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                  {src.icon}
                  <div>
                    <p className="text-sm font-medium text-text-primary">{src.label}</p>
                    <p className="text-xs text-text-secondary">{src.xp}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Level Titles
            </h3>
            <div className="space-y-2">
              {LEVEL_TITLES.map((t) => (
                <div
                  key={t.title}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    level >= t.minLevel && level <= t.maxLevel
                      ? "border-primary/50 bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t.title}</p>
                    <p className="text-xs text-text-secondary">
                      Level {t.minLevel}
                      {t.maxLevel === Infinity ? "+" : `–${t.maxLevel}`}
                    </p>
                  </div>
                  {level >= t.minLevel && level <= t.maxLevel && (
                    <span className="text-xs text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Stats */}
      {tab === "stats" && (
        <Card>
          <h3 className="text-base font-semibold text-text-primary mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Master Character Stats
          </h3>
          <p className="text-xs text-text-secondary mb-5">Each stat is levelled by using the corresponding mode.</p>
          <div className="space-y-5">
            {stats.map((stat) => (
              <StatBar key={stat.key} stat={stat} />
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Skills */}
      {tab === "skills" && (
        <div className="space-y-4">
          {skillTrees.map((tree) => {
            const unlocked = tree.skills.filter((s) => s.unlocked).length;
            return (
              <Card key={tree.mode}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: tree.color }}
                    >
                      {tree.icon}
                    </span>
                    <h3 className="text-base font-semibold text-text-primary">{tree.mode} Mode</h3>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {unlocked}/{tree.skills.length} unlocked
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tree.skills.map((skill) => (
                    <SkillNode key={skill.name} skill={skill} />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab: Achievements */}
      {tab === "achievements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {unlockedCount} of {achievements.length} unlocked
            </p>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              {(["common", "rare", "epic", "legendary"] as Achievement["rarity"][]).map((r) => (
                <span key={r} className={cn("capitalize font-medium", RARITY_LABEL[r])}>
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((a) => (
              <AchievementBadge key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
