"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, Plus, X, Edit2, Trash2, Check,
  TrendingUp, TrendingDown, Target, AlertCircle,
  Clock, Calendar, Sparkles,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import AIRoutineCreator, { type GeneratedRoutineSlot } from "@/components/ui/AIRoutineCreator";
import AIModeReview from "@/components/ui/AIModeReview";

// ─── Interfaces ───────────────────────────────────────────────────────────────

const INCOME_CATEGORIES = ["salary", "freelance", "passive", "other"] as const;
type IncomeCategory = typeof INCOME_CATEGORIES[number];

const EXPENSE_CATEGORIES = ["food", "housing", "transport", "entertainment", "health", "utilities", "other"] as const;
type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

interface IncomeEntry {
  id: string;
  source: string;
  category: IncomeCategory;
  amount: number;
  date: string;
  notes: string;
}

interface ExpenseEntry {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes: string;
}

interface BudgetAllocation {
  id: string;
  category: string;
  allocatedAmount: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  notes: string;
}

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDayOfMonth: number;
  category: string;
  autoPay: boolean;
}

interface FinRoutineSlot {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type FinTab = "overview" | "income" | "expenses" | "budget" | "savings" | "bills" | "routine";

const TABS: { id: FinTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "budget", label: "Budget" },
  { id: "savings", label: "Savings" },
  { id: "bills", label: "Bills" },
  { id: "routine", label: "Routine" },
];

const CATEGORY_COLORS: Record<string, string> = {
  food: "#f97316", housing: "#3b82f6", transport: "#8b5cf6",
  entertainment: "#ec4899", health: "#22c55e", utilities: "#eab308",
  other: "#6b7280", salary: "#6366f1", freelance: "#14b8a6",
  passive: "#f59e0b",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadLS<T>(key: string): T[] {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T[]) : []; } catch { return []; }
}
function saveLS<T>(key: string, v: T[]): void { localStorage.setItem(key, JSON.stringify(v)); }

import { formatCurrency } from "@/lib/currency";

function fmt(amount: number): string {
  const currency =
    typeof window !== "undefined"
      ? (localStorage.getItem("settings_currency") ?? "USD")
      : "USD";
  return formatCurrency(amount, currency);
}

function getNextDueDate(day: number): Date {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), day);
  return thisMonth >= today ? thisMonth : new Date(today.getFullYear(), today.getMonth() + 1, day);
}

function daysUntilDate(d: Date): number {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
}

function currentMonthEntries<T extends { date: string }>(entries: T[]): T[] {
  const now = new Date();
  return entries.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message, action }: { icon: React.ElementType; message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Icon className="w-10 h-10 text-text-secondary/40" />
      <p className="text-text-secondary text-sm">{message}</p>
      {action}
    </div>
  );
}

