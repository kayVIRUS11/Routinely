"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  X,
  Edit2,
  Trash2,
  Check,
  Star,
  Clock,
  Calendar,
  Target,
  Flame,
  AlertCircle,
  GraduationCap,
  Award,
  Sparkles,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import AIRoutineCreator, { type GeneratedRoutineSlot } from "@/components/ui/AIRoutineCreator";
import AIModeReview from "@/components/ui/AIModeReview";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Course {
  id: string;
  name: string;
  lecturer: string;
  creditUnits: number;
  color: string;
  notes: string;
}

interface TimetableSlot {
  id: string;
  courseId: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
}

interface StudyPlan {
  id: string;
  courseId: string;
  frequencyPerWeek: number;
  durationMinutes: number;
  notes: string;
}

interface Assignment {
  id: string;
  title: string;
  courseId: string;
  dueDate: string;
  description: string;
  status: "pending" | "in-progress" | "done";
}

interface Exam {
  id: string;
  courseId: string;
  date: string;
  venue: string;
  notes: string;
}

interface StudySession {
  id: string;
  courseId: string;
  durationMinutes: number;
  date: string;
  notes: string;
  rating: number;
}

interface RoutineSlot {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSE_COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Yellow", value: "#eab308" },
  { label: "Orange", value: "#f97316" },
  { label: "Red", value: "#ef4444" },
  { label: "Pink", value: "#ec4899" },
  { label: "Purple", value: "#8b5cf6" },
];

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type StudyTab =
  | "overview"
  | "courses"
  | "timetable"
  | "planner"
  | "assignments"
  | "exams"
  | "sessions"
  | "routine";

const TABS: { id: StudyTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "courses", label: "Courses" },
  { id: "timetable", label: "Timetable" },
  { id: "planner", label: "Planner" },
  { id: "assignments", label: "Assignments" },
  { id: "exams", label: "Exams" },
  { id: "sessions", label: "Sessions" },
  { id: "routine", label: "Routine" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMins(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getCourseName(courses: Course[], id: string): string {
  return courses.find((c) => c.id === id)?.name ?? "Unknown";
}

function getCourseColor(courses: Course[], id: string): string {
  return courses.find((c) => c.id === id)?.color ?? "#6366f1";
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

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            "transition-colors",
            s <= value ? "text-yellow-400" : "text-border"
          )}
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      ))}
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

// ─── Default form values ──────────────────────────────────────────────────────

const defaultCourseForm = () => ({
  name: "",
  lecturer: "",
  creditUnits: 3,
  color: COURSE_COLORS[0].value,
  notes: "",
});

const defaultSlotForm = (courseId: string) => ({
  courseId,
  day: "Mon",
  startTime: "08:00",
  endTime: "10:00",
  venue: "",
});

const defaultPlanForm = (courseId: string) => ({
  courseId,
  frequencyPerWeek: 3,
  durationMinutes: 60,
  notes: "",
});

const defaultAssignmentForm = (courseId: string) => ({
  title: "",
  courseId,
  dueDate: "",
  description: "",
  status: "pending" as Assignment["status"],
});

const defaultExamForm = (courseId: string) => ({
  courseId,
  date: "",
  venue: "",
  notes: "",
});

const defaultSessionForm = (courseId: string) => ({
  courseId,
  durationMinutes: 60,
  date: todayStr(),
  notes: "",
  rating: 3,
});

