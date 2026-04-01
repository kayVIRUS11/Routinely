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
import toast from "react-hot-toast";

const MODES = [
  { id: "study", label: "Study", icon: BookOpen, description: "Courses, exams, study sessions" },
  { id: "professional", label: "Professional", icon: Briefcase, description: "Projects, meetings, deadlines" },
  { id: "fitness", label: "Fitness", icon: Dumbbell, description: "Workouts, metrics, streaks" },
  { id: "financial", label: "Financial", icon: DollarSign, description: "Budget, expenses, savings" },
  { id: "general", label: "General", icon: LayoutGrid, description: "Goals, habits, journal" },
  { id: "custom", label: "Create your own", icon: Plus, description: "Custom mode" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [characterName, setCharacterName] = useState("");
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [routineTitle, setRoutineTitle] = useState("");

  const toggleMode = (id: string) => {
    setSelectedModes((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    toast.success("First Step achievement unlocked!", {
      duration: 4000,
      icon: "⭐",
    });
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

        {/* Step 4: First routine */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Add your first routine</h1>
            <p className="text-text-secondary mb-6">
              Start with one daily routine, or skip and add later.
            </p>
            <div className="flex flex-col gap-4">
              <Input
                label="Routine name (optional)"
                placeholder="e.g. Morning workout, Study session..."
                value={routineTitle}
                onChange={(e) => setRoutineTitle(e.target.value)}
              />
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(5)} className="flex-1">
                  {routineTitle ? "Save & continue" : "Skip"} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Character created */}
        {step === 5 && (
          <div className="text-center animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                <Star className="w-12 h-12 text-white" />
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
                  <p className="text-xs text-text-secondary">Completed onboarding</p>
                </div>
                <div className="ml-auto text-xs text-warning font-medium">+50 XP</div>
              </div>
            </div>
            <Button size="lg" className="w-full" onClick={handleFinish}>
              Enter Routinely <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
