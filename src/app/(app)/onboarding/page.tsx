"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  Dumbbell,
  DollarSign,
  LayoutGrid,
  Plus,
  Sparkles,
  Star,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { db, makeRecord } from "@/db/db";
import type { DbUser, DbAchievement, DbRoutine } from "@/db/db";
import { triggerAchievementToast } from "@/components/ui/AchievementToast";
import { useAuth } from "@/contexts/AuthContext";

const MODES = [
  { id: "study", label: "Study", icon: BookOpen, description: "Courses, exams, study sessions" },
  { id: "professional", label: "Professional", icon: Briefcase, description: "Projects, meetings, deadlines" },
  { id: "fitness", label: "Fitness", icon: Dumbbell, description: "Workouts, metrics, streaks" },
  { id: "financial", label: "Financial", icon: DollarSign, description: "Budget, expenses, savings" },
  { id: "general", label: "General", icon: LayoutGrid, description: "Goals, habits, journal" },
  { id: "custom", label: "Create your own", icon: Plus, description: "Custom mode" },
];

const AVATARS = [
  { key: "star", emoji: "⭐", label: "Star" },
  { key: "rocket", emoji: "🚀", label: "Rocket" },
  { key: "brain", emoji: "🧠", label: "Brain" },
  { key: "fire", emoji: "🔥", label: "Fire" },
  { key: "diamond", emoji: "💎", label: "Diamond" },
  { key: "crown", emoji: "👑", label: "Crown" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const [step, setStep] = useState(1);
  const [characterName, setCharacterName] = useState("");
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [routineTitle, setRoutineTitle] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("star");
  const [saving, setSaving] = useState(false);

  const toggleMode = (id: string) => {
    setSelectedModes((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const getUserId = (): string | null => {
    if (user?.id) return user.id;
    if (typeof window === "undefined") return null;
    return localStorage.getItem("routinely_guest_user_id");
  };

  const handleFinish = async () => {
    setSaving(true);
    const userId = getUserId();

    try {
      const now = new Date().toISOString();

      // Save user profile to Dexie
      const userRecord = makeRecord<DbUser>({
        name: characterName.trim() || null,
        email: user?.email ?? null,
        avatar_key: selectedAvatar,
        onboarding_complete: true,
        is_guest: isGuest,
        xp: 50,
        level: 1,
      }, userId);
      await db.users.add(userRecord);

      // Save first routine if provided
      if (routineTitle.trim()) {
        const routine = makeRecord<DbRoutine>({
          mode_id: selectedModes[0] ?? null,
          title: routineTitle.trim(),
          description: null,
          day_of_week: [1, 2, 3, 4, 5],
          start_time: "09:00",
          end_time: "10:00",
          is_active: true,
        }, userId);
        await db.routines.add(routine);
      }

      // Award First Step achievement
      const achievement = makeRecord<DbAchievement>({
        name: "First Step",
        description: "You've taken your first step toward a more organised life.",
        icon: "⭐",
        earned_at: now,
        xp: 50,
      }, userId);
      await db.achievements.add(achievement);

      // Show achievement toast
      triggerAchievementToast({
        id: "first_step",
        name: "First Step",
        description: "You've taken your first step toward a more organised life.",
        icon: "⭐",
        xp: 50,
      });

      // Legacy localStorage flag for compatibility
      if (typeof window !== "undefined") {
        localStorage.setItem("onboarding_complete", "true");
      }
    } catch {
      // Silently handle DB errors — still navigate to home
    } finally {
      setSaving(false);
    }

    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-10">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                s === step ? "w-6 bg-primary" : s < step ? "w-4 bg-primary/50" : "w-4 bg-border"
              )}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-3">Welcome to Routinely</h1>
            <p className="text-text-secondary mb-10 text-lg">
              Your personal operating system. Let us set you up in 2 minutes.
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" className="w-full" onClick={() => setStep(2)}>
                Get started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="lg" className="w-full" onClick={handleFinish}>
                Skip setup
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Character name */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-text-primary mb-2">What should we call you?</h1>
            <p className="text-text-secondary mb-6">This is your character name in Routinely.</p>
            <div className="flex flex-col gap-4">
              <Input
                label="Character name"
                placeholder="e.g. Alex, The Achiever, Study Wizard..."
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!characterName.trim()}
                  className="flex-1"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pick modes */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Choose your modes</h1>
            <p className="text-text-secondary mb-6">Select the areas of life you want to track.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                const selected = selectedModes.includes(mode.id);
                return (
                  <button
                    key={mode.id}
                    onClick={() => toggleMode(mode.id)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all duration-200 relative",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-border/80"
                    )}
                  >
                    {selected && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <Icon className={cn("w-5 h-5 mb-2", selected ? "text-primary" : "text-text-secondary")} />
                    <p className={cn("text-sm font-medium", selected ? "text-primary" : "text-text-primary")}>
                      {mode.label}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">{mode.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={selectedModes.length === 0}
                className="flex-1"
              >
                Continue ({selectedModes.length} selected)
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Character creation — avatar */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Create your character</h1>
            <p className="text-text-secondary mb-2">
              Pick an avatar and add your first routine (optional).
            </p>

            {/* Avatar grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {AVATARS.map((av) => (
                <button
                  key={av.key}
                  onClick={() => setSelectedAvatar(av.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200",
                    selectedAvatar === av.key
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-border/80"
                  )}
                >
                  <span className="text-3xl">{av.emoji}</span>
                  <span className={cn("text-xs", selectedAvatar === av.key ? "text-primary" : "text-text-secondary")}>
                    {av.label}
                  </span>
                </button>
              ))}
            </div>

            {/* First routine (optional) */}
            <Input
              label="First routine (optional)"
              placeholder="e.g. Morning workout, Study session..."
              value={routineTitle}
              onChange={(e) => setRoutineTitle(e.target.value)}
              className="mb-5"
            />

            {/* Character stats preview */}
            <div className="bg-card border border-border rounded-xl p-4 mb-5">
              <p className="text-xs text-text-secondary mb-3 font-medium uppercase tracking-wide">Character stats — all at 0 now, they grow as you use the app</p>
              <div className="flex flex-col gap-2">
                {(["Focus", "Drive", "Vitality", "Wealth", "Balance"] as const).map((stat) => (
                  <div key={stat} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-14">{stat}</span>
                    <div className="flex-1 h-1.5 bg-border rounded-full" />
                    <span className="text-xs text-text-secondary">0</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(5)} className="flex-1">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: First Step achievement */}
        {step === 5 && (
          <div className="text-center animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-4xl">
                {AVATARS.find((a) => a.key === selectedAvatar)?.emoji ?? "⭐"}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-warning text-background text-xs font-bold px-2 py-0.5 rounded-full">
                Lv. 1
              </div>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {characterName || "Your character"} is ready!
            </h1>
            <p className="text-text-secondary mb-2">Level 1 &middot; 0 XP</p>
            <p className="text-text-secondary text-sm mb-8">
              You have earned the <span className="text-warning font-medium">&quot;First Step&quot;</span> achievement!
            </p>
            <div className="bg-card border border-warning/20 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">First Step</p>
                  <p className="text-xs text-text-secondary">You&apos;ve taken your first step toward a more organised life.</p>
                </div>
                <div className="ml-auto text-xs text-warning font-medium">+50 XP</div>
              </div>
            </div>
            <Button size="lg" loading={saving} className="w-full" onClick={handleFinish}>
              Let&apos;s go <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
