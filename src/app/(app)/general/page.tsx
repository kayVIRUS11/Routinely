"use client";

import { useState, useEffect } from "react";
import {
  LayoutGrid,
  Target,
  Flame,
  Check,
  Plus,
  X,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Goal {
  id: string;
  title: string;
  description: string;
  type: "short-term" | "long-term";
  progress: number;
}

interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly";
  completedDates: string[];
}

interface Task {
  id: string;
  date: string;
  title: string;
  completed: boolean;
}

interface JournalEntry {
  id: string;
  date: string;
  content: string;
}

interface RoutineSlot {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type GeneralTab = "overview" | "goals" | "habits" | "tasks" | "journal" | "routine";

const TABS: { id: GeneralTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "goals", label: "Goals" },
  { id: "habits", label: "Habits" },
  { id: "tasks", label: "Tasks" },
  { id: "journal", label: "Journal" },
  { id: "routine", label: "Routine" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadLS<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function saveLS<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function calcStreak(completedDates: string[]): number {
  const dateSet = new Set(completedDates);
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (true) {
    const ds = d.toISOString().slice(0, 10);
    if (!dateSet.has(ds)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon: React.ElementType;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Icon className="w-10 h-10 text-text-secondary/40" />
      <p className="text-text-secondary text-sm">{message}</p>
      {action}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-text-secondary font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-text-secondary font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {children}
      </select>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-border rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ─── Default form values ──────────────────────────────────────────────────────

const defaultGoalForm = () => ({
  title: "",
  description: "",
  type: "short-term" as Goal["type"],
  progress: 0,
});

const defaultHabitForm = () => ({
  title: "",
  frequency: "daily" as Habit["frequency"],
});

const defaultTaskForm = () => ({
  title: "",
  date: todayStr(),
});

const defaultRoutineForm = () => ({
  title: "",
  day: "Monday",
  startTime: "08:00",
  endTime: "09:00",
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GeneralPage() {
  const [activeTab, setActiveTab] = useState<GeneralTab>("overview");

  // ── Data state ──────────────────────────────────────────────────────────────
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [routineSlots, setRoutineSlots] = useState<RoutineSlot[]>([]);

  useEffect(() => {
    setGoals(loadLS<Goal>("general_goals"));
    setHabits(loadLS<Habit>("general_habits"));
    setTasks(loadLS<Task>("general_tasks"));
    setJournal(loadLS<JournalEntry>("general_journal"));
    setRoutineSlots(loadLS<RoutineSlot>("general_routine"));
  }, []);

  // ── Persist helpers ──────────────────────────────────────────────────────────
  const saveGoals = (v: Goal[]) => { setGoals(v); saveLS("general_goals", v); };
  const saveHabits = (v: Habit[]) => { setHabits(v); saveLS("general_habits", v); };
  const saveTasks = (v: Task[]) => { setTasks(v); saveLS("general_tasks", v); };
  const saveJournal = (v: JournalEntry[]) => { setJournal(v); saveLS("general_journal", v); };
  const saveRoutine = (v: RoutineSlot[]) => { setRoutineSlots(v); saveLS("general_routine", v); };

  // ── Summary stats ────────────────────────────────────────────────────────────
  const today = todayStr();
  const activeGoals = goals.length;
  const topStreak = habits.reduce((best, h) => Math.max(best, calcStreak(h.completedDates)), 0);
  const todayTasks = tasks.filter((t) => t.date === today);
  const todayTasksDone = todayTasks.filter((t) => t.completed).length;
  const lastJournal = [...journal].sort((a, b) => b.date.localeCompare(a.date))[0];

  // ── Goal modal state ─────────────────────────────────────────────────────────
  const [showGoal, setShowGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalForm, setGoalForm] = useState(defaultGoalForm());

  const openAddGoal = () => { setGoalForm(defaultGoalForm()); setEditingGoal(null); setShowGoal(true); };
  const openEditGoal = (g: Goal) => {
    setGoalForm({ title: g.title, description: g.description, type: g.type, progress: g.progress });
    setEditingGoal(g);
    setShowGoal(true);
  };
  const saveGoalForm = () => {
    if (!goalForm.title.trim()) return;
    if (editingGoal) {
      saveGoals(goals.map((g) => (g.id === editingGoal.id ? { ...g, ...goalForm } : g)));
    } else {
      saveGoals([...goals, { id: uid(), ...goalForm }]);
    }
    setShowGoal(false);
  };
  const deleteGoal = (id: string) => saveGoals(goals.filter((g) => g.id !== id));

  // ── Habit modal state ────────────────────────────────────────────────────────
  const [showHabit, setShowHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitForm, setHabitForm] = useState(defaultHabitForm());

  const openAddHabit = () => { setHabitForm(defaultHabitForm()); setEditingHabit(null); setShowHabit(true); };
  const openEditHabit = (h: Habit) => {
    setHabitForm({ title: h.title, frequency: h.frequency });
    setEditingHabit(h);
    setShowHabit(true);
  };
  const saveHabitForm = () => {
    if (!habitForm.title.trim()) return;
    if (editingHabit) {
      saveHabits(habits.map((h) => (h.id === editingHabit.id ? { ...h, ...habitForm } : h)));
    } else {
      saveHabits([...habits, { id: uid(), ...habitForm, completedDates: [] }]);
    }
    setShowHabit(false);
  };
  const deleteHabit = (id: string) => saveHabits(habits.filter((h) => h.id !== id));
  const toggleHabitToday = (id: string) => {
    saveHabits(habits.map((h) => {
      if (h.id !== id) return h;
      const already = h.completedDates.includes(today);
      return {
        ...h,
        completedDates: already
          ? h.completedDates.filter((d) => d !== today)
          : [...h.completedDates, today],
      };
    }));
  };

  // ── Task modal state ─────────────────────────────────────────────────────────
  const [showTask, setShowTask] = useState(false);
  const [taskForm, setTaskForm] = useState(defaultTaskForm());
  const [taskDateFilter, setTaskDateFilter] = useState(todayStr());

  const openAddTask = () => { setTaskForm(defaultTaskForm()); setShowTask(true); };
  const saveTaskForm = () => {
    if (!taskForm.title.trim()) return;
    saveTasks([...tasks, { id: uid(), title: taskForm.title, date: taskForm.date, completed: false }]);
    setShowTask(false);
  };
  const toggleTask = (id: string) => {
    saveTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };
  const deleteTask = (id: string) => saveTasks(tasks.filter((t) => t.id !== id));

  // ── Journal state ────────────────────────────────────────────────────────────
  const [journalDate, setJournalDate] = useState(todayStr());
  const [journalContent, setJournalContent] = useState("");
  const [journalEditing, setJournalEditing] = useState(false);

  useEffect(() => {
    const entry = journal.find((e) => e.date === journalDate);
    setJournalContent(entry?.content ?? "");
    setJournalEditing(false);
  }, [journalDate, journal]);

  const saveJournalEntry = () => {
    if (!journalContent.trim()) return;
    const existing = journal.find((e) => e.date === journalDate);
    if (existing) {
      saveJournal(journal.map((e) => (e.date === journalDate ? { ...e, content: journalContent } : e)));
    } else {
      saveJournal([...journal, { id: uid(), date: journalDate, content: journalContent }]);
    }
    setJournalEditing(false);
  };
  const deleteJournalEntry = () => {
    saveJournal(journal.filter((e) => e.date !== journalDate));
    setJournalContent("");
  };

  // ── Routine modal state ──────────────────────────────────────────────────────
  const [showRoutine, setShowRoutine] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineSlot | null>(null);
  const [routineForm, setRoutineForm] = useState(defaultRoutineForm());

  const openAddRoutine = () => { setRoutineForm(defaultRoutineForm()); setEditingRoutine(null); setShowRoutine(true); };
  const openEditRoutine = (r: RoutineSlot) => {
    setRoutineForm({ title: r.title, day: r.day, startTime: r.startTime, endTime: r.endTime });
    setEditingRoutine(r);
    setShowRoutine(true);
  };
  const saveRoutineForm = () => {
    if (!routineForm.title.trim()) return;
    if (editingRoutine) {
      saveRoutine(routineSlots.map((r) => (r.id === editingRoutine.id ? { ...r, ...routineForm } : r)));
    } else {
      saveRoutine([...routineSlots, { id: uid(), ...routineForm }]);
    }
    setShowRoutine(false);
  };
  const deleteRoutineSlot = (id: string) => saveRoutine(routineSlots.filter((r) => r.id !== id));

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">General</h1>
      <p className="text-text-secondary mb-6">Personal goals, habits, tasks & journal</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200",
              activeTab === tab.id
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-text-primary hover:bg-card"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview ──────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Target className="w-4 h-4" /> Active Goals
              </div>
              <span className="text-2xl font-bold text-text-primary">{activeGoals}</span>
            </Card>
            <Card className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Flame className="w-4 h-4" /> Top Streak
              </div>
              <span className="text-2xl font-bold text-text-primary">{topStreak}d</span>
            </Card>
            <Card className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Check className="w-4 h-4" /> Today&apos;s Tasks
              </div>
              <span className="text-2xl font-bold text-text-primary">
                {todayTasksDone}/{todayTasks.length}
              </span>
            </Card>
            <Card className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <BookOpen className="w-4 h-4" /> Last Journal
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {lastJournal ? lastJournal.date : "—"}
              </span>
            </Card>
          </div>

          {/* Today's habits */}
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-warning" /> Today&apos;s Habits
            </h2>
            {habits.length === 0 ? (
              <p className="text-text-secondary text-sm">No habits yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {habits.map((h) => {
                  const done = h.completedDates.includes(today);
                  return (
                    <div key={h.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleHabitToday(h.id)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                            done ? "bg-success border-success" : "border-border"
                          )}
                        >
                          {done && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className={cn("text-sm", done && "line-through text-text-secondary")}>
                          {h.title}
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary flex items-center gap-1">
                        <Flame className="w-3 h-3" /> {calcStreak(h.completedDates)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Active goals overview */}
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Goals Progress
            </h2>
            {goals.length === 0 ? (
              <p className="text-text-secondary text-sm">No goals yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {goals.map((g) => (
                  <div key={g.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-primary font-medium">{g.title}</span>
                      <span className="text-text-secondary">{g.progress}%</span>
                    </div>
                    <ProgressBar value={g.progress} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Goals ─────────────────────────────────────────────────────────────── */}
      {activeTab === "goals" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={openAddGoal} size="sm">
              <Plus className="w-4 h-4" /> Add Goal
            </Button>
          </div>
          {goals.length === 0 ? (
            <EmptyState
              icon={Target}
              message="No goals yet. Add your first goal!"
              action={
                <Button onClick={openAddGoal} size="sm">
                  <Plus className="w-4 h-4" /> Add Goal
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {goals.map((g) => (
                <Card key={g.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-text-primary">{g.title}</span>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            g.type === "long-term"
                              ? "bg-primary/10 text-primary"
                              : "bg-success/10 text-success"
                          )}
                        >
                          {g.type === "long-term" ? "Long-term" : "Short-term"}
                        </span>
                      </div>
                      {g.description && (
                        <p className="text-text-secondary text-sm mb-2">{g.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <ProgressBar value={g.progress} />
                        <span className="text-xs text-text-secondary whitespace-nowrap">{g.progress}%</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => openEditGoal(g)}
                        className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteGoal(g.id)}
                        className="p-1.5 text-text-secondary hover:text-error transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {showGoal && (
            <Modal title={editingGoal ? "Edit Goal" : "Add Goal"} onClose={() => setShowGoal(false)}>
              <div className="flex flex-col gap-4">
                <Input
                  label="Title"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="Goal title"
                />
                <TextareaField
                  label="Description"
                  value={goalForm.description}
                  onChange={(v) => setGoalForm({ ...goalForm, description: v })}
                  placeholder="Optional description"
                  rows={2}
                />
                <SelectField
                  label="Type"
                  value={goalForm.type}
                  onChange={(v) => setGoalForm({ ...goalForm, type: v as Goal["type"] })}
                >
                  <option value="short-term">Short-term</option>
                  <option value="long-term">Long-term</option>
                </SelectField>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-text-secondary font-medium">
                    Progress: {goalForm.progress}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={goalForm.progress}
                    onChange={(e) => setGoalForm({ ...goalForm, progress: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setShowGoal(false)}>Cancel</Button>
                  <Button onClick={saveGoalForm}>Save</Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ── Habits ────────────────────────────────────────────────────────────── */}
      {activeTab === "habits" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={openAddHabit} size="sm">
              <Plus className="w-4 h-4" /> Add Habit
            </Button>
          </div>
          {habits.length === 0 ? (
            <EmptyState
              icon={Flame}
              message="No habits yet. Start building a streak!"
              action={
                <Button onClick={openAddHabit} size="sm">
                  <Plus className="w-4 h-4" /> Add Habit
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {habits.map((h) => {
                const done = h.completedDates.includes(today);
                const streak = calcStreak(h.completedDates);
                return (
                  <Card key={h.id}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleHabitToday(h.id)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                          done ? "bg-success border-success" : "border-border hover:border-success"
                        )}
                      >
                        {done && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-medium text-text-primary", done && "line-through text-text-secondary")}>
                            {h.title}
                          </span>
                          <span className="text-xs text-text-secondary capitalize bg-card border border-border px-2 py-0.5 rounded-full">
                            {h.frequency}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-warning">
                          <Flame className="w-3 h-3" />
                          <span>{streak} day streak</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => openEditHabit(h)}
                          className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteHabit(h.id)}
                          className="p-1.5 text-text-secondary hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Last 7 days completion dots */}
                    <div className="flex gap-1.5 mt-3 pl-11">
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        const ds = d.toISOString().slice(0, 10);
                        return (
                          <div
                            key={ds}
                            title={ds}
                            className={cn(
                              "w-5 h-5 rounded-full",
                              h.completedDates.includes(ds) ? "bg-success" : "bg-border"
                            )}
                          />
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {showHabit && (
            <Modal title={editingHabit ? "Edit Habit" : "Add Habit"} onClose={() => setShowHabit(false)}>
              <div className="flex flex-col gap-4">
                <Input
                  label="Habit name"
                  value={habitForm.title}
                  onChange={(e) => setHabitForm({ ...habitForm, title: e.target.value })}
                  placeholder="e.g. Morning run"
                />
                <SelectField
                  label="Frequency"
                  value={habitForm.frequency}
                  onChange={(v) => setHabitForm({ ...habitForm, frequency: v as Habit["frequency"] })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </SelectField>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setShowHabit(false)}>Cancel</Button>
                  <Button onClick={saveHabitForm}>Save</Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ── Tasks ─────────────────────────────────────────────────────────────── */}
      {activeTab === "tasks" && (
        <div>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <Input
              type="date"
              value={taskDateFilter}
              onChange={(e) => setTaskDateFilter(e.target.value)}
              className="w-auto"
            />
            <Button onClick={openAddTask} size="sm">
              <Plus className="w-4 h-4" /> Add Task
            </Button>
          </div>
          {(() => {
            const filtered = tasks.filter((t) => t.date === taskDateFilter);
            if (filtered.length === 0) {
              return (
                <EmptyState
                  icon={Check}
                  message="No tasks for this day."
                  action={
                    <Button onClick={openAddTask} size="sm">
                      <Plus className="w-4 h-4" /> Add Task
                    </Button>
                  }
                />
              );
            }
            const pending = filtered.filter((t) => !t.completed);
            const done = filtered.filter((t) => t.completed);
            return (
              <div className="flex flex-col gap-2">
                {[...pending, ...done].map((t) => (
                  <Card key={t.id} className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                        t.completed ? "bg-success border-success" : "border-border hover:border-success"
                      )}
                    >
                      {t.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm text-text-primary",
                        t.completed && "line-through text-text-secondary"
                      )}
                    >
                      {t.title}
                    </span>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="p-1.5 text-text-secondary hover:text-error transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Card>
                ))}
              </div>
            );
          })()}

          {showTask && (
            <Modal title="Add Task" onClose={() => setShowTask(false)}>
              <div className="flex flex-col gap-4">
                <Input
                  label="Task"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="What needs to be done?"
                />
                <Input
                  label="Date"
                  type="date"
                  value={taskForm.date}
                  onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setShowTask(false)}>Cancel</Button>
                  <Button onClick={saveTaskForm}>Add</Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ── Journal ───────────────────────────────────────────────────────────── */}
      {activeTab === "journal" && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Input
              type="date"
              value={journalDate}
              onChange={(e) => setJournalDate(e.target.value)}
              className="w-auto"
            />
            {journal.length > 0 && (
              <span className="text-xs text-text-secondary">
                {journal.length} {journal.length === 1 ? "entry" : "entries"} total
              </span>
            )}
          </div>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> {journalDate}
              </h2>
              {journal.find((e) => e.date === journalDate) && !journalEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setJournalEditing(true)}
                    className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={deleteJournalEntry}
                    className="p-1.5 text-text-secondary hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {journalEditing || !journal.find((e) => e.date === journalDate) ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  rows={8}
                  placeholder="Write your reflection for today..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <div className="flex gap-2 justify-end">
                  {journalEditing && (
                    <Button variant="secondary" onClick={() => setJournalEditing(false)}>Cancel</Button>
                  )}
                  <Button onClick={saveJournalEntry} disabled={!journalContent.trim()}>
                    Save Entry
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-text-primary whitespace-pre-wrap text-sm leading-relaxed">
                {journalContent}
              </p>
            )}
          </Card>

          {/* Past entries list */}
          {journal.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-text-secondary mb-3">Past Entries</h3>
              <div className="flex flex-col gap-2">
                {[...journal]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setJournalDate(entry.date)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                        entry.date === journalDate
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <Calendar className="w-4 h-4 text-text-secondary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-text-primary">{entry.date}</span>
                        <p className="text-xs text-text-secondary truncate mt-0.5">{entry.content}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Routine ───────────────────────────────────────────────────────────── */}
      {activeTab === "routine" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={openAddRoutine} size="sm">
              <Plus className="w-4 h-4" /> Add Slot
            </Button>
          </div>
          {routineSlots.length === 0 ? (
            <EmptyState
              icon={Clock}
              message="No routine slots yet. Build your weekly schedule!"
              action={
                <Button onClick={openAddRoutine} size="sm">
                  <Plus className="w-4 h-4" /> Add Slot
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-6">
              {DAYS_FULL.map((day) => {
                const daySlots = routineSlots
                  .filter((r) => r.day === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                if (daySlots.length === 0) return null;
                return (
                  <div key={day}>
                    <h3 className="text-sm font-semibold text-text-secondary mb-2">{day}</h3>
                    <div className="flex flex-col gap-2">
                      {daySlots.map((r) => (
                        <Card key={r.id} className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-text-secondary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-text-primary text-sm">{r.title}</span>
                            <p className="text-xs text-text-secondary">
                              {r.startTime} – {r.endTime}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => openEditRoutine(r)}
                              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRoutineSlot(r.id)}
                              className="p-1.5 text-text-secondary hover:text-error transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showRoutine && (
            <Modal title={editingRoutine ? "Edit Slot" : "Add Slot"} onClose={() => setShowRoutine(false)}>
              <div className="flex flex-col gap-4">
                <Input
                  label="Activity"
                  value={routineForm.title}
                  onChange={(e) => setRoutineForm({ ...routineForm, title: e.target.value })}
                  placeholder="e.g. Morning workout"
                />
                <SelectField
                  label="Day"
                  value={routineForm.day}
                  onChange={(v) => setRoutineForm({ ...routineForm, day: v })}
                >
                  {DAYS_FULL.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </SelectField>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start time"
                    type="time"
                    value={routineForm.startTime}
                    onChange={(e) => setRoutineForm({ ...routineForm, startTime: e.target.value })}
                  />
                  <Input
                    label="End time"
                    type="time"
                    value={routineForm.endTime}
                    onChange={(e) => setRoutineForm({ ...routineForm, endTime: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setShowRoutine(false)}>Cancel</Button>
                  <Button onClick={saveRoutineForm}>Save</Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}