function ProgressBar({ value, max, danger }: { value: number; max: number; danger?: boolean }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const over = value > max && max > 0;
  return (
    <div className="h-2 bg-border rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", over || danger ? "bg-red-500" : pct > 80 ? "bg-yellow-400" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-text-secondary font-medium">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
        {children}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-text-secondary font-medium">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState<FinTab>("overview");
  const [showAIRoutine, setShowAIRoutine] = useState(false);
  const [showAIReview, setShowAIReview] = useState(false);

  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [routineSlots, setRoutineSlots] = useState<FinRoutineSlot[]>([]);

  useEffect(() => {
    setIncomeEntries(loadLS<IncomeEntry>("fin_income"));
    setExpenseEntries(loadLS<ExpenseEntry>("fin_expenses"));
    setBudgetAllocations(loadLS<BudgetAllocation>("fin_budget"));
    setSavingsGoals(loadLS<SavingsGoal>("fin_savings"));
    setBills(loadLS<Bill>("fin_bills"));
    setRoutineSlots(loadLS<FinRoutineSlot>("fin_routine"));
  }, []);

  const saveIncome = (v: IncomeEntry[]) => { setIncomeEntries(v); saveLS("fin_income", v); };
  const saveExpenses = (v: ExpenseEntry[]) => { setExpenseEntries(v); saveLS("fin_expenses", v); };
  const saveBudget = (v: BudgetAllocation[]) => { setBudgetAllocations(v); saveLS("fin_budget", v); };
  const saveSavings = (v: SavingsGoal[]) => { setSavingsGoals(v); saveLS("fin_savings", v); };
  const saveBills = (v: Bill[]) => { setBills(v); saveLS("fin_bills", v); };
  const saveRoutine = (v: FinRoutineSlot[]) => { setRoutineSlots(v); saveLS("fin_routine", v); };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const monthIncome = currentMonthEntries(incomeEntries).reduce((a, e) => a + e.amount, 0);
  const monthExpenses = currentMonthEntries(expenseEntries).reduce((a, e) => a + e.amount, 0);
  const remaining = monthIncome - monthExpenses;

  const savingsProgress = savingsGoals.length > 0
    ? (savingsGoals.reduce((a, g) => a + (g.targetAmount > 0 ? Math.min(g.currentAmount / g.targetAmount, 1) : 0), 0) / savingsGoals.length) * 100
    : 0;

  const nextBill = [...bills].sort((a, b) => getNextDueDate(a.dueDayOfMonth).getTime() - getNextDueDate(b.dueDayOfMonth).getTime())[0];
  const nextBillDays = nextBill ? daysUntilDate(getNextDueDate(nextBill.dueDayOfMonth)) : null;

  // ── Expense breakdown ─────────────────────────────────────────────────────
  const expByCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenseEntries.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);
  const totalAllExp = Object.values(expByCategory).reduce((a, b) => a + b, 0);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showIncome, setShowIncome] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [incomeForm, setIncomeForm] = useState({ source: "", category: "salary" as IncomeCategory, amount: 0, date: new Date().toISOString().slice(0, 10), notes: "" });

  const [showExpense, setShowExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [expenseForm, setExpenseForm] = useState({ title: "", category: "food" as ExpenseCategory, amount: 0, date: new Date().toISOString().slice(0, 10), notes: "" });

  const [showBudget, setShowBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetAllocation | null>(null);
  const [budgetForm, setBudgetForm] = useState({ category: "food", allocatedAmount: 0 });

  const [showSavings, setShowSavings] = useState(false);
  const [editingSavings, setEditingSavings] = useState<SavingsGoal | null>(null);
  const [savingsForm, setSavingsForm] = useState({ name: "", targetAmount: 0, currentAmount: 0, deadline: "", notes: "" });

  const [showBill, setShowBill] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [billForm, setBillForm] = useState({ name: "", amount: 0, dueDayOfMonth: 1, category: "utilities", autoPay: false });

  const [showRoutine, setShowRoutine] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<FinRoutineSlot | null>(null);
  const [routineForm, setRoutineForm] = useState({ title: "", day: "Monday", startTime: "08:00", endTime: "09:00" });

  const todayStr = new Date().toISOString().slice(0, 10);

  // ── Income CRUD ───────────────────────────────────────────────────────────
  const openAddIncome = () => { setIncomeForm({ source: "", category: "salary", amount: 0, date: todayStr, notes: "" }); setEditingIncome(null); setShowIncome(true); };
  const openEditIncome = (e: IncomeEntry) => { setIncomeForm({ source: e.source, category: e.category, amount: e.amount, date: e.date, notes: e.notes }); setEditingIncome(e); setShowIncome(true); };
  const saveIncomeForm = () => {
    if (!incomeForm.source.trim()) return;
    if (editingIncome) { saveIncome(incomeEntries.map((e) => e.id === editingIncome.id ? { ...e, ...incomeForm } : e)); }
    else { saveIncome([...incomeEntries, { id: Date.now().toString(), ...incomeForm }]); }
    setShowIncome(false);
  };
  const deleteIncome = (id: string) => saveIncome(incomeEntries.filter((e) => e.id !== id));

  // ── Expense CRUD ──────────────────────────────────────────────────────────
  const openAddExpense = () => { setExpenseForm({ title: "", category: "food", amount: 0, date: todayStr, notes: "" }); setEditingExpense(null); setShowExpense(true); };
  const openEditExpense = (e: ExpenseEntry) => { setExpenseForm({ title: e.title, category: e.category, amount: e.amount, date: e.date, notes: e.notes }); setEditingExpense(e); setShowExpense(true); };
  const saveExpenseForm = () => {
    if (!expenseForm.title.trim()) return;
    if (editingExpense) { saveExpenses(expenseEntries.map((e) => e.id === editingExpense.id ? { ...e, ...expenseForm } : e)); }
    else { saveExpenses([...expenseEntries, { id: Date.now().toString(), ...expenseForm }]); }
    setShowExpense(false);
  };
  const deleteExpense = (id: string) => saveExpenses(expenseEntries.filter((e) => e.id !== id));

  // ── Budget CRUD ───────────────────────────────────────────────────────────
  const openAddBudget = () => { setBudgetForm({ category: "food", allocatedAmount: 0 }); setEditingBudget(null); setShowBudget(true); };
  const openEditBudget = (b: BudgetAllocation) => { setBudgetForm({ category: b.category, allocatedAmount: b.allocatedAmount }); setEditingBudget(b); setShowBudget(true); };
  const saveBudgetForm = () => {
    if (editingBudget) { saveBudget(budgetAllocations.map((b) => b.id === editingBudget.id ? { ...b, ...budgetForm } : b)); }
    else { saveBudget([...budgetAllocations, { id: Date.now().toString(), ...budgetForm }]); }
    setShowBudget(false);
  };
  const deleteBudget = (id: string) => saveBudget(budgetAllocations.filter((b) => b.id !== id));

  // ── Savings CRUD ──────────────────────────────────────────────────────────
  const openAddSavings = () => { setSavingsForm({ name: "", targetAmount: 0, currentAmount: 0, deadline: "", notes: "" }); setEditingSavings(null); setShowSavings(true); };
  const openEditSavings = (g: SavingsGoal) => { setSavingsForm({ name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount, deadline: g.deadline, notes: g.notes }); setEditingSavings(g); setShowSavings(true); };
  const saveSavingsForm = () => {
    if (!savingsForm.name.trim()) return;
    if (editingSavings) { saveSavings(savingsGoals.map((g) => g.id === editingSavings.id ? { ...g, ...savingsForm } : g)); }
    else { saveSavings([...savingsGoals, { id: Date.now().toString(), ...savingsForm }]); }
    setShowSavings(false);
  };
  const deleteSavingsGoal = (id: string) => saveSavings(savingsGoals.filter((g) => g.id !== id));
  const updateSavedAmount = (id: string, delta: number) => {
    saveSavings(savingsGoals.map((g) => g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount + delta) } : g));
  };

  // ── Bills CRUD ────────────────────────────────────────────────────────────
  const openAddBill = () => { setBillForm({ name: "", amount: 0, dueDayOfMonth: 1, category: "utilities", autoPay: false }); setEditingBill(null); setShowBill(true); };
  const openEditBill = (b: Bill) => { setBillForm({ name: b.name, amount: b.amount, dueDayOfMonth: b.dueDayOfMonth, category: b.category, autoPay: b.autoPay }); setEditingBill(b); setShowBill(true); };
  const saveBillForm = () => {
    if (!billForm.name.trim()) return;
    if (editingBill) { saveBills(bills.map((b) => b.id === editingBill.id ? { ...b, ...billForm } : b)); }
    else { saveBills([...bills, { id: Date.now().toString(), ...billForm }]); }
    setShowBill(false);
  };
  const deleteBill = (id: string) => saveBills(bills.filter((b) => b.id !== id));

  // ── Routine CRUD ──────────────────────────────────────────────────────────
  const openAddRoutine = () => { setRoutineForm({ title: "", day: "Monday", startTime: "08:00", endTime: "09:00" }); setEditingRoutine(null); setShowRoutine(true); };
  const openEditRoutine = (r: FinRoutineSlot) => { setRoutineForm({ title: r.title, day: r.day, startTime: r.startTime, endTime: r.endTime }); setEditingRoutine(r); setShowRoutine(true); };
  const saveRoutineForm = () => {
    if (!routineForm.title.trim()) return;
    if (editingRoutine) { saveRoutine(routineSlots.map((r) => r.id === editingRoutine.id ? { ...r, ...routineForm } : r)); }
    else { saveRoutine([...routineSlots, { id: Date.now().toString(), ...routineForm }]); }
    setShowRoutine(false);
  };
  const deleteRoutine = (id: string) => saveRoutine(routineSlots.filter((r) => r.id !== id));

  const sortedBills = [...bills].sort((a, b) => getNextDueDate(a.dueDayOfMonth).getTime() - getNextDueDate(b.dueDayOfMonth).getTime());

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-primary" />
          Financial Mode
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">Track your money, hit your goals</p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="text-center">
          <p className="text-lg font-bold text-green-400">{fmt(monthIncome)}</p>
          <p className="text-xs text-text-secondary mt-1">Income This Month</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-red-400">{fmt(monthExpenses)}</p>
          <p className="text-xs text-text-secondary mt-1">Expenses This Month</p>
        </Card>
        <Card className="text-center">
          <p className={cn("text-lg font-bold", remaining >= 0 ? "text-primary" : "text-red-400")}>{fmt(remaining)}</p>
          <p className="text-xs text-text-secondary mt-1">Remaining</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-yellow-400">{savingsProgress.toFixed(0)}%</p>
          <p className="text-xs text-text-secondary mt-1">Savings Goals</p>
        </Card>
        <Card className="text-center col-span-2 md:col-span-1">
          {nextBill ? (
            <>
              <p className="text-sm font-semibold text-text-primary truncate">{nextBill.name}</p>
              <p className="text-xs text-text-secondary mt-1">in {nextBillDays}d · {fmt(nextBill.amount)}</p>
            </>
          ) : (
            <p className="text-sm text-text-secondary">No bills</p>
          )}
          <p className="text-xs text-text-secondary">Next Bill</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg",
              activeTab === tab.id ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-text-secondary hover:text-text-primary")}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: TrendingUp, color: "text-green-400", value: fmt(monthIncome), label: "Income" },
              { icon: TrendingDown, color: "text-red-400", value: fmt(monthExpenses), label: "Expenses" },
              { icon: Target, color: "text-yellow-400", value: `${savingsGoals.length}`, label: "Savings Goals" },
              { icon: AlertCircle, color: "text-orange-400", value: `${bills.length}`, label: "Recurring Bills" },
            ].map(({ icon: Icon, color, value, label }) => (
              <Card key={label} className="text-center">
                <Icon className={cn("w-6 h-6 mx-auto mb-2", color)} />
                <p className="text-lg font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-secondary">{label}</p>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Add Income", tab: "income" as FinTab, action: openAddIncome },
              { label: "Add Expense", tab: "expenses" as FinTab, action: openAddExpense },
              { label: "Add Savings Goal", tab: "savings" as FinTab, action: openAddSavings },
              { label: "Add Bill", tab: "bills" as FinTab, action: openAddBill },
            ].map(({ label, tab, action }) => (
              <Button key={label} variant="secondary" size="sm" onClick={() => { setActiveTab(tab); action(); }} className="justify-start">
                <Plus className="w-4 h-4" /> {label}
              </Button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowAIReview(true)}>
              <Sparkles className="w-4 h-4" /> AI Review
            </Button>
          </div>
          {remaining < 0 && (
            <Card className="border-red-400/40">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">You&apos;ve spent {fmt(Math.abs(remaining))} more than you earned this month.</p>
              </div>
            </Card>
          )}
          {totalAllExp > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Expense Breakdown</h3>
              <div className="space-y-2">
                {EXPENSE_CATEGORIES.filter((c) => expByCategory[c] > 0).map((cat) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary capitalize">{cat}</span>
                      <span className="text-text-primary">{fmt(expByCategory[cat])} ({totalAllExp > 0 ? ((expByCategory[cat] / totalAllExp) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <ProgressBar value={expByCategory[cat]} max={totalAllExp} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── INCOME ───────────────────────────────────────────────────────────── */}
      {activeTab === "income" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Total: <span className="font-semibold text-green-400">{fmt(incomeEntries.reduce((a, e) => a + e.amount, 0))}</span></p>
            <Button onClick={openAddIncome} size="sm"><Plus className="w-4 h-4" /> Add Income</Button>
          </div>
          {incomeEntries.length === 0 ? (
            <EmptyState icon={TrendingUp} message="No income entries yet." action={<Button onClick={openAddIncome} size="sm"><Plus className="w-4 h-4" /> Add Income</Button>} />
          ) : (
            <div className="space-y-2">
              {[...incomeEntries].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => (
                <Card key={entry.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.category] ?? "#6366f1" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm text-text-primary">{entry.source}</p>
                        <p className="text-xs text-text-secondary capitalize">{entry.category} · {entry.date}</p>
                        {entry.notes && <p className="text-xs text-text-secondary mt-0.5">{entry.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-green-400 text-sm">{fmt(entry.amount)}</span>
                        <button onClick={() => openEditIncome(entry)} className="p-1 text-text-secondary hover:text-text-primary transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteIncome(entry.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EXPENSES ─────────────────────────────────────────────────────────── */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Total: <span className="font-semibold text-red-400">{fmt(expenseEntries.reduce((a, e) => a + e.amount, 0))}</span></p>
            <Button onClick={openAddExpense} size="sm"><Plus className="w-4 h-4" /> Add Expense</Button>
          </div>
          {totalAllExp > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">By Category</h3>
              <div className="space-y-2">
                {EXPENSE_CATEGORIES.filter((c) => expByCategory[c] > 0).map((cat) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-text-secondary">{cat}</span>
                      <span className="text-text-primary">{fmt(expByCategory[cat])} · {((expByCategory[cat] / totalAllExp) * 100).toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={expByCategory[cat]} max={totalAllExp} />
                  </div>
                ))}
              </div>
            </Card>
          )}
          {expenseEntries.length === 0 ? (
            <EmptyState icon={TrendingDown} message="No expenses yet." action={<Button onClick={openAddExpense} size="sm"><Plus className="w-4 h-4" /> Add Expense</Button>} />
          ) : (
            <div className="space-y-2">
              {[...expenseEntries].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => (
                <Card key={entry.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.category] ?? "#6366f1" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm text-text-primary">{entry.title}</p>
                        <p className="text-xs text-text-secondary capitalize">{entry.category} · {entry.date}</p>
                        {entry.notes && <p className="text-xs text-text-secondary mt-0.5">{entry.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-red-400 text-sm">{fmt(entry.amount)}</span>
                        <button onClick={() => openEditExpense(entry)} className="p-1 text-text-secondary hover:text-text-primary transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteExpense(entry.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BUDGET ───────────────────────────────────────────────────────────── */}
      {activeTab === "budget" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{budgetAllocations.length} categor{budgetAllocations.length !== 1 ? "ies" : "y"} allocated</p>
            <Button onClick={openAddBudget} size="sm"><Plus className="w-4 h-4" /> Add Allocation</Button>
          </div>
          {budgetAllocations.length === 0 ? (
            <EmptyState icon={Target} message="No budget allocations yet." action={<Button onClick={openAddBudget} size="sm"><Plus className="w-4 h-4" /> Add Allocation</Button>} />
          ) : (
            <div className="space-y-3">
              {budgetAllocations.map((alloc) => {
                const spent = expenseEntries.filter((e) => e.category === alloc.category).reduce((s, e) => s + e.amount, 0);
                const over = spent > alloc.allocatedAmount;
                return (
                  <Card key={alloc.id} className={cn(over && "border-red-400/40")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[alloc.category] ?? "#6366f1" }} />
                        <span className="text-sm font-medium text-text-primary capitalize">{alloc.category}</span>
                        {over && <span className="text-xs text-red-400 font-medium">Over budget!</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-semibold", over ? "text-red-400" : "text-text-primary")}>
                          {fmt(spent)} / {fmt(alloc.allocatedAmount)}
                        </span>
                        <button onClick={() => openEditBudget(alloc)} className="p-1 text-text-secondary hover:text-text-primary transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteBudget(alloc.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <ProgressBar value={spent} max={alloc.allocatedAmount} danger={over} />
                    <p className="text-xs text-text-secondary mt-1">{alloc.allocatedAmount > 0 ? ((spent / alloc.allocatedAmount) * 100).toFixed(0) : 0}% used</p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SAVINGS ──────────────────────────────────────────────────────────── */}
      {activeTab === "savings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{savingsGoals.length} goal{savingsGoals.length !== 1 ? "s" : ""}</p>
            <Button onClick={openAddSavings} size="sm"><Plus className="w-4 h-4" /> Add Goal</Button>
          </div>
          {savingsGoals.length === 0 ? (
            <EmptyState icon={Target} message="No savings goals yet." action={<Button onClick={openAddSavings} size="sm"><Plus className="w-4 h-4" /> Add Goal</Button>} />
          ) : (
            <div className="space-y-3">
              {savingsGoals.map((goal) => {
                const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
                const done = goal.currentAmount >= goal.targetAmount;
                return (
                  <Card key={goal.id} className={cn(done && "border-green-400/40")}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-text-primary">{goal.name}</p>
                          {done && <Check className="w-4 h-4 text-green-400" />}
                        </div>
                        {goal.deadline && <p className="text-xs text-text-secondary mt-0.5">Target: {goal.deadline}</p>}
                        {goal.notes && <p className="text-xs text-text-secondary mt-0.5">{goal.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateSavedAmount(goal.id, -100)} className="px-2 py-0.5 text-xs bg-card border border-border rounded text-text-secondary hover:text-text-primary">-$100</button>
                        <button onClick={() => updateSavedAmount(goal.id, 100)} className="px-2 py-0.5 text-xs bg-primary/10 border border-primary/30 rounded text-primary hover:bg-primary/20">+$100</button>
                        <button onClick={() => openEditSavings(goal)} className="p-1 text-text-secondary hover:text-text-primary transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteSavingsGoal(goal.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
                    <div className="flex justify-between text-xs text-text-secondary mt-1">
                      <span>{fmt(goal.currentAmount)} saved</span>
                      <span>{pct.toFixed(0)}% of {fmt(goal.targetAmount)}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── BILLS ────────────────────────────────────────────────────────────── */}
      {activeTab === "bills" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{bills.length} recurring bill{bills.length !== 1 ? "s" : ""}</p>
            <Button onClick={openAddBill} size="sm"><Plus className="w-4 h-4" /> Add Bill</Button>
          </div>
          {bills.length === 0 ? (
            <EmptyState icon={Calendar} message="No recurring bills yet." action={<Button onClick={openAddBill} size="sm"><Plus className="w-4 h-4" /> Add Bill</Button>} />
          ) : (
            <div className="space-y-2">
              {sortedBills.map((bill) => {
                const nextDate = getNextDueDate(bill.dueDayOfMonth);
                const days = daysUntilDate(nextDate);
                return (
                  <Card key={bill.id} className={cn(days <= 3 && "border-red-400/40", days <= 7 && days > 3 && "border-yellow-400/40")}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-text-primary">{bill.name}</p>
                          {bill.autoPay && <span className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">Auto-pay</span>}
                        </div>
                        <p className="text-xs text-text-secondary capitalize mt-0.5">{bill.category} · Due day {bill.dueDayOfMonth}</p>
                        <p className={cn("text-xs mt-0.5", days <= 3 ? "text-red-400" : days <= 7 ? "text-yellow-400" : "text-text-secondary")}>
                          Next due: {nextDate.toLocaleDateString()} ({days === 0 ? "today!" : `in ${days}d`})
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-text-primary">{fmt(bill.amount)}</span>
                        <button onClick={() => openEditBill(bill)} className="p-1 text-text-secondary hover:text-text-primary transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteBill(bill.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ROUTINE ──────────────────────────────────────────────────────────── */}
      {activeTab === "routine" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{routineSlots.length} slot{routineSlots.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAIRoutine(true)}><Sparkles className="w-4 h-4" /> AI Create</Button>
              <Button onClick={openAddRoutine} size="sm"><Plus className="w-4 h-4" /> Add Slot</Button>
            </div>
          </div>
          {routineSlots.length === 0 ? (
            <EmptyState icon={Clock} message="No routine slots yet." action={<Button onClick={openAddRoutine} size="sm"><Plus className="w-4 h-4" /> Add Slot</Button>} />
          ) : (
            <div className="space-y-5">
              {DAYS_FULL.map((day) => {
                const daySlots = routineSlots.filter((r) => r.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
                if (daySlots.length === 0) return null;
                return (
                  <div key={day}>
                    <h3 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wide">{day}</h3>
                    <div className="space-y-2">
                      {daySlots.map((slot) => (
                        <Card key={slot.id} className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text-primary">{slot.title}</p>
                            <p className="text-xs text-text-secondary">{slot.startTime} – {slot.endTime}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openEditRoutine(slot)} className="p-1 text-text-secondary hover:text-text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteRoutine(slot.id)} className="p-1 text-text-secondary hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

      {showIncome && (
        <Modal title={editingIncome ? "Edit Income" : "Add Income"} onClose={() => setShowIncome(false)}>
          <div className="space-y-3">
            <Input label="Source" value={incomeForm.source} onChange={(e) => setIncomeForm((f) => ({ ...f, source: e.target.value }))} placeholder="e.g. Monthly salary" />
            <SelectField label="Category" value={incomeForm.category} onChange={(v) => setIncomeForm((f) => ({ ...f, category: v as IncomeCategory }))}>
              {INCOME_CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </SelectField>
            <Input label="Amount ($)" type="number" value={incomeForm.amount} onChange={(e) => setIncomeForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} min={0} step={0.01} />
            <Input label="Date" type="date" value={incomeForm.date} onChange={(e) => setIncomeForm((f) => ({ ...f, date: e.target.value }))} />
            <TextareaField label="Notes" value={incomeForm.notes} onChange={(v) => setIncomeForm((f) => ({ ...f, notes: v }))} placeholder="Optional notes..." />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowIncome(false)}>Cancel</Button>
              <Button onClick={saveIncomeForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}

      {showExpense && (
        <Modal title={editingExpense ? "Edit Expense" : "Add Expense"} onClose={() => setShowExpense(false)}>
          <div className="space-y-3">
            <Input label="Title" value={expenseForm.title} onChange={(e) => setExpenseForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Groceries" />
            <SelectField label="Category" value={expenseForm.category} onChange={(v) => setExpenseForm((f) => ({ ...f, category: v as ExpenseCategory }))}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </SelectField>
            <Input label="Amount ($)" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} min={0} step={0.01} />
            <Input label="Date" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))} />
            <TextareaField label="Notes" value={expenseForm.notes} onChange={(v) => setExpenseForm((f) => ({ ...f, notes: v }))} placeholder="Optional notes..." />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowExpense(false)}>Cancel</Button>
              <Button onClick={saveExpenseForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}

      {showBudget && (
        <Modal title={editingBudget ? "Edit Allocation" : "Add Budget Allocation"} onClose={() => setShowBudget(false)}>
          <div className="space-y-3">
            <SelectField label="Category" value={budgetForm.category} onChange={(v) => setBudgetForm((f) => ({ ...f, category: v }))}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </SelectField>
            <Input label="Monthly Budget ($)" type="number" value={budgetForm.allocatedAmount} onChange={(e) => setBudgetForm((f) => ({ ...f, allocatedAmount: parseFloat(e.target.value) || 0 }))} min={0} step={0.01} />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowBudget(false)}>Cancel</Button>
              <Button onClick={saveBudgetForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}

      {showSavings && (
        <Modal title={editingSavings ? "Edit Goal" : "Add Savings Goal"} onClose={() => setShowSavings(false)}>
          <div className="space-y-3">
            <Input label="Goal Name" value={savingsForm.name} onChange={(e) => setSavingsForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Emergency fund" />
            <Input label="Target Amount ($)" type="number" value={savingsForm.targetAmount} onChange={(e) => setSavingsForm((f) => ({ ...f, targetAmount: parseFloat(e.target.value) || 0 }))} min={0} step={0.01} />
            <Input label="Current Saved ($)" type="number" value={savingsForm.currentAmount} onChange={(e) => setSavingsForm((f) => ({ ...f, currentAmount: parseFloat(e.target.value) || 0 }))} min={0} step={0.01} />
            <Input label="Deadline" type="date" value={savingsForm.deadline} onChange={(e) => setSavingsForm((f) => ({ ...f, deadline: e.target.value }))} />
            <TextareaField label="Notes" value={savingsForm.notes} onChange={(v) => setSavingsForm((f) => ({ ...f, notes: v }))} placeholder="Optional notes..." />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowSavings(false)}>Cancel</Button>
              <Button onClick={saveSavingsForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}

      {showBill && (
        <Modal title={editingBill ? "Edit Bill" : "Add Bill"} onClose={() => setShowBill(false)}>
          <div className="space-y-3">
            <Input label="Bill Name" value={billForm.name} onChange={(e) => setBillForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Netflix" />
            <Input label="Amount ($)" type="number" value={billForm.amount} onChange={(e) => setBillForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} min={0} step={0.01} />
            <Input label="Due Day of Month (1–31)" type="number" value={billForm.dueDayOfMonth} onChange={(e) => setBillForm((f) => ({ ...f, dueDayOfMonth: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) }))} min={1} max={31} />
            <SelectField label="Category" value={billForm.category} onChange={(v) => setBillForm((f) => ({ ...f, category: v }))}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </SelectField>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="autoPay" checked={billForm.autoPay} onChange={(e) => setBillForm((f) => ({ ...f, autoPay: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
              <label htmlFor="autoPay" className="text-sm text-text-secondary">Auto-pay enabled</label>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowBill(false)}>Cancel</Button>
              <Button onClick={saveBillForm}>Save</Button>
            </div>
          </div>
        </Modal>
      )}

      {showRoutine && (
        <Modal title={editingRoutine ? "Edit Routine Slot" : "Add Routine Slot"} onClose={() => setShowRoutine(false)}>
          <div className="space-y-3">
            <Input label="Title" value={routineForm.title} onChange={(e) => setRoutineForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Review finances" />
            <SelectField label="Day" value={routineForm.day} onChange={(v) => setRoutineForm((f) => ({ ...f, day: v }))}>
              {DAYS_FULL.map((d) => <option key={d} value={d}>{d}</option>)}
            </SelectField>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Time" type="time" value={routineForm.startTime} onChange={(e) => setRoutineForm((f) => ({ ...f, startTime: e.target.value }))} />
              <Input label="End Time" type="time" value={routineForm.endTime} onChange={(e) => setRoutineForm((f) => ({ ...f, endTime: e.target.value }))} />
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
          modeName="Financial"
          onConfirm={(slots: GeneratedRoutineSlot[]) => {
            const newSlots = slots.map((s) => ({ id: crypto.randomUUID(), ...s }));
            saveRoutine([...routineSlots, ...newSlots]);
          }}
          onClose={() => setShowAIRoutine(false)}
        />
      )}
      {showAIReview && (
        <AIModeReview
          modeName="Financial"
          modeData={{ incomeEntries, expenseEntries, budgetAllocations, savingsGoals, bills }}
          onClose={() => setShowAIReview(false)}
        />
      )}
    </div>
  );
}
