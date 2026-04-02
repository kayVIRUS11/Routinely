"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Briefcase,
  Dumbbell,
  DollarSign,
  LayoutGrid,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  RefreshCw,
  X,
  TrendingUp,
  Flame,
  Target,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import { NaturalLanguageInput } from "@/components/ui/AIAssistant";

const mockModes = [
  {
    type: "study",
    label: "Study",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    metrics: { tasksDue: 3, hoursStudied: 12, nextExam: "Math - Jan 25", streak: 7 },
  },
  {
    type: "financial",
    label: "Financial",
    icon: DollarSign,
    color: "text-green-400",
    bg: "bg-green-400/10",
    metrics: { monthlySpend: 1240, budgetRemaining: 360, nextBill: "Netflix - Jan 18", savingsPercent: 22 },
  },
  {
    type: "fitness",
    label: "Fitness",
    icon: Dumbbell,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    metrics: { streak: 12, todaysWorkout: "Upper body", lastSession: "Yesterday" },
  },
  {
    type: "professional",
    label: "Professional",
    icon: Briefcase,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    metrics: { deadlines: 2, tasksInProgress: 5, nextMeeting: "Sprint review - 2pm" },
  },
  {
    type: "general",
    label: "General",
    icon: LayoutGrid,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    metrics: { goals: 4, habitStreaks: 3, todaysTasks: 6, lastJournal: "2 days ago" },
  },
];

const mockMissed = [
  { id: "1", title: "Evening run", time: "18:00", date: "Yesterday" },
  { id: "2", title: "Journal entry", time: "21:00", date: "Yesterday" },
];

interface RoutineSlot {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
  source?: string;
}

interface ConflictPair {
  a: RoutineSlot & { source: string };
  b: RoutineSlot & { source: string };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayDayName(): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()] ?? "Monday";
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function detectConflicts(slots: (RoutineSlot & { source: string })[]): ConflictPair[] {
  const conflicts: ConflictPair[] = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]!;
      const b = slots[j]!;
      if (a.day !== b.day) continue;
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      if (aStart < bEnd && aEnd > bStart) {
        conflicts.push({ a, b });
      }
    }
  }
  return conflicts;
}

function loadAllRoutineSlots(): (RoutineSlot & { source: string })[] {
  if (typeof window === "undefined") return [];
  const sources = [
    { key: "study_routine", label: "Study" },
    { key: "professional_routine", label: "Professional" },
    { key: "fitness_routine", label: "Fitness" },
    { key: "financial_routine", label: "Financial" },
    { key: "general_routine", label: "General" },
  ];
  const all: (RoutineSlot & { source: string })[] = [];
  for (const { key, label } of sources) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const slots = JSON.parse(raw) as RoutineSlot[];
        all.push(...slots.map((s) => ({ ...s, source: label })));
      }
    } catch { /* ignore */ }
  }
  return all;
}

function StudyMetrics({ metrics }: { metrics: { tasksDue: number; hoursStudied: number; nextExam: string; streak: number } }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Tasks due</p>
        <p className="text-lg font-bold text-text-primary">{metrics.tasksDue}</p>
      </div>
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Streak</p>
        <p className="text-lg font-bold text-text-primary flex items-center gap-1">
          <Flame className="w-4 h-4 text-orange-400" />{metrics.streak}d
        </p>
      </div>
      <div className="col-span-2 bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Next exam</p>
        <p className="text-sm font-medium text-text-primary">{metrics.nextExam}</p>
      </div>
    </div>
  );
}

function FinancialMetrics({ metrics }: { metrics: { monthlySpend: number; budgetRemaining: number; nextBill: string; savingsPercent: number } }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Spent</p>
        <p className="text-lg font-bold text-text-primary">${metrics.monthlySpend}</p>
      </div>
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Remaining</p>
        <p className="text-lg font-bold text-success">${metrics.budgetRemaining}</p>
      </div>
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Savings</p>
        <p className="text-lg font-bold text-text-primary flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-green-400" />{metrics.savingsPercent}%
        </p>
      </div>
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Next bill</p>
        <p className="text-xs font-medium text-text-primary">{metrics.nextBill}</p>
      </div>
    </div>
  );
}

