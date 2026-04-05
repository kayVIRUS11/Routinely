"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Briefcase,
  Dumbbell,
  DollarSign,
  LayoutGrid,
  Clock,
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
import { db, todayISO } from "@/db/db";

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

// ─── Live metrics types ───────────────────────────────────────────────────────

interface StudyLiveMetrics {
  tasksDue: number | null;
  streak: number | null;
  nextExam: string | null;
}

interface FinancialLiveMetrics {
  monthlySpend: number | null;
  budgetRemaining: number | null;
  nextBill: string | null;
  savingsPercent: number | null;
}

interface FitnessLiveMetrics {
  streak: number | null;
  todaysWorkout: string | null;
  lastSession: string | null;
}

interface ProfessionalLiveMetrics {
  deadlines: number | null;
  tasksInProgress: number | null;
  nextMeeting: string | null;
}

interface GeneralLiveMetrics {
  goals: number | null;
  habitsDoneToday: number | null;
  totalHabits: number | null;
  lastJournal: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Empty state helper ───────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-text-secondary italic">{text}</p>;
}

// ─── Metric display components ────────────────────────────────────────────────

function StudyMetricsCard({ metrics }: { metrics: StudyLiveMetrics }) {
  const hasData = metrics.tasksDue !== null || metrics.streak !== null || metrics.nextExam !== null;
  if (!hasData) return <EmptyState text="No study data yet" />;
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {metrics.tasksDue !== null && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Tasks due</p>
          <p className="text-lg font-bold text-text-primary">{metrics.tasksDue}</p>
        </div>
      )}
      {metrics.streak !== null && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Streak</p>
          <p className="text-lg font-bold text-text-primary flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-400" />{metrics.streak}d
          </p>
        </div>
      )}
      {metrics.nextExam && (
        <div className="col-span-2 bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Next exam</p>
          <p className="text-sm font-medium text-text-primary">{metrics.nextExam}</p>
        </div>
      )}
    </div>
  );
}

function FinancialMetricsCard({ metrics }: { metrics: FinancialLiveMetrics }) {
  const hasData =
    metrics.monthlySpend !== null ||
    metrics.budgetRemaining !== null ||
    metrics.nextBill !== null ||
    metrics.savingsPercent !== null;
  if (!hasData) return <EmptyState text="No financial data yet" />;
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {metrics.monthlySpend !== null && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Spent</p>
          <p className="text-lg font-bold text-text-primary">${metrics.monthlySpend.toFixed(0)}</p>
        </div>
      )}
      {metrics.budgetRemaining !== null && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Remaining</p>
          <p className="text-lg font-bold text-success">${metrics.budgetRemaining.toFixed(0)}</p>
        </div>
      )}
      {metrics.savingsPercent !== null && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Savings</p>
          <p className="text-lg font-bold text-text-primary flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-400" />{metrics.savingsPercent}%
          </p>
        </div>
      )}
      {metrics.nextBill && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Next bill</p>
          <p className="text-xs font-medium text-text-primary">{metrics.nextBill}</p>
        </div>
      )}
    </div>
  );
}

function FitnessMetricsCard({ metrics }: { metrics: FitnessLiveMetrics }) {
  const hasData = metrics.streak !== null || metrics.todaysWorkout || metrics.lastSession;
  if (!hasData) return <EmptyState text="No fitness data yet" />;
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {metrics.streak !== null && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Streak</p>
          <p className="text-lg font-bold text-text-primary flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-400" />{metrics.streak}d
          </p>
        </div>
      )}
      {metrics.todaysWorkout && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Today</p>
          <p className="text-sm font-medium text-text-primary">{metrics.todaysWorkout}</p>
        </div>
      )}
      {metrics.lastSession && (
        <div className="col-span-2 bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Last session</p>
          <p className="text-sm font-medium text-text-primary">{metrics.lastSession}</p>
        </div>
      )}
    </div>
  );
}

function ProfessionalMetricsCard({ metrics }: { metrics: ProfessionalLiveMetrics }) {
  const hasData = metrics.deadlines !== null || metrics.tasksInProgress !== null || metrics.nextMeeting;
  if (!hasData) return <EmptyState text="No professional data yet" />;
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {metrics.deadlines !== null && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Deadlines</p>
          <p className="text-lg font-bold text-warning">{metrics.deadlines}</p>
        </div>
      )}
      {metrics.tasksInProgress !== null && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">In progress</p>
          <p className="text-lg font-bold text-text-primary">{metrics.tasksInProgress}</p>
        </div>
      )}
      {metrics.nextMeeting && (
        <div className="col-span-2 bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Next meeting</p>
          <p className="text-sm font-medium text-text-primary">{metrics.nextMeeting}</p>
        </div>
      )}
    </div>
  );
}