const defaultRoutineForm = () => ({
  title: "",
  day: "Monday",
  startTime: "08:00",
  endTime: "09:00",
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudyPage() {
  const [activeTab, setActiveTab] = useState<StudyTab>("overview");
  const [showAIRoutine, setShowAIRoutine] = useState(false);
  const [showAIReview, setShowAIReview] = useState(false);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [routineSlots, setRoutineSlots] = useState<RoutineSlot[]>([]);

  useEffect(() => {
    setCourses(loadLS<Course>("study_courses"));
    setTimetableSlots(loadLS<TimetableSlot>("study_timetable"));
    setStudyPlans(loadLS<StudyPlan>("study_plans"));
    setAssignments(loadLS<Assignment>("study_assignments"));
    setExams(loadLS<Exam>("study_exams"));
    setSessions(loadLS<StudySession>("study_sessions"));
    setRoutineSlots(loadLS<RoutineSlot>("study_routine"));
  }, []);

  // ── Persist helpers ──────────────────────────────────────────────────────────
  const saveCourses = (v: Course[]) => { setCourses(v); saveLS("study_courses", v); };
  const saveTimetable = (v: TimetableSlot[]) => { setTimetableSlots(v); saveLS("study_timetable", v); };
  const savePlans = (v: StudyPlan[]) => { setStudyPlans(v); saveLS("study_plans", v); };
  const saveAssignments = (v: Assignment[]) => { setAssignments(v); saveLS("study_assignments", v); };
  const saveExams = (v: Exam[]) => { setExams(v); saveLS("study_exams", v); };
  const saveSessions = (v: StudySession[]) => { setSessions(v); saveLS("study_sessions", v); };
  const saveRoutine = (v: RoutineSlot[]) => { setRoutineSlots(v); saveLS("study_routine", v); };

  // ── Summary stats ────────────────────────────────────────────────────────────
  const { start: weekStart, end: weekEnd } = getWeekBounds();
  const weekSessions = sessions.filter((s) => {
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  });
  const hoursThisWeek = weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tStr = todayStr();
  const tasksDueToday = assignments.filter(
    (a) => a.dueDate === tStr && a.status !== "done"
  ).length;

  const upcomingExams = [...exams]
    .filter((e) => new Date(e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextExamDays = upcomingExams.length > 0 ? daysUntil(upcomingExams[0].date) : null;

  const streak = (() => {
    let s = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (true) {
      const ds = d.toISOString().slice(0, 10);
      if (!sessions.some((se) => se.date === ds)) break;
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const nowTime = new Date();
  const todayAbbr = DAY_ABBR[nowTime.getDay()];
  const currentHHMM = `${nowTime.getHours().toString().padStart(2, "0")}:${nowTime.getMinutes().toString().padStart(2, "0")}`;
  const nextSlot = timetableSlots
    .filter((s) => s.day === todayAbbr && s.startTime > currentHHMM)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  // ── Modal & form state ───────────────────────────────────────────────────────
  const [showCourse, setShowCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState(defaultCourseForm());

  const [showSlot, setShowSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [slotForm, setSlotForm] = useState(defaultSlotForm(""));

  const [showPlan, setShowPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
  const [planForm, setPlanForm] = useState(defaultPlanForm(""));

  const [showAssignment, setShowAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [assignmentForm, setAssignmentForm] = useState(defaultAssignmentForm(""));

  const [showExam, setShowExam] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState(defaultExamForm(""));

  const [showSession, setShowSession] = useState(false);
  const [sessionForm, setSessionForm] = useState(defaultSessionForm(""));

  const [showRoutine, setShowRoutine] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineSlot | null>(null);
  const [routineForm, setRoutineForm] = useState(defaultRoutineForm());

  const [assignmentFilter, setAssignmentFilter] = useState<"all" | Assignment["status"]>("all");

  // ── Courses CRUD ─────────────────────────────────────────────────────────────
  const openAddCourse = () => {
    setCourseForm(defaultCourseForm());
    setEditingCourse(null);
    setShowCourse(true);
  };
  const openEditCourse = (c: Course) => {
    setCourseForm({ name: c.name, lecturer: c.lecturer, creditUnits: c.creditUnits, color: c.color, notes: c.notes });
    setEditingCourse(c);
    setShowCourse(true);
  };
  const saveCourseForm = () => {
    if (!courseForm.name.trim()) return;
    if (editingCourse) {
      saveCourses(courses.map((c) => (c.id === editingCourse.id ? { ...c, ...courseForm } : c)));
    } else {
      saveCourses([...courses, { id: Date.now().toString(), ...courseForm }]);
    }
    setShowCourse(false);
  };
  const deleteCourse = (id: string) => saveCourses(courses.filter((c) => c.id !== id));

  // ── Timetable CRUD ───────────────────────────────────────────────────────────
  const openAddSlot = () => {
    setSlotForm(defaultSlotForm(courses[0]?.id ?? ""));
    setEditingSlot(null);
    setShowSlot(true);
  };
  const openEditSlot = (s: TimetableSlot) => {
    setSlotForm({ courseId: s.courseId, day: s.day, startTime: s.startTime, endTime: s.endTime, venue: s.venue });
    setEditingSlot(s);
    setShowSlot(true);
  };
  const saveSlotForm = () => {
    if (!slotForm.courseId) return;
    if (editingSlot) {
      saveTimetable(timetableSlots.map((s) => (s.id === editingSlot.id ? { ...s, ...slotForm } : s)));
    } else {
      saveTimetable([...timetableSlots, { id: Date.now().toString(), ...slotForm }]);
    }
    setShowSlot(false);
  };
  const deleteSlot = (id: string) => saveTimetable(timetableSlots.filter((s) => s.id !== id));

  // ── Study Plans CRUD ─────────────────────────────────────────────────────────
  const openAddPlan = () => {
    setPlanForm(defaultPlanForm(courses[0]?.id ?? ""));
    setEditingPlan(null);
    setShowPlan(true);
  };
  const openEditPlan = (p: StudyPlan) => {
    setPlanForm({ courseId: p.courseId, frequencyPerWeek: p.frequencyPerWeek, durationMinutes: p.durationMinutes, notes: p.notes });
    setEditingPlan(p);
    setShowPlan(true);
  };
  const savePlanForm = () => {
    if (!planForm.courseId) return;
    if (editingPlan) {
      savePlans(studyPlans.map((p) => (p.id === editingPlan.id ? { ...p, ...planForm } : p)));
    } else {
      savePlans([...studyPlans, { id: Date.now().toString(), ...planForm }]);
    }
    setShowPlan(false);
  };
  const deletePlan = (id: string) => savePlans(studyPlans.filter((p) => p.id !== id));

  // ── Assignments CRUD ─────────────────────────────────────────────────────────
  const openAddAssignment = () => {
    setAssignmentForm(defaultAssignmentForm(courses[0]?.id ?? ""));
    setEditingAssignment(null);
    setShowAssignment(true);
  };
  const openEditAssignment = (a: Assignment) => {
    setAssignmentForm({ title: a.title, courseId: a.courseId, dueDate: a.dueDate, description: a.description, status: a.status });
    setEditingAssignment(a);
    setShowAssignment(true);
  };
  const saveAssignmentForm = () => {
    if (!assignmentForm.title.trim()) return;
    if (editingAssignment) {
      saveAssignments(assignments.map((a) => (a.id === editingAssignment.id ? { ...a, ...assignmentForm } : a)));
    } else {
      saveAssignments([...assignments, { id: Date.now().toString(), ...assignmentForm }]);
    }
    setShowAssignment(false);
  };
  const deleteAssignment = (id: string) => saveAssignments(assignments.filter((a) => a.id !== id));
  const toggleAssignment = (id: string) => {
    saveAssignments(
      assignments.map((a) =>
        a.id === id ? { ...a, status: a.status === "done" ? "pending" : "done" } : a
      )
    );
  };

  // ── Exams CRUD ───────────────────────────────────────────────────────────────
  const openAddExam = () => {
    setExamForm(defaultExamForm(courses[0]?.id ?? ""));
    setEditingExam(null);
    setShowExam(true);
  };
  const openEditExam = (e: Exam) => {
    setExamForm({ courseId: e.courseId, date: e.date, venue: e.venue, notes: e.notes });
    setEditingExam(e);
    setShowExam(true);
  };
  const saveExamForm = () => {
    if (!examForm.courseId || !examForm.date) return;
    if (editingExam) {
      saveExams(exams.map((e) => (e.id === editingExam.id ? { ...e, ...examForm } : e)));
    } else {
      saveExams([...exams, { id: Date.now().toString(), ...examForm }]);
    }
    setShowExam(false);
  };
  const deleteExam = (id: string) => saveExams(exams.filter((e) => e.id !== id));

  // ── Sessions CRUD ────────────────────────────────────────────────────────────
  const openAddSession = () => {
    setSessionForm(defaultSessionForm(courses[0]?.id ?? ""));
    setShowSession(true);
  };
  const saveSessionForm = () => {
    if (!sessionForm.courseId) return;
    saveSessions([...sessions, { id: Date.now().toString(), ...sessionForm }]);
    setShowSession(false);
  };
  const deleteSession = (id: string) => saveSessions(sessions.filter((s) => s.id !== id));

  // ── Routine CRUD ─────────────────────────────────────────────────────────────
  const openAddRoutine = () => {
    setRoutineForm(defaultRoutineForm());
    setEditingRoutine(null);
    setShowRoutine(true);
  };
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
      saveRoutine([...routineSlots, { id: Date.now().toString(), ...routineForm }]);
    }
    setShowRoutine(false);
  };
  const deleteRoutine = (id: string) => saveRoutine(routineSlots.filter((r) => r.id !== id));

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredAssignments =
    assignmentFilter === "all"
      ? assignments
      : assignments.filter((a) => a.status === assignmentFilter);
  const sortedAssignments = [...filteredAssignments].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  );
  const sortedExams = [...exams].sort((a, b) => a.date.localeCompare(b.date));

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-primary" />
          Study Mode
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">Manage your academic life</p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-primary">{hoursThisWeek.toFixed(1)}</p>
          <p className="text-xs text-text-secondary mt-1">Hours This Week</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-yellow-400">{tasksDueToday}</p>
          <p className="text-xs text-text-secondary mt-1">Due Today</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-400">
            {nextExamDays !== null ? `${nextExamDays}d` : "—"}
          </p>
          <p className="text-xs text-text-secondary mt-1">Next Exam</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-orange-400">{streak}</p>
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-xs text-text-secondary mt-1">Day Streak</p>
        </Card>
        <Card className="text-center col-span-2 md:col-span-1">
          <p className="text-sm font-semibold text-text-primary truncate">
            {nextSlot
              ? `${nextSlot.startTime} – ${getCourseName(courses, nextSlot.courseId)}`
              : "No more today"}
          </p>
          <p className="text-xs text-text-secondary mt-1">Next Session</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg",
              activeTab === tab.id
                ? "bg-primary/10 text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: GraduationCap, color: "text-primary", value: courses.length, label: "Courses" },
              { icon: Calendar, color: "text-blue-400", value: timetableSlots.length, label: "Timetable Slots" },
              { icon: AlertCircle, color: "text-yellow-400", value: assignments.filter((a) => a.status !== "done").length, label: "Pending Tasks" },
              { icon: Award, color: "text-green-400", value: exams.length, label: "Exams Scheduled" },
            ].map(({ icon: Icon, color, value, label }) => (
              <Card key={label} className="text-center">
                <Icon className={cn("w-6 h-6 mx-auto mb-2", color)} />
                <p className="text-xl font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-secondary">{label}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Add Course", tab: "courses" as StudyTab, action: openAddCourse },
              { label: "Log Session", tab: "sessions" as StudyTab, action: openAddSession },
              { label: "Add Assignment", tab: "assignments" as StudyTab, action: openAddAssignment },
              { label: "Add Exam", tab: "exams" as StudyTab, action: openAddExam },
            ].map(({ label, tab, action }) => (
              <Button
                key={label}
                variant="secondary"
                size="sm"
                onClick={() => { setActiveTab(tab); action(); }}
                className="justify-start"
              >
                <Plus className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowAIReview(true)}>
              <Sparkles className="w-4 h-4" /> AI Review
            </Button>
          </div>

          {upcomingExams.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Upcoming Exams</h3>
              <div className="space-y-2">
                {upcomingExams.slice(0, 5).map((exam) => {
                  const days = daysUntil(exam.date);
                  return (
                    <div key={exam.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCourseColor(courses, exam.courseId) }} />
                        <span className="text-text-primary">{getCourseName(courses, exam.courseId)}</span>
                        {exam.venue && <span className="text-text-secondary text-xs">· {exam.venue}</span>}
                      </div>
                      <span className={cn("font-semibold text-xs", days < 7 ? "text-red-400" : days < 14 ? "text-yellow-400" : "text-green-400")}>
                        {days === 0 ? "Today!" : `${days}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {assignments.filter((a) => a.dueDate === tStr && a.status !== "done").length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Due Today</h3>
              <div className="space-y-2">
                {assignments
                  .filter((a) => a.dueDate === tStr && a.status !== "done")
                  .map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-text-primary">{a.title}</span>
                      <span className="text-text-secondary text-xs ml-auto">{getCourseName(courses, a.courseId)}</span>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── COURSES ──────────────────────────────────────────────────────────── */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddCourse} size="sm">
              <Plus className="w-4 h-4" /> Add Course
            </Button>
          </div>
          {courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              message="No courses yet. Add your first course!"
              action={
                <Button onClick={openAddCourse} size="sm">
                  <Plus className="w-4 h-4" /> Add Course
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3">
              {courses.map((course) => (
                <Card key={course.id} className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: course.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-text-primary">{course.name}</h3>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEditCourse(course)} className="p-1 text-text-secondary hover:text-text-primary transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteCourse(course.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary">{course.lecturer}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{course.creditUnits} credit unit{course.creditUnits === 1 ? "" : "s"}</p>
                    {course.notes && (
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">{course.notes}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TIMETABLE ────────────────────────────────────────────────────────── */}
      {activeTab === "timetable" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{timetableSlots.length} slot{timetableSlots.length !== 1 ? "s" : ""} scheduled</p>
            <Button onClick={openAddSlot} size="sm" disabled={courses.length === 0}>
              <Plus className="w-4 h-4" /> Add Slot
            </Button>
          </div>
          {courses.length === 0 && (
            <Card className="text-center py-6">
              <p className="text-text-secondary text-sm">Add courses first to create timetable slots.</p>
              <Button onClick={() => { setActiveTab("courses"); openAddCourse(); }} size="sm" className="mt-3">
                Go to Courses
              </Button>
            </Card>
          )}
          {timetableSlots.length === 0 && courses.length > 0 ? (
            <EmptyState
              icon={Calendar}
              message="No timetable slots yet."
              action={
                <Button onClick={openAddSlot} size="sm">
                  <Plus className="w-4 h-4" /> Add Slot
                </Button>
              }
            />
          ) : (
            <div className="space-y-5">
              {DAYS_SHORT.map((day) => {
                const daySlots = timetableSlots
                  .filter((s) => s.day === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                if (daySlots.length === 0) return null;
                return (
                  <div key={day}>
                    <h3 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wide">{day}</h3>
                    <div className="space-y-2">
                      {daySlots.map((slot) => (
                        <Card key={slot.id} className="flex items-center gap-3">
                          <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: getCourseColor(courses, slot.courseId) }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary">{getCourseName(courses, slot.courseId)}</p>
                            <p className="text-xs text-text-secondary">
                              {slot.startTime} – {slot.endTime}
                              {slot.venue && ` · ${slot.venue}`}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openEditSlot(slot)} className="p-1 text-text-secondary hover:text-text-primary transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteSlot(slot.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors">
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
        </div>
      )}

      {/* ── PLANNER ──────────────────────────────────────────────────────────── */}
      {activeTab === "planner" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{studyPlans.length} plan{studyPlans.length !== 1 ? "s" : ""}</p>
            <Button onClick={openAddPlan} size="sm" disabled={courses.length === 0}>
              <Plus className="w-4 h-4" /> Add Plan
            </Button>
          </div>
          {courses.length === 0 && (
            <Card className="text-center py-6">
              <p className="text-text-secondary text-sm">Add courses first to create study plans.</p>
              <Button onClick={() => { setActiveTab("courses"); openAddCourse(); }} size="sm" className="mt-3">
                Go to Courses
              </Button>
            </Card>
          )}
          {studyPlans.length === 0 && courses.length > 0 ? (
            <EmptyState
              icon={Target}
              message="No study plans yet."
              action={
                <Button onClick={openAddPlan} size="sm">
                  <Plus className="w-4 h-4" /> Add Plan
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3">
              {studyPlans.map((plan) => (
                <Card key={plan.id} className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: getCourseColor(courses, plan.courseId) }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-text-primary">{getCourseName(courses, plan.courseId)}</h3>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEditPlan(plan)} className="p-1 text-text-secondary hover:text-text-primary transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deletePlan(plan.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary">
                      {plan.frequencyPerWeek}× per week · {formatMins(plan.durationMinutes)} per session
                    </p>
                    {plan.notes && <p className="text-xs text-text-secondary mt-1">{plan.notes}</p>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ASSIGNMENTS ──────────────────────────────────────────────────────── */}
      {activeTab === "assignments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {(["all", "pending", "in-progress", "done"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAssignmentFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors",
                    assignmentFilter === f
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:text-text-primary bg-card border border-border"
                  )}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
            <Button onClick={openAddAssignment} size="sm">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
          {sortedAssignments.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              message="No assignments found."
              action={
                <Button onClick={openAddAssignment} size="sm">
                  <Plus className="w-4 h-4" /> Add Assignment
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {sortedAssignments.map((a) => (
                <Card key={a.id} className={cn("flex items-start gap-3", a.status === "done" && "opacity-60")}>
                  <button
                    onClick={() => toggleAssignment(a.id)}
                    className={cn(
                      "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      a.status === "done"
                        ? "bg-green-500 border-green-500"
                        : "border-border hover:border-primary"
                    )}
                  >
                    {a.status === "done" && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={cn("font-medium text-sm text-text-primary truncate", a.status === "done" && "line-through")}>
                          {a.title}
                        </p>
                        {a.courseId && (
                          <p className="text-xs text-text-secondary">{getCourseName(courses, a.courseId)}</p>
                        )}
                        {a.dueDate && (
                          <p className={cn("text-xs mt-0.5", daysUntil(a.dueDate) < 0 ? "text-red-400" : daysUntil(a.dueDate) === 0 ? "text-yellow-400" : "text-text-secondary")}>
                            Due: {a.dueDate}
                            {daysUntil(a.dueDate) === 0 && " (today)"}
                            {daysUntil(a.dueDate) < 0 && ` (${Math.abs(daysUntil(a.dueDate))}d overdue)`}
                          </p>
                        )}
                        {a.description && (
                          <p className="text-xs text-text-secondary mt-1 line-clamp-1">{a.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full whitespace-nowrap", {
                          "bg-yellow-500/10 text-yellow-400": a.status === "pending",
                          "bg-blue-500/10 text-blue-400": a.status === "in-progress",
                          "bg-green-500/10 text-green-400": a.status === "done",
                        })}>
                          {a.status}
                        </span>
                        <button onClick={() => openEditAssignment(a)} className="p-1 text-text-secondary hover:text-text-primary transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteAssignment(a.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EXAMS ────────────────────────────────────────────────────────────── */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{exams.length} exam{exams.length !== 1 ? "s" : ""} scheduled</p>
            <Button onClick={openAddExam} size="sm" disabled={courses.length === 0}>
              <Plus className="w-4 h-4" /> Add Exam
            </Button>
          </div>
          {courses.length === 0 && (
            <Card className="text-center py-6">
              <p className="text-text-secondary text-sm">Add courses first to schedule exams.</p>
              <Button onClick={() => { setActiveTab("courses"); openAddCourse(); }} size="sm" className="mt-3">
                Go to Courses
              </Button>
            </Card>
          )}
          {sortedExams.length === 0 && courses.length > 0 ? (
            <EmptyState
              icon={Award}
              message="No exams scheduled yet."
              action={
                <Button onClick={openAddExam} size="sm">
                  <Plus className="w-4 h-4" /> Schedule Exam
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {sortedExams.map((exam) => {
                const days = daysUntil(exam.date);
                const isPast = days < 0;
                const urgencyColor = isPast
                  ? "text-text-secondary"
                  : days < 7
                  ? "text-red-400"
                  : days < 14
                  ? "text-yellow-400"
                  : "text-green-400";
                const borderColor = isPast
                  ? ""
                  : days < 7
                  ? "border-red-400/40"
                  : days < 14
                  ? "border-yellow-400/40"
                  : "border-green-400/40";
                return (
                  <Card key={exam.id} className={cn("flex items-start gap-3", borderColor)}>
                    <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: getCourseColor(courses, exam.courseId) }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-text-primary">{getCourseName(courses, exam.courseId)}</p>
                          <p className="text-xs text-text-secondary mt-0.5">
                            {exam.date}
                            {exam.venue && ` · ${exam.venue}`}
                          </p>
                          {exam.notes && <p className="text-xs text-text-secondary mt-1">{exam.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("text-sm font-bold", urgencyColor)}>
                            {isPast ? "Past" : days === 0 ? "Today!" : `${days}d`}
                          </span>
                          <button onClick={() => openEditExam(exam)} className="p-1 text-text-secondary hover:text-text-primary transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteExam(exam.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SESSIONS ─────────────────────────────────────────────────────────── */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{hoursThisWeek.toFixed(1)}h</span> studied this week
            </p>
            <Button onClick={openAddSession} size="sm" disabled={courses.length === 0}>
              <Plus className="w-4 h-4" /> Log Session
            </Button>
          </div>
          {courses.length === 0 && (
            <Card className="text-center py-6">
              <p className="text-text-secondary text-sm">Add courses first to log study sessions.</p>
              <Button onClick={() => { setActiveTab("courses"); openAddCourse(); }} size="sm" className="mt-3">
                Go to Courses
              </Button>
            </Card>
          )}
          {sessions.length === 0 && courses.length > 0 ? (
            <EmptyState
              icon={Clock}
              message="No sessions logged yet."
              action={
                <Button onClick={openAddSession} size="sm">
                  <Plus className="w-4 h-4" /> Log Session
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {[...sessions]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((session) => (
                  <Card key={session.id} className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: getCourseColor(courses, session.courseId) }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm text-text-primary">{getCourseName(courses, session.courseId)}</p>
                          <p className="text-xs text-text-secondary">
                            {session.date} · {formatMins(session.durationMinutes)}
                          </p>
                          {session.notes && (
                            <p className="text-xs text-text-secondary mt-1">{session.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  "w-3.5 h-3.5",
                                  s <= session.rating ? "text-yellow-400 fill-yellow-400" : "text-border fill-border"
                                )}
                              />
                            ))}
                          </div>
                          <button onClick={() => deleteSession(session.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── ROUTINE ──────────────────────────────────────────────────────────── */}
      {activeTab === "routine" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{routineSlots.length} routine slot{routineSlots.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAIRoutine(true)}>
                <Sparkles className="w-4 h-4" /> AI Create
              </Button>
              <Button onClick={openAddRoutine} size="sm">
                <Plus className="w-4 h-4" /> Add Slot
              </Button>
            </div>
          </div>
          {routineSlots.length === 0 ? (
            <EmptyState
              icon={Clock}
              message="No routine slots yet."
              action={
                <Button onClick={openAddRoutine} size="sm">
                  <Plus className="w-4 h-4" /> Add Slot
                </Button>
              }
            />
          ) : (
            <div className="space-y-5">
              {DAYS_FULL.map((day) => {
                const daySlots = routineSlots
                  .filter((r) => r.day === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                if (daySlots.length === 0) return null;
                return (
                  <div key={day}>
                    <h3 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wide">{day}</h3>
                    <div className="space-y-2">
                      {daySlots.map((slot) => (
                        <Card key={slot.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary">{slot.title}</p>
                            <p className="text-xs text-text-secondary">{slot.startTime} – {slot.endTime}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openEditRoutine(slot)} className="p-1 text-text-secondary hover:text-text-primary transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteRoutine(slot.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors">
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
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────────────── */}

      {/* Course modal */}
      {showCourse && (
        <Modal
          title={editingCourse ? "Edit Course" : "Add Course"}
          onClose={() => setShowCourse(false)}
        >
          <div className="space-y-3">
            <Input
              label="Course Name"
              value={courseForm.name}
              onChange={(e) => setCourseForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Introduction to Computer Science"
            />
            <Input
              label="Lecturer"
              value={courseForm.lecturer}
              onChange={(e) => setCourseForm((f) => ({ ...f, lecturer: e.target.value }))}
              placeholder="e.g. Dr. Smith"
            />
            <Input
              label="Credit Units"
              type="number"
              value={courseForm.creditUnits}
              onChange={(e) => setCourseForm((f) => ({ ...f, creditUnits: parseInt(e.target.value) || 0 }))}
              min={0}
              max={12}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary font-medium">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COURSE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setCourseForm((f) => ({ ...f, color: c.value }))}
                    className={cn(
                      "w-7 h-7 rounded-full transition-transform",
                      courseForm.color === c.value && "ring-2 ring-offset-2 ring-offset-card ring-white scale-110"
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
            <TextareaField
              label="Notes"
              value={courseForm.notes}
              onChange={(v) => setCourseForm((f) => ({ ...f, notes: v }))}
              placeholder="Any notes about this course..."
              rows={3}
            />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowCourse(false)}>Cancel</Button>
              <Button onClick={saveCourseForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Timetable slot modal */}
      {showSlot && (
        <Modal
          title={editingSlot ? "Edit Slot" : "Add Timetable Slot"}
          onClose={() => setShowSlot(false)}
        >
          <div className="space-y-3">
            <SelectField
              label="Course"
              value={slotForm.courseId}
              onChange={(v) => setSlotForm((f) => ({ ...f, courseId: v }))}
            >
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <SelectField
              label="Day"
              value={slotForm.day}
              onChange={(v) => setSlotForm((f) => ({ ...f, day: v }))}
            >
              {DAYS_SHORT.map((d) => <option key={d} value={d}>{d}</option>)}
            </SelectField>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Time"
                type="time"
                value={slotForm.startTime}
                onChange={(e) => setSlotForm((f) => ({ ...f, startTime: e.target.value }))}
              />
              <Input
                label="End Time"
                type="time"
                value={slotForm.endTime}
                onChange={(e) => setSlotForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </div>
            <Input
              label="Venue"
              value={slotForm.venue}
              onChange={(e) => setSlotForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder="e.g. Room 101"
            />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowSlot(false)}>Cancel</Button>
              <Button onClick={saveSlotForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Study plan modal */}
      {showPlan && (
        <Modal
          title={editingPlan ? "Edit Study Plan" : "Add Study Plan"}
          onClose={() => setShowPlan(false)}
        >
          <div className="space-y-3">
            <SelectField
              label="Course"
              value={planForm.courseId}
              onChange={(v) => setPlanForm((f) => ({ ...f, courseId: v }))}
            >
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <Input
              label="Frequency per week"
              type="number"
              value={planForm.frequencyPerWeek}
              onChange={(e) => setPlanForm((f) => ({ ...f, frequencyPerWeek: parseInt(e.target.value) || 1 }))}
              min={1}
              max={14}
            />
            <Input
              label="Duration per session (minutes)"
              type="number"
              value={planForm.durationMinutes}
              onChange={(e) => setPlanForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value) || 15 }))}
              min={15}
            />
            <TextareaField
              label="Notes"
              value={planForm.notes}
              onChange={(v) => setPlanForm((f) => ({ ...f, notes: v }))}
              placeholder="Optional notes..."
            />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowPlan(false)}>Cancel</Button>
              <Button onClick={savePlanForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assignment modal */}
      {showAssignment && (
        <Modal
          title={editingAssignment ? "Edit Assignment" : "Add Assignment"}
          onClose={() => setShowAssignment(false)}
        >
          <div className="space-y-3">
            <Input
              label="Title"
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Assignment title"
            />
            <SelectField
              label="Course"
              value={assignmentForm.courseId}
              onChange={(v) => setAssignmentForm((f) => ({ ...f, courseId: v }))}
            >
              <option value="">No course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <Input
              label="Due Date"
              type="date"
              value={assignmentForm.dueDate}
              onChange={(e) => setAssignmentForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
            <SelectField
              label="Status"
              value={assignmentForm.status}
              onChange={(v) => setAssignmentForm((f) => ({ ...f, status: v as Assignment["status"] }))}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </SelectField>
            <TextareaField
              label="Description"
              value={assignmentForm.description}
              onChange={(v) => setAssignmentForm((f) => ({ ...f, description: v }))}
              placeholder="Optional description..."
            />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowAssignment(false)}>Cancel</Button>
              <Button onClick={saveAssignmentForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Exam modal */}
      {showExam && (
        <Modal
          title={editingExam ? "Edit Exam" : "Schedule Exam"}
          onClose={() => setShowExam(false)}
        >
          <div className="space-y-3">
            <SelectField
              label="Course"
              value={examForm.courseId}
              onChange={(v) => setExamForm((f) => ({ ...f, courseId: v }))}
            >
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <Input
              label="Date"
              type="date"
              value={examForm.date}
              onChange={(e) => setExamForm((f) => ({ ...f, date: e.target.value }))}
            />
            <Input
              label="Venue"
              value={examForm.venue}
              onChange={(e) => setExamForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder="e.g. Hall A"
            />
            <TextareaField
              label="Notes"
              value={examForm.notes}
              onChange={(v) => setExamForm((f) => ({ ...f, notes: v }))}
              placeholder="Topics covered, notes..."
            />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowExam(false)}>Cancel</Button>
              <Button onClick={saveExamForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Session modal */}
      {showSession && (
        <Modal title="Log Study Session" onClose={() => setShowSession(false)}>
          <div className="space-y-3">
            <SelectField
              label="Course"
              value={sessionForm.courseId}
              onChange={(v) => setSessionForm((f) => ({ ...f, courseId: v }))}
            >
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <Input
              label="Duration (minutes)"
              type="number"
              value={sessionForm.durationMinutes}
              onChange={(e) => setSessionForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value) || 1 }))}
              min={1}
            />
            <Input
              label="Date"
              type="date"
              value={sessionForm.date}
              onChange={(e) => setSessionForm((f) => ({ ...f, date: e.target.value }))}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary font-medium">Performance Rating</label>
              <StarRating
                value={sessionForm.rating}
                onChange={(v) => setSessionForm((f) => ({ ...f, rating: v }))}
              />
            </div>
            <TextareaField
              label="Notes"
              value={sessionForm.notes}
              onChange={(v) => setSessionForm((f) => ({ ...f, notes: v }))}
              placeholder="What did you cover?"
            />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowSession(false)}>Cancel</Button>
              <Button onClick={saveSessionForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Routine slot modal */}
      {showRoutine && (
        <Modal
          title={editingRoutine ? "Edit Routine Slot" : "Add Routine Slot"}
          onClose={() => setShowRoutine(false)}
        >
          <div className="space-y-3">
            <Input
              label="Title"
              value={routineForm.title}
              onChange={(e) => setRoutineForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Morning study block"
            />
            <SelectField
              label="Day"
              value={routineForm.day}
              onChange={(v) => setRoutineForm((f) => ({ ...f, day: v }))}
            >
              {DAYS_FULL.map((d) => <option key={d} value={d}>{d}</option>)}
            </SelectField>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Time"
                type="time"
                value={routineForm.startTime}
                onChange={(e) => setRoutineForm((f) => ({ ...f, startTime: e.target.value }))}
              />
              <Input
                label="End Time"
                type="time"
                value={routineForm.endTime}
                onChange={(e) => setRoutineForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowRoutine(false)}>Cancel</Button>
              <Button onClick={saveRoutineForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
      {showAIRoutine && (
        <AIRoutineCreator
          modeName="Study"
          onConfirm={(slots: GeneratedRoutineSlot[]) => {
            const newSlots = slots.map((s) => ({ id: crypto.randomUUID(), ...s }));
            saveRoutine([...routineSlots, ...newSlots]);
          }}
          onClose={() => setShowAIRoutine(false)}
        />
      )}
      {showAIReview && (
        <AIModeReview
          modeName="Study"
          modeData={{ courses, timetableSlots, assignments, exams, sessions }}
          onClose={() => setShowAIReview(false)}
        />
      )}
    </div>
  );
}
