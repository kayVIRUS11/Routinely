"use client";

import { useState, useEffect } from "react";
import {
  Dumbbell,
  Plus,
  X,
  Edit2,
  Trash2,
  Check,
  Flame,
  Calendar,
  Clock,
  Activity,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import AIRoutineCreator, { type GeneratedRoutineSlot } from "@/components/ui/AIRoutineCreator";
import AIModeReview from "@/components/ui/AIModeReview";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface PlannedExercise {
  name: string;
  sets: number;
  reps: string;
}

interface WorkoutPlanDay {
  day: string;
  isRest: boolean;
  exercises: PlannedExercise[];
}

interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  days: WorkoutPlanDay[];
}

interface LoggedExercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
}

interface ExerciseLog {
  id: string;
  date: string;
  workoutName: string;
  exercises: LoggedExercise[];
  durationMinutes: number;
  notes: string;
}

interface BodyMetric {
  id: string;
  date: string;
  label: string;
  value: number;
  unit: string;
  notes: string;
}

interface RestDay {
  id: string;
  date: string;
  reason: string;
}

interface FitnessRoutineSlot {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_SHORT_MAP: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

type FitnessTab = "overview" | "plans" | "log" | "metrics" | "rest" | "routine";

const TABS: { id: FitnessTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "plans", label: "Workout Plans" },
  { id: "log", label: "Exercise Log" },
  { id: "metrics", label: "Body Metrics" },
  { id: "rest", label: "Rest Days" },
  { id: "routine", label: "Routine" },
];