function GeneralMetricsCard({ metrics }: { metrics: GeneralLiveMetrics }) {
  const hasData =
    metrics.goals !== null ||
    metrics.habitsDoneToday !== null ||
    metrics.lastJournal !== null;
  if (!hasData) return <EmptyState text="No general data yet" />;
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {metrics.goals !== null && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Goals</p>
          <p className="text-lg font-bold text-text-primary flex items-center gap-1">
            <Target className="w-4 h-4 text-yellow-400" />{metrics.goals}
          </p>
        </div>
      )}
      {metrics.habitsDoneToday !== null && metrics.totalHabits !== null && (
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Habits today</p>
          <p className="text-lg font-bold text-text-primary">{metrics.habitsDoneToday}/{metrics.totalHabits}</p>
        </div>
      )}
      {metrics.lastJournal && (
        <div className="col-span-2 bg-background/50 rounded-lg p-2">
          <p className="text-xs text-text-secondary">Last journal</p>
          <p className="text-xs font-medium text-text-primary">{metrics.lastJournal}</p>
        </div>
      )}
    </div>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [missedOpen, setMissedOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [todaySlots, setTodaySlots] = useState<(RoutineSlot & { source: string })[]>([]);
  const [conflicts, setConflicts] = useState<ConflictPair[]>([]);
  const [dismissedConflicts, setDismissedConflicts] = useState<string[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [characterName, setCharacterName] = useState<string>("");

  // Live metrics
  const [studyMetrics, setStudyMetrics] = useState<StudyLiveMetrics>({ tasksDue: null, streak: null, nextExam: null });
  const [financialMetrics, setFinancialMetrics] = useState<FinancialLiveMetrics>({ monthlySpend: null, budgetRemaining: null, nextBill: null, savingsPercent: null });
  const [fitnessMetrics, setFitnessMetrics] = useState<FitnessLiveMetrics>({ streak: null, todaysWorkout: null, lastSession: null });
  const [professionalMetrics, setProfessionalMetrics] = useState<ProfessionalLiveMetrics>({ deadlines: null, tasksInProgress: null, nextMeeting: null });
  const [generalMetrics, setGeneralMetrics] = useState<GeneralLiveMetrics>({ goals: null, habitsDoneToday: null, totalHabits: null, lastJournal: null });

  const loadMetrics = useCallback(async () => {
    const today = todayISO();

    try {
      // Study
      const studyTasksDue = await db.tasks
        .filter((t) => t.mode_id === "study" && !t.completed && !t.is_deleted && !!t.due_date && t.due_date <= today)
        .count();
      const nextExamRow = await db.exams
        .filter((e) => !e.is_deleted && e.exam_date >= today)
        .first();
      setStudyMetrics({
        tasksDue: studyTasksDue,
        streak: null, // streak calculation would require session history analysis
        nextExam: nextExamRow ? `${nextExamRow.title} – ${nextExamRow.exam_date}` : null,
      });

      // Financial — current month
      const monthStart = today.substring(0, 7); // "YYYY-MM"
      const [expenses, budgets, bills, savings] = await Promise.all([
        db.expense_entries.filter((e) => !e.is_deleted && e.date.startsWith(monthStart)).toArray(),
        db.budgets.filter((b) => !b.is_deleted).toArray(),
        db.bills.filter((b) => !b.is_paid && !b.is_deleted && b.due_date >= today).first(),
        db.savings_goals.filter((s) => !s.is_deleted).toArray(),
      ]);
      const monthlySpend = expenses.reduce((s, e) => s + e.amount, 0);
      const budgetLimit = budgets.reduce((s, b) => s + b.limit_amount, 0);
      const totalSaved = savings.reduce((s, g) => s + g.current_amount, 0);
      const totalSavingsTarget = savings.reduce((s, g) => s + g.target_amount, 0);
      setFinancialMetrics({
        monthlySpend: expenses.length > 0 ? monthlySpend : null,
        budgetRemaining: budgets.length > 0 ? Math.max(0, budgetLimit - monthlySpend) : null,
        nextBill: bills ? `${bills.title} – ${bills.due_date}` : null,
        savingsPercent: totalSavingsTarget > 0 ? Math.round((totalSaved / totalSavingsTarget) * 100) : null,
      });

      // Fitness
      const todayPlan = await db.workout_plans
        .filter((p) => !p.is_deleted && (p.scheduled_date === today || p.day_of_week === new Date().getDay()))
        .first();
      const lastLog = await db.workout_logs.filter((l) => !l.is_deleted).last();
      setFitnessMetrics({
        streak: null, // would need consecutive day analysis
        todaysWorkout: todayPlan ? todayPlan.title : null,
        lastSession: lastLog ? lastLog.log_date : null,
      });

      // Professional
      const [profDue, profInProgress, nextMeeting] = await Promise.all([
        db.tasks.filter((t) => t.mode_id === "professional" && !t.completed && !t.is_deleted && !!t.due_date && t.due_date <= today).count(),
        db.tasks.filter((t) => t.mode_id === "professional" && !t.completed && !t.is_deleted).count(),
        db.meeting_logs.filter((m) => !m.is_deleted && m.meeting_date >= today).first(),
      ]);
      setProfessionalMetrics({
        deadlines: profDue,
        tasksInProgress: profInProgress,
        nextMeeting: nextMeeting ? `${nextMeeting.title} – ${nextMeeting.meeting_date}` : null,
      });

      // General
      const [goals, habits, habitsLoggedToday, lastJournal] = await Promise.all([
        db.personal_goals.filter((g) => !g.completed && !g.is_deleted).count(),
        db.habits.filter((h) => !h.is_deleted).count(),
        db.habit_logs.where("logged_date").equals(today).filter((l) => !l.is_deleted).count(),
        db.journal_entries.filter((j) => !j.is_deleted).last(),
      ]);
      setGeneralMetrics({
        goals,
        habitsDoneToday: habits > 0 ? habitsLoggedToday : null,
        totalHabits: habits > 0 ? habits : null,
        lastJournal: lastJournal ? lastJournal.entry_date : null,
      });
    } catch {
      // Dexie not yet ready or SSR — leave null metrics (empty state shows)
    }
  }, []);

  useEffect(() => {
    const name = localStorage.getItem("onboarding_characterName") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCharacterName(name);

    const allSlots = loadAllRoutineSlots();
    const today = todayDayName();
    const todayFiltered = allSlots
      .filter((s) => s.day === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodaySlots(todayFiltered);

    const detected = detectConflicts(allSlots);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConflicts(detected);

    void loadMetrics();
  }, [loadMetrics]);

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const currentSlot = todaySlots.find((s) => {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    return nowMins >= start && nowMins < end;
  });
  const nextSlot = todaySlots.find((s) => timeToMinutes(s.startTime) > nowMins);

  const visibleConflicts = conflicts.filter((_, i) => !dismissedConflicts.includes(String(i)));

  const modeCards = [
    {
      type: "study",
      label: "Study",
      icon: BookOpen,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      metrics: <StudyMetricsCard metrics={studyMetrics} />,
    },
    {
      type: "financial",
      label: "Financial",
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-400/10",
      metrics: <FinancialMetricsCard metrics={financialMetrics} />,
    },
    {
      type: "fitness",
      label: "Fitness",
      icon: Dumbbell,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      metrics: <FitnessMetricsCard metrics={fitnessMetrics} />,
    },
    {
      type: "professional",
      label: "Professional",
      icon: Briefcase,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      metrics: <ProfessionalMetricsCard metrics={professionalMetrics} />,
    },
    {
      type: "general",
      label: "General",
      icon: LayoutGrid,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      metrics: <GeneralMetricsCard metrics={generalMetrics} />,
    },
  ];

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

      {/* Scheduling conflict alerts */}
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
          <div className="p-4 bg-card border border-border rounded-xl">
            <p className="text-sm text-text-secondary">No routine slots for today. Add some in your mode pages.</p>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
          Mode Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modeCards.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card key={mode.type} hover className="cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", mode.bg)}>
                    <Icon className={cn("w-5 h-5", mode.color)} />
                  </div>
                  <h3 className="font-semibold text-text-primary">{mode.label}</h3>
                </div>
                {mode.metrics}
              </Card>
            );
          })}
        </div>
      </section>

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
