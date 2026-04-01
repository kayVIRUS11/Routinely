"use client";

import { useState, useEffect } from "react";
import {
  Briefcase, Plus, X, Edit2, Trash2, Check, Clock, Calendar,
  Target, ChevronDown, Tag, Users, FileText, Flame, Sparkles,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import AIRoutineCreator, { type GeneratedRoutineSlot } from "@/components/ui/AIRoutineCreator";
import AIModeReview from "@/components/ui/AIModeReview";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Project {
  id: string;
  title: string;
  description: string;
  status: "planning" | "active" | "completed" | "on-hold";
  deadline: string;
  priority: "low" | "medium" | "high";
  tags: string;
  progress: number;
}

interface Task {
  id: string;
  title: string;
  projectId: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  status: "todo" | "in-progress" | "done";
  notes: string;
}

interface DeepWorkBlock {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
  projectId: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: string;
  outcomes: string;
  projectId: string;
}

interface RoutineSlot {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TABS = ["Overview", "Projects", "Tasks", "Deep Work", "Meetings", "Routine"] as const;
type Tab = typeof TABS[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { mon, sun };
}

function isThisWeek(dateStr: string) {
  if (!dateStr) return false;
  const { mon, sun } = getWeekBounds();
  const d = new Date(dateStr);
  return d >= mon && d <= sun;
}

function dueDateColor(dueDate: string, status: string) {
  if (status === "done") return "text-text-secondary";
  if (!dueDate) return "";
  const now = new Date(); now.setHours(0,0,0,0);
  const d = new Date(dueDate); d.setHours(0,0,0,0);
  if (d < now) return "text-error";
  if (d.getTime() === now.getTime()) return "text-warning";
  return "text-success";
}

function blockMinutes(start: string, end: string) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

function nextDeadline(projects: Project[]) {
  const now = new Date();
  const upcoming = projects
    .filter(p => p.deadline && p.status !== "completed" && new Date(p.deadline) >= now)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  return upcoming[0] ?? null;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────

function SummaryBar({ projects, tasks, deepWork }: { projects: Project[]; tasks: Task[]; deepWork: DeepWorkBlock[] }) {
  const activeProjects = projects.filter(p => p.status === "active").length;
  const tasksDueWeek = tasks.filter(t => isThisWeek(t.dueDate) && t.status !== "done").length;
  const deepWorkHrs = deepWork.reduce((acc, b) => acc + blockMinutes(b.startTime, b.endTime), 0) / 60;
  const nd = nextDeadline(projects);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Active Projects", value: activeProjects, icon: <Briefcase size={16} /> },
        { label: "Tasks Due This Week", value: tasksDueWeek, icon: <Target size={16} /> },
        { label: "Deep Work Hrs/Wk", value: deepWorkHrs.toFixed(1), icon: <Clock size={16} /> },
        { label: "Next Deadline", value: nd ? nd.title : "—", icon: <Calendar size={16} />, small: true },
      ].map(s => (
        <Card key={s.label} className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-text-secondary text-xs">{s.icon}{s.label}</div>
          <div className={cn("font-bold text-text-primary", s.small ? "text-sm truncate" : "text-2xl")}>{s.value}</div>
        </Card>
      ))}
    </div>
  );
}

// ─── Projects Tab ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  planning: "text-warning",
  active: "text-success",
  completed: "text-primary",
  "on-hold": "text-text-secondary",
};