const METRIC_UNITS = ["kg", "lbs", "cm", "in", "mm", "%", "bpm", "steps", "other"];

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

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  // Convert JS Sunday-first (0–6) to Monday-first (0–6) to match DAYS_FULL
  return DAYS_FULL[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

function calcStreak(logs: ExerciseLog[]): number {
  if (logs.length === 0) return 0;
  const dates = Array.from(new Set(logs.map((l) => l.date))).sort().reverse();
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T00:00:00");
    const curr = new Date(dates[i] + "T00:00:00");
    const diff = (prev.getTime() - curr.getTime()) / 86_400_000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
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
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
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

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconClass?: string;
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className={cn("p-2 rounded-lg bg-primary/10", iconClass)}>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">{label}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

// ─── Workout Plan Form ─────────────────────────────────────────────────────────

function WorkoutPlanModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: WorkoutPlan;
  onSave: (plan: WorkoutPlan) => void;
  onClose: () => void;
}) {
  const defaultDays = (): WorkoutPlanDay[] =>
    DAYS_FULL.map((day) => ({ day, isRest: false, exercises: [] }));

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [days, setDays] = useState<WorkoutPlanDay[]>(initial?.days ?? defaultDays());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [newExercise, setNewExercise] = useState<Record<string, PlannedExercise>>({});

  function toggleRest(day: string) {
    setDays((prev) =>
      prev.map((d) => (d.day === day ? { ...d, isRest: !d.isRest, exercises: [] } : d))
    );
  }

  function addExercise(day: string) {
    const ex = newExercise[day];
    if (!ex?.name.trim()) return;
    setDays((prev) =>
      prev.map((d) =>
        d.day === day ? { ...d, exercises: [...d.exercises, { ...ex }] } : d
      )
    );
    setNewExercise((prev) => ({ ...prev, [day]: { name: "", sets: 3, reps: "10" } }));
  }

  function removeExercise(day: string, idx: number) {
    setDays((prev) =>
      prev.map((d) =>
        d.day === day ? { ...d, exercises: d.exercises.filter((_, i) => i !== idx) } : d
      )
    );
  }

  function getNewEx(day: string): PlannedExercise {
    return newExercise[day] ?? { name: "", sets: 3, reps: "10" };
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      description: description.trim(),
      days,
    });
  }

  return (
    <Modal title={initial ? "Edit Workout Plan" : "New Workout Plan"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input
          label="Plan Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Push Pull Legs"
        />
        <TextareaField
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Optional notes about this plan"
        />
        <div>
          <p className="text-sm text-text-secondary font-medium mb-2">Days</p>
          <div className="flex flex-col gap-2">
            {days.map((d) => (
              <div key={d.day} className="border border-border rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-card/50"
                  onClick={() => setExpandedDay(expandedDay === d.day ? null : d.day)}
                >
                  <div className="flex items-center gap-2">
                    {expandedDay === d.day ? (
                      <ChevronUp className="w-4 h-4 text-text-secondary" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-secondary" />
                    )}
                    <span className="text-sm font-medium text-text-primary">{d.day}</span>
                    {d.isRest && (
                      <span className="text-xs text-text-secondary bg-border px-1.5 py-0.5 rounded">
                        Rest
                      </span>
                    )}
                    {!d.isRest && d.exercises.length > 0 && (
                      <span className="text-xs text-text-secondary">
                        {d.exercises.length} exercise{d.exercises.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleRest(d.day); }}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded transition-colors",
                      d.isRest
                        ? "bg-primary/10 text-primary"
                        : "bg-border text-text-secondary hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    {d.isRest ? "Set Active" : "Mark Rest"}
                  </button>
                </div>
                {expandedDay === d.day && !d.isRest && (
                  <div className="px-3 pb-3 pt-1 border-t border-border bg-background">
                    {d.exercises.length > 0 && (
                      <ul className="mb-2 flex flex-col gap-1">
                        {d.exercises.map((ex, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between text-sm text-text-primary bg-card rounded px-2 py-1"
                          >
                            <span>
                              {ex.name}{" "}
                              <span className="text-text-secondary text-xs">
                                {ex.sets}×{ex.reps}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExercise(d.day, i)}
                              className="text-text-secondary hover:text-error transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input
                          placeholder="Exercise name"
                          value={getNewEx(d.day).name}
                          onChange={(e) =>
                            setNewExercise((prev) => ({
                              ...prev,
                              [d.day]: { ...getNewEx(d.day), name: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="w-16">
                        <Input
                          placeholder="Sets"
                          type="number"
                          min={1}
                          value={getNewEx(d.day).sets}
                          onChange={(e) =>
                            setNewExercise((prev) => ({
                              ...prev,
                              [d.day]: { ...getNewEx(d.day), sets: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>
                      <div className="w-16">
                        <Input
                          placeholder="Reps"
                          value={getNewEx(d.day).reps}
                          onChange={(e) =>
                            setNewExercise((prev) => ({
                              ...prev,
                              [d.day]: { ...getNewEx(d.day), reps: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => addExercise(d.day)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Check className="w-4 h-4" />
            Save Plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Exercise Log Form ─────────────────────────────────────────────────────────

function ExerciseLogModal({
  initial,
  plans,
  onSave,
  onClose,
}: {
  initial?: ExerciseLog;
  plans: WorkoutPlan[];
  onSave: (log: ExerciseLog) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? todayStr());
  const [workoutName, setWorkoutName] = useState(initial?.workoutName ?? "");
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes ?? 45);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [exercises, setExercises] = useState<LoggedExercise[]>(
    initial?.exercises ?? []
  );
  const [newEx, setNewEx] = useState<LoggedExercise>({
    name: "", sets: 3, reps: "10", weight: "",
  });

  function addExercise() {
    if (!newEx.name.trim()) return;
    setExercises((prev) => [...prev, { ...newEx }]);
    setNewEx({ name: "", sets: 3, reps: "10", weight: "" });
  }

  function removeExercise(idx: number) {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  function loadFromPlan(planId: string) {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const dayOfWeek = getDayOfWeek(date);
    const planDay = plan.days.find((d) => d.day === dayOfWeek);
    if (!planDay || planDay.isRest) return;
    setWorkoutName(`${plan.name} – ${dayOfWeek}`);
    setExercises(
      planDay.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: "",
      }))
    );
  }

  function handleSave() {
    if (!workoutName.trim()) return;
    onSave({
      id: initial?.id ?? uid(),
      date,
      workoutName: workoutName.trim(),
      exercises,
      durationMinutes,
      notes: notes.trim(),
    });
  }

  return (
    <Modal title={initial ? "Edit Log Entry" : "Log Workout"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Duration (min)"
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          />
        </div>
        {plans.length > 0 && (
          <SelectField label="Load from plan (optional)" value="" onChange={loadFromPlan}>
            <option value="">— Select a plan to prefill —</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>
        )}
        <Input
          label="Workout Name"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="e.g. Upper Body Strength"
        />
        <div>
          <p className="text-sm text-text-secondary font-medium mb-2">Exercises</p>
          {exercises.length > 0 && (
            <ul className="mb-2 flex flex-col gap-1">
              {exercises.map((ex, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm text-text-primary bg-background border border-border rounded px-2 py-1.5"
                >
                  <div>
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-text-secondary text-xs ml-2">
                      {ex.sets}×{ex.reps}
                      {ex.weight ? ` @ ${ex.weight}` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(i)}
                    className="text-text-secondary hover:text-error transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 items-end flex-wrap">
            <div className="flex-1 min-w-32">
              <Input
                placeholder="Exercise"
                value={newEx.name}
                onChange={(e) => setNewEx((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="w-14">
              <Input
                placeholder="Sets"
                type="number"
                min={1}
                value={newEx.sets}
                onChange={(e) => setNewEx((p) => ({ ...p, sets: Number(e.target.value) }))}
              />
            </div>
            <div className="w-14">
              <Input
                placeholder="Reps"
                value={newEx.reps}
                onChange={(e) => setNewEx((p) => ({ ...p, reps: e.target.value }))}
              />
            </div>
            <div className="w-20">
              <Input
                placeholder="Weight"
                value={newEx.weight}
                onChange={(e) => setNewEx((p) => ({ ...p, weight: e.target.value }))}
              />
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addExercise}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <TextareaField
          label="Notes"
          value={notes}
          onChange={setNotes}
          placeholder="How did it go?"
        />
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!workoutName.trim()}>
            <Check className="w-4 h-4" />
            Save Log
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Body Metric Form ─────────────────────────────────────────────────────────

function BodyMetricModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: BodyMetric;
  onSave: (m: BodyMetric) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? todayStr());
  const [label, setLabel] = useState(initial?.label ?? "Weight");
  const [value, setValue] = useState(initial?.value?.toString() ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "kg");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function handleSave() {
    if (!label.trim() || !value) return;
    onSave({
      id: initial?.id ?? uid(),
      date,
      label: label.trim(),
      value: parseFloat(value),
      unit,
      notes: notes.trim(),
    });
  }

  return (
    <Modal title={initial ? "Edit Metric" : "Log Body Metric"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          label="Metric Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Weight, Waist, Chest"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Value"
            type="number"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.0"
          />
          <SelectField label="Unit" value={unit} onChange={setUnit}>
            {METRIC_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </SelectField>
        </div>
        <TextareaField
          label="Notes"
          value={notes}
          onChange={setNotes}
          placeholder="Optional notes"
        />
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!label.trim() || !value}>
            <Check className="w-4 h-4" />
            Save Metric
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Rest Day Form ────────────────────────────────────────────────────────────

function RestDayModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: RestDay;
  onSave: (r: RestDay) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? todayStr());
  const [reason, setReason] = useState(initial?.reason ?? "");

  function handleSave() {
    onSave({ id: initial?.id ?? uid(), date, reason: reason.trim() });
  }

  return (
    <Modal title={initial ? "Edit Rest Day" : "Schedule Rest Day"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <TextareaField
          label="Reason (optional)"
          value={reason}
          onChange={setReason}
          placeholder="e.g. Recovery, active rest, travel..."
        />
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Routine Slot Form ────────────────────────────────────────────────────────

function RoutineSlotModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: FitnessRoutineSlot;
  onSave: (s: FitnessRoutineSlot) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [day, setDay] = useState(initial?.day ?? "Monday");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "06:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "07:00");

  function handleSave() {
    if (!title.trim()) return;
    onSave({ id: initial?.id ?? uid(), title: title.trim(), day, startTime, endTime });
  }

  return (
    <Modal title={initial ? "Edit Schedule Slot" : "Add Schedule Slot"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input
          label="Activity"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning Run, Leg Day"
        />
        <SelectField label="Day" value={day} onChange={setDay}>
          {DAYS_FULL.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="End Time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            <Check className="w-4 h-4" />
            Save Slot
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FitnessPage() {
  const [activeTab, setActiveTab] = useState<FitnessTab>("overview");
  const [showAIRoutine, setShowAIRoutine] = useState(false);
  const [showAIReview, setShowAIReview] = useState(false);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [restDays, setRestDays] = useState<RestDay[]>([]);
  const [routineSlots, setRoutineSlots] = useState<FitnessRoutineSlot[]>([]);

  useEffect(() => {
    setPlans(loadLS<WorkoutPlan>("fitness_workoutPlans"));
    setLogs(loadLS<ExerciseLog>("fitness_exerciseLog"));
    setMetrics(loadLS<BodyMetric>("fitness_bodyMetrics"));
    setRestDays(loadLS<RestDay>("fitness_restDays"));
    setRoutineSlots(loadLS<FitnessRoutineSlot>("fitness_routine"));
  }, []);

  // ── Persist helpers ──────────────────────────────────────────────────────────
  const savePlans = (v: WorkoutPlan[]) => { setPlans(v); saveLS("fitness_workoutPlans", v); };
  const saveLogs = (v: ExerciseLog[]) => { setLogs(v); saveLS("fitness_exerciseLog", v); };
  const saveMetrics = (v: BodyMetric[]) => { setMetrics(v); saveLS("fitness_bodyMetrics", v); };
  const saveRestDays = (v: RestDay[]) => { setRestDays(v); saveLS("fitness_restDays", v); };
  const saveRoutine = (v: FitnessRoutineSlot[]) => { setRoutineSlots(v); saveLS("fitness_routine", v); };

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [planModal, setPlanModal] = useState<{ open: boolean; item?: WorkoutPlan }>({ open: false });
  const [logModal, setLogModal] = useState<{ open: boolean; item?: ExerciseLog }>({ open: false });
  const [metricModal, setMetricModal] = useState<{ open: boolean; item?: BodyMetric }>({ open: false });
  const [restModal, setRestModal] = useState<{ open: boolean; item?: RestDay }>({ open: false });
  const [routineModal, setRoutineModal] = useState<{ open: boolean; item?: FitnessRoutineSlot }>({ open: false });

  // ── Computed stats ───────────────────────────────────────────────────────────
  const streak = calcStreak(logs);
  const today = todayStr();
  const todayDow = getDayOfWeek(today);
  const { start: weekStart, end: weekEnd } = getWeekBounds();
  const weekLogs = logs.filter((l) => {
    const d = new Date(l.date + "T00:00:00");
    return d >= weekStart && d <= weekEnd;
  });
  const weeklyMinutes = weekLogs.reduce((acc, l) => acc + l.durationMinutes, 0);

  const todayRoutineSlots = routineSlots.filter((s) => s.day === todayDow);
  const todayPlanActivity = todayRoutineSlots.length > 0
    ? todayRoutineSlots[0].title
    : (() => {
        for (const plan of plans) {
          const pd = plan.days.find((d) => d.day === todayDow);
          if (pd && !pd.isRest && pd.exercises.length > 0) return `${plan.name} – ${todayDow}`;
        }
        return null;
      })();

  const lastMetric = [...metrics].sort((a, b) => b.date.localeCompare(a.date))[0];
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const sortedMetrics = [...metrics].sort((a, b) => b.date.localeCompare(a.date));
  const sortedRestDays = [...restDays].sort((a, b) => b.date.localeCompare(a.date));

  const isRestToday = restDays.some((r) => r.date === today);

  // ── Plan handlers ────────────────────────────────────────────────────────────
  function upsertPlan(plan: WorkoutPlan) {
    savePlans(
      plans.some((p) => p.id === plan.id)
        ? plans.map((p) => (p.id === plan.id ? plan : p))
        : [...plans, plan]
    );
    setPlanModal({ open: false });
  }
  function deletePlan(id: string) { savePlans(plans.filter((p) => p.id !== id)); }

  // ── Log handlers ─────────────────────────────────────────────────────────────
  function upsertLog(log: ExerciseLog) {
    saveLogs(
      logs.some((l) => l.id === log.id)
        ? logs.map((l) => (l.id === log.id ? log : l))
        : [...logs, log]
    );
    setLogModal({ open: false });
  }
  function deleteLog(id: string) { saveLogs(logs.filter((l) => l.id !== id)); }

  // ── Metric handlers ──────────────────────────────────────────────────────────
  function upsertMetric(metric: BodyMetric) {
    saveMetrics(
      metrics.some((m) => m.id === metric.id)
        ? metrics.map((m) => (m.id === metric.id ? metric : m))
        : [...metrics, metric]
    );
    setMetricModal({ open: false });
  }
  function deleteMetric(id: string) { saveMetrics(metrics.filter((m) => m.id !== id)); }

  // ── Rest day handlers ────────────────────────────────────────────────────────
  function upsertRestDay(r: RestDay) {
    saveRestDays(
      restDays.some((rd) => rd.id === r.id)
        ? restDays.map((rd) => (rd.id === r.id ? r : rd))
        : [...restDays, r]
    );
    setRestModal({ open: false });
  }
  function deleteRestDay(id: string) { saveRestDays(restDays.filter((r) => r.id !== id)); }

  // ── Routine handlers ─────────────────────────────────────────────────────────
  function upsertRoutineSlot(slot: FitnessRoutineSlot) {
    saveRoutine(
      routineSlots.some((s) => s.id === slot.id)
        ? routineSlots.map((s) => (s.id === slot.id ? slot : s))
        : [...routineSlots, slot]
    );
    setRoutineModal({ open: false });
  }
  function deleteRoutineSlot(id: string) { saveRoutine(routineSlots.filter((s) => s.id !== id)); }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Dumbbell className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Fitness & Health</h1>
          <p className="text-text-secondary text-sm">Track workouts, log progress, and stay consistent</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto mb-6 border-b border-border pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          {isRestToday && (
            <Card className="border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">Rest Day Today 🛌</p>
                  <p className="text-xs text-text-secondary">
                    {restDays.find((r) => r.date === today)?.reason || "Scheduled rest day – recover well!"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={Flame}
              label="Workout Streak"
              value={streak}
              sub={streak === 1 ? "day" : "days"}
            />
            <StatCard
              icon={Clock}
              label="Active This Week"
              value={`${weeklyMinutes}m`}
              sub={`${weekLogs.length} session${weekLogs.length !== 1 ? "s" : ""}`}
            />
            <StatCard
              icon={Activity}
              label="Last Metric"
              value={lastMetric ? `${lastMetric.value}${lastMetric.unit}` : "—"}
              sub={lastMetric ? `${lastMetric.label} · ${formatDate(lastMetric.date)}` : "None logged"}
            />
            <StatCard
              icon={Target}
              label="Plans"
              value={plans.length}
              sub={`${logs.length} total sessions`}
            />
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowAIReview(true)}>
              <Sparkles className="w-4 h-4" /> AI Review
            </Button>
          </div>

          {/* Today's workout */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-text-primary">Today – {todayDow}</h2>
            </div>
            {todayPlanActivity ? (
              <p className="text-text-secondary text-sm">
                Planned: <span className="text-text-primary font-medium">{todayPlanActivity}</span>
              </p>
            ) : isRestToday ? (
              <p className="text-text-secondary text-sm">Rest day – no workout planned.</p>
            ) : (
              <p className="text-text-secondary text-sm">
                No workout scheduled for today.{" "}
                <button
                  className="text-primary hover:underline"
                  onClick={() => setActiveTab("plans")}
                >
                  Add a plan
                </button>{" "}
                or{" "}
                <button
                  className="text-primary hover:underline"
                  onClick={() => setLogModal({ open: true })}
                >
                  log a session
                </button>.
              </p>
            )}
          </Card>

          {/* Recent logs */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-text-primary">Recent Sessions</h2>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab("log")}>
                View all
              </Button>
            </div>
            {sortedLogs.length === 0 ? (
              <p className="text-text-secondary text-sm">No sessions logged yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {sortedLogs.slice(0, 3).map((log) => (
                  <li key={log.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-text-primary font-medium">{log.workoutName}</span>
                      <span className="text-text-secondary ml-2">{log.durationMinutes}m</span>
                    </div>
                    <span className="text-text-secondary text-xs">{formatDate(log.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* ── Workout Plans ─────────────────────────────────────────────────── */}
      {activeTab === "plans" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setPlanModal({ open: true })}>
              <Plus className="w-4 h-4" />
              New Plan
            </Button>
          </div>
          {plans.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              message="No workout plans yet. Create one to get started."
              action={
                <Button size="sm" onClick={() => setPlanModal({ open: true })}>
                  <Plus className="w-4 h-4" />
                  Create Plan
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {plans.map((plan) => (
                <WorkoutPlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={() => setPlanModal({ open: true, item: plan })}
                  onDelete={() => deletePlan(plan.id)}
                />
              ))}
            </div>
          )}
          {planModal.open && (
            <WorkoutPlanModal
              initial={planModal.item}
              onSave={upsertPlan}
              onClose={() => setPlanModal({ open: false })}
            />
          )}
        </div>
      )}

      {/* ── Exercise Log ──────────────────────────────────────────────────── */}
      {activeTab === "log" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setLogModal({ open: true })}>
              <Plus className="w-4 h-4" />
              Log Workout
            </Button>
          </div>
          {sortedLogs.length === 0 ? (
            <EmptyState
              icon={Activity}
              message="No workouts logged yet. Start tracking your sessions."
              action={
                <Button size="sm" onClick={() => setLogModal({ open: true })}>
                  <Plus className="w-4 h-4" />
                  Log First Workout
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {sortedLogs.map((log) => (
                <ExerciseLogCard
                  key={log.id}
                  log={log}
                  onEdit={() => setLogModal({ open: true, item: log })}
                  onDelete={() => deleteLog(log.id)}
                />
              ))}
            </div>
          )}
          {logModal.open && (
            <ExerciseLogModal
              initial={logModal.item}
              plans={plans}
              onSave={upsertLog}
              onClose={() => setLogModal({ open: false })}
            />
          )}
        </div>
      )}

      {/* ── Body Metrics ──────────────────────────────────────────────────── */}
      {activeTab === "metrics" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setMetricModal({ open: true })}>
              <Plus className="w-4 h-4" />
              Log Metric
            </Button>
          </div>
          {sortedMetrics.length === 0 ? (
            <EmptyState
              icon={Activity}
              message="No body metrics logged yet. Track weight, measurements, or any custom metric."
              action={
                <Button size="sm" onClick={() => setMetricModal({ open: true })}>
                  <Plus className="w-4 h-4" />
                  Log First Metric
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {sortedMetrics.map((m) => (
                <Card key={m.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {m.label}: <span className="text-primary">{m.value}{m.unit}</span>
                      </p>
                      <p className="text-xs text-text-secondary">{formatDate(m.date)}</p>
                      {m.notes && <p className="text-xs text-text-secondary mt-0.5">{m.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setMetricModal({ open: true, item: m })}
                      className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMetric(m.id)}
                      className="p-1.5 text-text-secondary hover:text-error transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {metricModal.open && (
            <BodyMetricModal
              initial={metricModal.item}
              onSave={upsertMetric}
              onClose={() => setMetricModal({ open: false })}
            />
          )}
        </div>
      )}

      {/* ── Rest Days ─────────────────────────────────────────────────────── */}
      {activeTab === "rest" && (
        <div>
          <div className="flex items-start justify-between mb-4 gap-4">
            <p className="text-sm text-text-secondary">
              Schedule rest days to prevent over-training. Rest days are highlighted in the overview and marked on your calendar so you know when to recover.
            </p>
            <Button onClick={() => setRestModal({ open: true })} className="shrink-0">
              <Plus className="w-4 h-4" />
              Add Rest Day
            </Button>
          </div>
          {sortedRestDays.length === 0 ? (
            <EmptyState
              icon={Calendar}
              message="No rest days scheduled. Plan your recovery time."
              action={
                <Button size="sm" onClick={() => setRestModal({ open: true })}>
                  <Plus className="w-4 h-4" />
                  Schedule Rest Day
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {sortedRestDays.map((r) => {
                const isPast = r.date < today;
                const isToday = r.date === today;
                return (
                  <Card key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isToday ? "bg-primary/10" : isPast ? "bg-border" : "bg-success/10"
                      )}>
                        <Calendar className={cn(
                          "w-4 h-4",
                          isToday ? "text-primary" : isPast ? "text-text-secondary" : "text-success"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary">{formatDate(r.date)}</p>
                          {isToday && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              Today
                            </span>
                          )}
                          {!isToday && !isPast && (
                            <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded">
                              Upcoming
                            </span>
                          )}
                        </div>
                        {r.reason && (
                          <p className="text-xs text-text-secondary">{r.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setRestModal({ open: true, item: r })}
                        className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRestDay(r.id)}
                        className="p-1.5 text-text-secondary hover:text-error transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          {restModal.open && (
            <RestDayModal
              initial={restModal.item}
              onSave={upsertRestDay}
              onClose={() => setRestModal({ open: false })}
            />
          )}
        </div>
      )}

      {/* ── Routine ───────────────────────────────────────────────────────── */}
      {activeTab === "routine" && (
        <div>
          <div className="flex justify-end mb-4 gap-2">
            <Button variant="secondary" onClick={() => setShowAIRoutine(true)}>
              <Sparkles className="w-4 h-4" />
              AI Create
            </Button>
            <Button onClick={() => setRoutineModal({ open: true })}>
              <Plus className="w-4 h-4" />
              Add Slot
            </Button>
          </div>
          {routineSlots.length === 0 ? (
            <EmptyState
              icon={Clock}
              message="No routine schedule yet. Add recurring workout slots for each day."
              action={
                <Button size="sm" onClick={() => setRoutineModal({ open: true })}>
                  <Plus className="w-4 h-4" />
                  Add First Slot
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-6">
              {DAYS_FULL.map((day) => {
                const daySlots = routineSlots
                  .filter((s) => s.day === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                if (daySlots.length === 0) return null;
                return (
                  <div key={day}>
                    <h3 className={cn(
                      "text-sm font-semibold mb-2",
                      day === todayDow ? "text-primary" : "text-text-secondary"
                    )}>
                      {day}
                      {day === todayDow && (
                        <span className="ml-2 text-xs font-normal bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          Today
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {daySlots.map((slot) => (
                        <Card key={slot.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{slot.title}</p>
                              <p className="text-xs text-text-secondary">
                                {slot.startTime} – {slot.endTime}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setRoutineModal({ open: true, item: slot })}
                              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRoutineSlot(slot.id)}
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
          {routineModal.open && (
            <RoutineSlotModal
              initial={routineModal.item}
              onSave={upsertRoutineSlot}
              onClose={() => setRoutineModal({ open: false })}
            />
          )}
        </div>
      )}
      {showAIRoutine && (
        <AIRoutineCreator
          modeName="Fitness"
          onConfirm={(slots: GeneratedRoutineSlot[]) => {
            const newSlots = slots.map((s) => ({ id: Date.now().toString() + Math.random(), ...s }));
            saveRoutine([...routineSlots, ...newSlots]);
          }}
          onClose={() => setShowAIRoutine(false)}
        />
      )}
      {showAIReview && (
        <AIModeReview
          modeName="Fitness"
          modeData={{ plans, logs, metrics, restDays, routineSlots }}
          onClose={() => setShowAIReview(false)}
        />
      )}
    </div>
  );
}

// ─── Workout Plan Card (extracted to avoid nesting complexity) ─────────────────

function WorkoutPlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: WorkoutPlan;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeDays = plan.days.filter((d) => !d.isRest && d.exercises.length > 0);
  const restDayCount = plan.days.filter((d) => d.isRest).length;

  return (
    <Card>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Dumbbell className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">{plan.name}</p>
            <p className="text-xs text-text-secondary">
              {activeDays.length} training day{activeDays.length !== 1 ? "s" : ""}
              {restDayCount > 0 && ` · ${restDayCount} rest`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-text-secondary hover:text-error transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-secondary ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-secondary ml-1" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-border pt-4">
          {plan.description && (
            <p className="text-sm text-text-secondary mb-3">{plan.description}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.days.map((d) => (
              <div
                key={d.day}
                className={cn(
                  "rounded-lg p-3 border",
                  d.isRest
                    ? "border-border bg-background"
                    : d.exercises.length > 0
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-background"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-text-primary">{d.day}</span>
                  {d.isRest && (
                    <span className="text-xs text-text-secondary">Rest</span>
                  )}
                </div>
                {!d.isRest && d.exercises.length === 0 && (
                  <p className="text-xs text-text-secondary">No exercises</p>
                )}
                {!d.isRest && d.exercises.map((ex, i) => (
                  <p key={i} className="text-xs text-text-secondary">
                    {ex.name} — {ex.sets}×{ex.reps}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Exercise Log Card ────────────────────────────────────────────────────────

function ExerciseLogCard({
  log,
  onEdit,
  onDelete,
}: {
  log: ExerciseLog;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">{log.workoutName}</p>
            <p className="text-xs text-text-secondary">
              {formatDate(log.date)} · {log.durationMinutes}min
              {log.exercises.length > 0 && ` · ${log.exercises.length} exercise${log.exercises.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-text-secondary hover:text-error transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-secondary ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-secondary ml-1" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-border pt-3">
          {log.exercises.length > 0 && (
            <ul className="flex flex-col gap-1 mb-2">
              {log.exercises.map((ex, i) => (
                <li key={i} className="text-sm text-text-secondary">
                  <span className="text-text-primary font-medium">{ex.name}</span>{" "}
                  {ex.sets}×{ex.reps}
                  {ex.weight && <span className="text-text-secondary"> @ {ex.weight}</span>}
                </li>
              ))}
            </ul>
          )}
          {log.notes && (
            <p className="text-xs text-text-secondary italic">{log.notes}</p>
          )}
        </div>
      )}
    </Card>
  );
}