function FitnessMetrics({ metrics }: { metrics: { streak: number; todaysWorkout: string; lastSession: string } }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Streak</p>
        <p className="text-lg font-bold text-text-primary flex items-center gap-1">
          <Flame className="w-4 h-4 text-orange-400" />{metrics.streak}d
        </p>
      </div>
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Today</p>
        <p className="text-sm font-medium text-text-primary">{metrics.todaysWorkout}</p>
      </div>
      <div className="col-span-2 bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Last session</p>
        <p className="text-sm font-medium text-text-primary">{metrics.lastSession}</p>
      </div>
    </div>
  );
}

function ProfessionalMetrics({ metrics }: { metrics: { deadlines: number; tasksInProgress: number; nextMeeting: string } }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Deadlines</p>
        <p className="text-lg font-bold text-warning">{metrics.deadlines}</p>
      </div>
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">In progress</p>
        <p className="text-lg font-bold text-text-primary">{metrics.tasksInProgress}</p>
      </div>
      <div className="col-span-2 bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Next meeting</p>
        <p className="text-sm font-medium text-text-primary">{metrics.nextMeeting}</p>
      </div>
    </div>
  );
}

function GeneralMetrics({ metrics }: { metrics: { goals: number; habitStreaks: number; todaysTasks: number; lastJournal: string } }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Goals</p>
        <p className="text-lg font-bold text-text-primary flex items-center gap-1">
          <Target className="w-4 h-4 text-yellow-400" />{metrics.goals}
        </p>
      </div>
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Habits</p>
        <p className="text-lg font-bold text-text-primary">{metrics.habitStreaks}</p>
      </div>
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Today tasks</p>
        <p className="text-lg font-bold text-text-primary">{metrics.todaysTasks}</p>
      </div>
      <div className="bg-background/50 rounded-lg p-2">
        <p className="text-xs text-text-secondary">Last journal</p>
        <p className="text-xs font-medium text-text-primary">{metrics.lastJournal}</p>
      </div>
    </div>
  );
}

function ModeMetrics({ type, metrics }: { type: string; metrics: Record<string, unknown> }) {
  switch (type) {
    case "study": return <StudyMetrics metrics={metrics as Parameters<typeof StudyMetrics>[0]["metrics"]} />;
    case "financial": return <FinancialMetrics metrics={metrics as Parameters<typeof FinancialMetrics>[0]["metrics"]} />;
    case "fitness": return <FitnessMetrics metrics={metrics as Parameters<typeof FitnessMetrics>[0]["metrics"]} />;
    case "professional": return <ProfessionalMetrics metrics={metrics as Parameters<typeof ProfessionalMetrics>[0]["metrics"]} />;
    case "general": return <GeneralMetrics metrics={metrics as Parameters<typeof GeneralMetrics>[0]["metrics"]} />;
    default: return null;
  }
}

