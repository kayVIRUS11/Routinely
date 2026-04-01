"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, X, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface GeneratedRoutineSlot {
  title: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface AIRoutineCreatorProps {
  modeName: string;
  onConfirm: (slots: GeneratedRoutineSlot[]) => void;
  onClose: () => void;
}

export default function AIRoutineCreator({ modeName, onConfirm, onClose }: AIRoutineCreatorProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedRoutineSlot[]>([]);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"input" | "review">("input");

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Create a weekly routine for ${modeName} mode based on this description: "${description}". Return ONLY a JSON array of routine slots. Each slot must have: "title" (string), "day" (one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday), "startTime" (HH:MM 24h format), "endTime" (HH:MM 24h format). Example: [{"title":"Study Maths","day":"Monday","startTime":"09:00","endTime":"10:30"}]. Generate 5-10 slots spread across the week.`,
          context: { type: "routine_creation", mode: modeName },
        }),
      });

      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? "Request failed");
      }

      const data = await res.json() as { response: string };
      const text: string = data.response;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("AI returned unexpected format");
      const slots = JSON.parse(jsonMatch[0]) as GeneratedRoutineSlot[];
      if (!Array.isArray(slots) || slots.length === 0) throw new Error("No slots generated");
      setGenerated(slots);
      setStep("review");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.includes("not configured") || msg.includes("503")) {
        setError("AI is not configured yet. Add your GEMINI_API_KEY to enable this feature.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeSlot = (idx: number) => {
    setGenerated((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">AI Routine Creator</h3>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "input" && (
          <>
            <p className="text-sm text-text-secondary mb-4">
              Describe your schedule or preferences in plain language and Gemini AI will generate a
              structured weekly routine for your {modeName} mode.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`e.g. "I want to study Maths, Physics, and Chemistry every weekday. Heavier load mid-week, and I have classes in the mornings so sessions should be afternoons."`}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none mb-4"
            />
            {error && (
              <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
              <Button
                onClick={() => void handleGenerate()}
                disabled={!description.trim() || loading}
                className="flex-1"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate routine</>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "review" && (
          <>
            <p className="text-sm text-text-secondary mb-4">
              Review the generated routine below. Remove any slots you don&apos;t want, then confirm.
            </p>
            <div className="flex flex-col gap-2 mb-5">
              {generated.map((slot, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 bg-background border border-border rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{slot.title}</p>
                    <p className="text-xs text-text-secondary">
                      {slot.day} · {slot.startTime} – {slot.endTime}
                    </p>
                  </div>
                  <button
                    onClick={() => removeSlot(i)}
                    className="text-text-secondary hover:text-error transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {generated.length === 0 && (
              <p className="text-center text-text-secondary text-sm py-4">No slots remaining.</p>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("input")} className="flex-1">
                Edit description
              </Button>
              <Button
                onClick={() => { onConfirm(generated); onClose(); }}
                disabled={generated.length === 0}
                className="flex-1"
              >
                <Check className="w-4 h-4" />
                Confirm routine
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