function ProjectsTab({ projects, setProjects }: { projects: Project[]; setProjects: (p: Project[]) => void }) {
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<Omit<Project, "id">>({ title: "", description: "", status: "planning", deadline: "", priority: "medium", tags: "", progress: 0 });

  const filtered = filter === "all" ? projects : projects.filter(p => p.status === filter);

  function openNew() { setEditing(null); setForm({ title: "", description: "", status: "planning", deadline: "", priority: "medium", tags: "", progress: 0 }); setShowModal(true); }
  function openEdit(p: Project) { setEditing(p); setForm({ title: p.title, description: p.description, status: p.status, deadline: p.deadline, priority: p.priority, tags: p.tags, progress: p.progress }); setShowModal(true); }
  function save() {
    if (!form.title.trim()) return;
    if (editing) setProjects(projects.map(p => p.id === editing.id ? { ...form, id: editing.id } : p));
    else setProjects([...projects, { ...form, id: Date.now().toString() }]);
    setShowModal(false);
  }
  function del(id: string) { setProjects(projects.filter(p => p.id !== id)); }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {["all", "planning", "active", "completed", "on-hold"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={cn("px-3 py-1 rounded-lg text-sm capitalize", filter === s ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-text-secondary hover:text-text-primary")}>{s}</button>
          ))}
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} /> New Project</Button>
      </div>
      {filtered.length === 0 && <p className="text-text-secondary text-sm text-center py-8">No projects. Add one!</p>}
      <div className="grid gap-3">
        {filtered.map(p => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-text-primary">{p.title}</span>
                  <span className={cn("text-xs capitalize font-medium", STATUS_COLORS[p.status])}>{p.status}</span>
                  <span className={cn("text-xs capitalize", p.priority === "high" ? "text-error" : p.priority === "medium" ? "text-warning" : "text-text-secondary")}>{p.priority}</span>
                </div>
                {p.description && <p className="text-text-secondary text-sm mb-2">{p.description}</p>}
                {p.deadline && <p className="text-xs text-text-secondary mb-2"><Calendar size={12} className="inline mr-1" />{p.deadline}</p>}
                {p.tags && <div className="flex gap-1 flex-wrap mb-2">{p.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>)}</div>}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-border rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }} /></div>
                  <span className="text-xs text-text-secondary">{p.progress}%</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(p)} className="text-text-secondary hover:text-primary p-1"><Edit2 size={14} /></button>
                <button onClick={() => del(p.id)} className="text-text-secondary hover:text-error p-1"><Trash2 size={14} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {showModal && (
        <Modal title={editing ? "Edit Project" : "New Project"} onClose={() => setShowModal(false)}>
          <div className="flex flex-col gap-3">
            <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Description</label><textarea className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Status</label><select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Project["status"] })}>{["planning","active","completed","on-hold"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Priority</label><select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Project["priority"] })}>{["low","medium","high"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <Input label="Deadline" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            <Input label="Tags (comma-separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Progress: {form.progress}%</label><input type="range" min={0} max={100} value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value) })} className="w-full" /></div>
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ tasks, setTasks, projects }: { tasks: Task[]; setTasks: (t: Task[]) => void; projects: Project[] }) {
  const [filterProject, setFilterProject] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<Omit<Task, "id">>({ title: "", projectId: "", priority: "medium", dueDate: "", status: "todo", notes: "" });

  const filtered = tasks.filter(t =>
    (filterProject === "all" || t.projectId === filterProject) &&
    (filterPriority === "all" || t.priority === filterPriority) &&
    (filterStatus === "all" || t.status === filterStatus)
  );

  function openNew() { setEditing(null); setForm({ title: "", projectId: "", priority: "medium", dueDate: "", status: "todo", notes: "" }); setShowModal(true); }
  function openEdit(t: Task) { setEditing(t); setForm({ title: t.title, projectId: t.projectId, priority: t.priority, dueDate: t.dueDate, status: t.status, notes: t.notes }); setShowModal(true); }
  function save() {
    if (!form.title.trim()) return;
    if (editing) setTasks(tasks.map(t => t.id === editing.id ? { ...form, id: editing.id } : t));
    else setTasks([...tasks, { ...form, id: Date.now().toString() }]);
    setShowModal(false);
  }
  function del(id: string) { setTasks(tasks.filter(t => t.id !== id)); }
  function toggle(t: Task) { setTasks(tasks.map(x => x.id === t.id ? { ...x, status: x.status === "done" ? "todo" : "done" } : x)); }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select className="px-2 py-1 rounded-lg bg-card border border-border text-text-secondary text-sm focus:outline-none" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <select className="px-2 py-1 rounded-lg bg-card border border-border text-text-secondary text-sm focus:outline-none" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="all">All Priorities</option>
            {["low","medium","high"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="px-2 py-1 rounded-lg bg-card border border-border text-text-secondary text-sm focus:outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            {["todo","in-progress","done"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} /> New Task</Button>
      </div>
      {filtered.length === 0 && <p className="text-text-secondary text-sm text-center py-8">No tasks found.</p>}
      <div className="flex flex-col gap-2">
        {filtered.map(t => {
          const proj = projects.find(p => p.id === t.projectId);
          return (
            <Card key={t.id} className="flex items-center gap-3">
              <button onClick={() => toggle(t)} className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", t.status === "done" ? "bg-success border-success" : "border-border hover:border-primary")}>{t.status === "done" && <Check size={10} className="text-white" />}</button>
              <div className="flex-1 min-w-0">
                <span className={cn("text-sm font-medium", t.status === "done" && "line-through text-text-secondary")}>{t.title}</span>
                <div className="flex gap-2 flex-wrap mt-0.5">
                  {proj && <span className="text-xs text-text-secondary">{proj.title}</span>}
                  <span className={cn("text-xs capitalize", t.priority === "high" ? "text-error" : t.priority === "medium" ? "text-warning" : "text-text-secondary")}>{t.priority}</span>
                  {t.dueDate && <span className={cn("text-xs", dueDateColor(t.dueDate, t.status))}>{t.dueDate}</span>}
                  <span className="text-xs text-text-secondary capitalize">{t.status}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(t)} className="text-text-secondary hover:text-primary p-1"><Edit2 size={14} /></button>
                <button onClick={() => del(t.id)} className="text-text-secondary hover:text-error p-1"><Trash2 size={14} /></button>
              </div>
            </Card>
          );
        })}
      </div>
      {showModal && (
        <Modal title={editing ? "Edit Task" : "New Task"} onClose={() => setShowModal(false)}>
          <div className="flex flex-col gap-3">
            <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Project</label><select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Priority</label><select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Task["priority"] })}>{["low","medium","high"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Status</label><select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Task["status"] })}>{["todo","in-progress","done"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Notes</label><textarea className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Deep Work Tab ────────────────────────────────────────────────────────────

function DeepWorkTab({ blocks, setBlocks, projects }: { blocks: DeepWorkBlock[]; setBlocks: (b: DeepWorkBlock[]) => void; projects: Project[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DeepWorkBlock | null>(null);
  const [form, setForm] = useState<Omit<DeepWorkBlock, "id">>({ title: "", day: "Mon", startTime: "09:00", endTime: "11:00", projectId: "" });

  function openNew() { setEditing(null); setForm({ title: "", day: "Mon", startTime: "09:00", endTime: "11:00", projectId: "" }); setShowModal(true); }
  function openEdit(b: DeepWorkBlock) { setEditing(b); setForm({ title: b.title, day: b.day, startTime: b.startTime, endTime: b.endTime, projectId: b.projectId }); setShowModal(true); }
  function save() {
    if (!form.title.trim()) return;
    if (editing) setBlocks(blocks.map(b => b.id === editing.id ? { ...form, id: editing.id } : b));
    else setBlocks([...blocks, { ...form, id: Date.now().toString() }]);
    setShowModal(false);
  }
  function del(id: string) { setBlocks(blocks.filter(b => b.id !== id)); }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openNew}><Plus size={14} /> New Block</Button>
      </div>
      {DAYS.map(day => {
        const dayBlocks = blocks.filter(b => b.day === day);
        if (dayBlocks.length === 0) return null;
        return (
          <div key={day} className="mb-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">{day}</h3>
            <div className="flex flex-col gap-2">
              {dayBlocks.map(b => {
                const proj = projects.find(p => p.id === b.projectId);
                return (
                  <Card key={b.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-text-primary text-sm">{b.title}</span>
                      <div className="flex gap-2 mt-0.5 text-xs text-text-secondary">
                        <span><Clock size={10} className="inline mr-1" />{b.startTime}–{b.endTime}</span>
                        <span>({Math.round(blockMinutes(b.startTime, b.endTime))}min)</span>
                        {proj && <span>{proj.title}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(b)} className="text-text-secondary hover:text-primary p-1"><Edit2 size={14} /></button>
                      <button onClick={() => del(b.id)} className="text-text-secondary hover:text-error p-1"><Trash2 size={14} /></button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
      {blocks.length === 0 && <p className="text-text-secondary text-sm text-center py-8">No deep work blocks scheduled.</p>}
      {showModal && (
        <Modal title={editing ? "Edit Block" : "New Deep Work Block"} onClose={() => setShowModal(false)}>
          <div className="flex flex-col gap-3">
            <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Day</label><select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Time" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
              <Input label="End Time" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Project (optional)</label><select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Meetings Tab ─────────────────────────────────────────────────────────────

function MeetingsTab({ meetings, setMeetings, projects }: { meetings: Meeting[]; setMeetings: (m: Meeting[]) => void; projects: Project[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [form, setForm] = useState<Omit<Meeting, "id">>({ title: "", date: "", time: "", participants: "", outcomes: "", projectId: "" });

  const sorted = [...meetings].sort((a, b) => b.date.localeCompare(a.date));

  function openNew() { setEditing(null); setForm({ title: "", date: new Date().toISOString().split("T")[0], time: "", participants: "", outcomes: "", projectId: "" }); setShowModal(true); }
  function openEdit(m: Meeting) { setEditing(m); setForm({ title: m.title, date: m.date, time: m.time, participants: m.participants, outcomes: m.outcomes, projectId: m.projectId }); setShowModal(true); }
  function save() {
    if (!form.title.trim()) return;
    if (editing) setMeetings(meetings.map(m => m.id === editing.id ? { ...form, id: editing.id } : m));
    else setMeetings([...meetings, { ...form, id: Date.now().toString() }]);
    setShowModal(false);
  }
  function del(id: string) { setMeetings(meetings.filter(m => m.id !== id)); }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openNew}><Plus size={14} /> Log Meeting</Button>
      </div>
      {sorted.length === 0 && <p className="text-text-secondary text-sm text-center py-8">No meetings logged.</p>}
      <div className="flex flex-col gap-3">
        {sorted.map(m => {
          const proj = projects.find(p => p.id === m.projectId);
          return (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-text-primary">{m.title}</span>
                  <div className="flex gap-2 flex-wrap mt-0.5 text-xs text-text-secondary">
                    <span><Calendar size={10} className="inline mr-1" />{m.date} {m.time}</span>
                    {m.participants && <span><Users size={10} className="inline mr-1" />{m.participants}</span>}
                    {proj && <span>{proj.title}</span>}
                  </div>
                  {m.outcomes && <p className="text-sm text-text-secondary mt-1">{m.outcomes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(m)} className="text-text-secondary hover:text-primary p-1"><Edit2 size={14} /></button>
                  <button onClick={() => del(m.id)} className="text-text-secondary hover:text-error p-1"><Trash2 size={14} /></button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {showModal && (
        <Modal title={editing ? "Edit Meeting" : "Log Meeting"} onClose={() => setShowModal(false)}>
          <div className="flex flex-col gap-3">
            <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              <Input label="Time" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
            <Input label="Participants" value={form.participants} onChange={e => setForm({ ...form, participants: e.target.value })} placeholder="Names..." />
            <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Outcomes / Notes</label><textarea className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={3} value={form.outcomes} onChange={e => setForm({ ...form, outcomes: e.target.value })} /></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Project (optional)</label><select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Routine Tab ──────────────────────────────────────────────────────────────

function RoutineTab({ slots, setSlots }: { slots: RoutineSlot[]; setSlots: (s: RoutineSlot[]) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RoutineSlot | null>(null);
  const [form, setForm] = useState<Omit<RoutineSlot, "id">>({ title: "", day: "Mon", startTime: "08:00", endTime: "09:00" });
  const [showAIRoutine, setShowAIRoutine] = useState(false);

  function openNew() { setEditing(null); setForm({ title: "", day: "Mon", startTime: "08:00", endTime: "09:00" }); setShowModal(true); }
  function openEdit(s: RoutineSlot) { setEditing(s); setForm({ title: s.title, day: s.day, startTime: s.startTime, endTime: s.endTime }); setShowModal(true); }
  function save() {
    if (!form.title.trim()) return;
    if (editing) setSlots(slots.map(s => s.id === editing.id ? { ...form, id: editing.id } : s));
    else setSlots([...slots, { ...form, id: Date.now().toString() }]);
    setShowModal(false);
  }
  function del(id: string) { setSlots(slots.filter(s => s.id !== id)); }

  return (
    <div>
      <div className="flex justify-end mb-4 gap-2">
        <Button size="sm" variant="secondary" onClick={() => setShowAIRoutine(true)}><Sparkles size={14} /> AI Create</Button>
        <Button size="sm" onClick={openNew}><Plus size={14} /> Add Slot</Button>
      </div>
      {DAYS.map(day => {
        const daySlots = slots.filter(s => s.day === day);
        if (daySlots.length === 0) return null;
        return (
          <div key={day} className="mb-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">{day}</h3>
            <div className="flex flex-col gap-2">
              {daySlots.map(s => (
                <Card key={s.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-text-primary text-sm">{s.title}</span>
                    <p className="text-xs text-text-secondary">{s.startTime}–{s.endTime}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(s)} className="text-text-secondary hover:text-primary p-1"><Edit2 size={14} /></button>
                    <button onClick={() => del(s.id)} className="text-text-secondary hover:text-error p-1"><Trash2 size={14} /></button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
      {slots.length === 0 && <p className="text-text-secondary text-sm text-center py-8">No routine slots added.</p>}
      {showModal && (
        <Modal title={editing ? "Edit Slot" : "New Slot"} onClose={() => setShowModal(false)}>
          <div className="flex flex-col gap-3">
            <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <div className="flex flex-col gap-1.5"><label className="text-sm text-text-secondary font-medium">Day</label><select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Time" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
              <Input label="End Time" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
      {showAIRoutine && (
        <AIRoutineCreator
          modeName="Professional"
          onConfirm={(aiSlots: GeneratedRoutineSlot[]) => {
            const newSlots = aiSlots.map((s) => ({ id: Date.now().toString() + Math.random(), ...s }));
            setSlots([...slots, ...newSlots]);
          }}
          onClose={() => setShowAIRoutine(false)}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ projects, tasks, deepWork, meetings }: { projects: Project[]; tasks: Task[]; deepWork: DeepWorkBlock[]; meetings: Meeting[] }) {
  const nd = nextDeadline(projects);
  const overdue = tasks.filter(t => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date());
  const activeProj = projects.filter(p => p.status === "active");

  return (
    <div className="grid gap-4">
      <Card>
        <h3 className="font-semibold text-text-primary mb-3">Active Projects</h3>
        {activeProj.length === 0 ? <p className="text-text-secondary text-sm">No active projects.</p> : (
          <div className="flex flex-col gap-2">
            {activeProj.map(p => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1"><span className="text-text-primary">{p.title}</span><span className="text-text-secondary">{p.progress}%</span></div>
                <div className="w-full bg-border rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${p.progress}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {nd && (
        <Card>
          <h3 className="font-semibold text-text-primary mb-1">Next Deadline</h3>
          <p className="text-text-primary">{nd.title}</p>
          <p className="text-text-secondary text-sm">{nd.deadline}</p>
        </Card>
      )}
      {overdue.length > 0 && (
        <Card className="border-error/30">
          <h3 className="font-semibold text-error mb-2">Overdue Tasks ({overdue.length})</h3>
          <div className="flex flex-col gap-1">
            {overdue.slice(0, 5).map(t => <p key={t.id} className="text-sm text-text-primary">{t.title} <span className="text-error text-xs">{t.dueDate}</span></p>)}
          </div>
        </Card>
      )}
      <Card>
        <h3 className="font-semibold text-text-primary mb-2">Recent Meetings</h3>
        {meetings.length === 0 ? <p className="text-text-secondary text-sm">No meetings logged.</p> : (
          <div className="flex flex-col gap-1">
            {[...meetings].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 3).map(m => (
              <div key={m.id} className="flex justify-between text-sm">
                <span className="text-text-primary">{m.title}</span>
                <span className="text-text-secondary">{m.date}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfessionalPage() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deepWork, setDeepWork] = useState<DeepWorkBlock[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [routine, setRoutine] = useState<RoutineSlot[]>([]);
  const [showAIReview, setShowAIReview] = useState(false);

  useEffect(() => {
    setProjects(JSON.parse(localStorage.getItem("prof_projects") ?? "[]"));
    setTasks(JSON.parse(localStorage.getItem("prof_tasks") ?? "[]"));
    setDeepWork(JSON.parse(localStorage.getItem("prof_deepwork") ?? "[]"));
    setMeetings(JSON.parse(localStorage.getItem("prof_meetings") ?? "[]"));
    setRoutine(JSON.parse(localStorage.getItem("prof_routine") ?? "[]"));
  }, []);

  useEffect(() => { localStorage.setItem("prof_projects", JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem("prof_tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("prof_deepwork", JSON.stringify(deepWork)); }, [deepWork]);
  useEffect(() => { localStorage.setItem("prof_meetings", JSON.stringify(meetings)); }, [meetings]);
  useEffect(() => { localStorage.setItem("prof_routine", JSON.stringify(routine)); }, [routine]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2 flex items-center gap-2"><Briefcase size={24} /> Professional</h1>
      <SummaryBar projects={projects} tasks={tasks} deepWork={deepWork} />
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors", tab === t ? "text-primary border-b-2 border-primary" : "text-text-secondary hover:text-text-primary")}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <>
          <OverviewTab projects={projects} tasks={tasks} deepWork={deepWork} meetings={meetings} />
          <div className="flex justify-end mt-4">
            <Button variant="secondary" size="sm" onClick={() => setShowAIReview(true)}>
              <Sparkles size={14} /> AI Review
            </Button>
          </div>
        </>
      )}
      {tab === "Projects" && <ProjectsTab projects={projects} setProjects={setProjects} />}
      {tab === "Tasks" && <TasksTab tasks={tasks} setTasks={setTasks} projects={projects} />}
      {tab === "Deep Work" && <DeepWorkTab blocks={deepWork} setBlocks={setDeepWork} projects={projects} />}
      {tab === "Meetings" && <MeetingsTab meetings={meetings} setMeetings={setMeetings} projects={projects} />}
      {tab === "Routine" && <RoutineTab slots={routine} setSlots={setRoutine} />}
      {showAIReview && (
        <AIModeReview
          modeName="Professional"
          modeData={{ projects, tasks, deepWork, meetings, routine }}
          onClose={() => setShowAIReview(false)}
        />
      )}
    </div>
  );
}