export default function HomePage() {
  const [missedOpen, setMissedOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [todaySlots, setTodaySlots] = useState<(RoutineSlot & { source: string })[]>([]);
  const [conflicts, setConflicts] = useState<ConflictPair[]>([]);
  const [dismissedConflicts, setDismissedConflicts] = useState<string[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [characterName, setCharacterName] = useState<string>("");

  useEffect(() => {
    const name = localStorage.getItem("onboarding_characterName") ?? "";
    setCharacterName(name);

    const allSlots = loadAllRoutineSlots();
    const today = todayDayName();
    const todayFiltered = allSlots
      .filter((s) => s.day === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    setTodaySlots(todayFiltered);

    const detected = detectConflicts(allSlots);
    setConflicts(detected);
  }, []);

  const visibleMissed = mockMissed.filter((m) => !dismissed.includes(m.id) && !done.includes(m.id));
  const visibleConflicts = conflicts.filter((_, i) => !dismissedConflicts.includes(String(i)));

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const currentSlot = todaySlots.find((s) => {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    return nowMins >= start && nowMins < end;
  });
  const nextSlot = todaySlots.find((s) => timeToMinutes(s.startTime) > nowMins);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {getGreeting()}{characterName ? `, ${characterName}` : ""}
          </h1>
          <p className="text-text-secondary text-sm mt-1">Here is your overview for today</p>
        </div>
        <button
          onClick={() => setShowAI(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Ask AI
        </button>
      </div>

      {/* AI conflict alerts */}
      {visibleConflicts.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h2 className="text-sm font-medium text-warning">
              {visibleConflicts.length} Scheduling Conflict{visibleConflicts.length > 1 ? "s" : ""} Detected
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {visibleConflicts.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-warning/5 border border-warning/20 rounded-xl"
              >
                <div className="flex-1 text-sm">
                  <p className="text-text-primary font-medium">
                    <span className="text-warning">{c.a.source}:</span> {c.a.title} ({c.a.startTime}&#x2013;{c.a.endTime})
                    {" "}overlaps with{" "}
                    <span className="text-warning">{c.b.source}:</span> {c.b.title} ({c.b.startTime}&#x2013;{c.b.endTime})
                  </p>
                  <p className="text-text-secondary text-xs mt-0.5">{c.a.day}</p>
                </div>
                <button
                  onClick={() => setDismissedConflicts((prev) => [...prev, String(i)])}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Master routine strip */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
          Today&apos;s Routine
        </h2>
        {todaySlots.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {todaySlots.map((item) => {
              const isCurrent = currentSlot?.id === item.id;
              const isNext = nextSlot?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                    isCurrent
                      ? "border-primary bg-primary/10 min-w-[180px]"
                      : isNext
                      ? "border-warning/40 bg-warning/5 min-w-[160px]"
                      : "border-border bg-card min-w-[160px] opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isCurrent ? "bg-primary animate-pulse" : isNext ? "bg-warning" : "bg-border"
                  )} />
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium truncate", isCurrent ? "text-primary" : "text-text-primary")}>
                      {item.title}
                    </p>
                    <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {item.startTime} &#x2013; {item.endTime}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">{item.source}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { id: "1", title: "Morning workout", startTime: "06:30", endTime: "07:30", current: true },
              { id: "2", title: "Study session", startTime: "09:00", endTime: "11:00", current: false },
              { id: "3", title: "Lunch break", startTime: "12:00", endTime: "13:00", current: false },
              { id: "4", title: "Deep work", startTime: "14:00", endTime: "16:00", current: false },
            ].map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                  item.current
                    ? "border-primary bg-primary/10 min-w-[180px]"
                    : "border-border bg-card min-w-[160px] opacity-70"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", item.current ? "bg-primary animate-pulse" : "bg-border")} />
                <div>
                  <p className={cn("text-sm font-medium", item.current ? "text-primary" : "text-text-primary")}>
                    {item.title}
                  </p>
                  <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {item.startTime} &#x2013; {item.endTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
          Mode Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card key={mode.type} hover className="cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", mode.bg)}>
                    <Icon className={cn("w-5 h-5", mode.color)} />
                  </div>
                  <h3 className="font-semibold text-text-primary">{mode.label}</h3>
                </div>
                <ModeMetrics type={mode.type} metrics={mode.metrics as Record<string, unknown>} />
              </Card>
            );
          })}
        </div>
      </section>

      {visibleMissed.length > 0 && (
        <section>
          <button
            onClick={() => setMissedOpen(!missedOpen)}
            className="flex items-center gap-2 text-sm font-medium text-warning mb-3 hover:text-warning/80 transition-colors"
          >
            {missedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {visibleMissed.length} missed routine{visibleMissed.length > 1 ? "s" : ""}
          </button>

          {missedOpen && (
            <div className="flex flex-col gap-2 animate-fade-in">
              {visibleMissed.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-card border border-warning/20 rounded-xl"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{item.title}</p>
                    <p className="text-xs text-text-secondary">
                      {item.date} at {item.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDone([...done, item.id])}
                      className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors"
                      title="Mark done"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Reschedule"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDismissed([...dismissed, item.id])}
                      className="p-1.5 text-text-secondary hover:bg-card rounded-lg transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {showAI && (
        <NaturalLanguageInput
          onClose={() => setShowAI(false)}
          placeholder="Ask me to add tasks, log expenses, create routines, or anything else!"
          context={{ page: "home", todaySlots }}
        />
      )}
    </div>
  );
}
