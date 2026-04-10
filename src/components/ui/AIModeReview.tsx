"use client";

import { useState } from "react";
import { Sparkles, X, Loader2, FileText, AlertCircle, LogIn } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface AIModeReviewProps {
  modeName: string;
  modeData: Record<string, unknown>;
  onClose: () => void;
}

export default function AIModeReview({ modeName, modeData, onClose }: AIModeReviewProps) {
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { session, isGuest } = useAuth();
  const router = useRouter();

  const generateReview = async () => {
    setLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: `Generate a detailed review and summary for the ${modeName} mode based on this data. Provide insights, patterns, recommendations, and encouragement. Format with clear sections using markdown-style headers (##). Data: ${JSON.stringify(modeData)}`,
          context: { type: "mode_review", mode: modeName, data: modeData },
        }),
      });

      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? "Request failed");
      }

      const data = await res.json() as { response: string };
      setReview(data.response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.includes("not configured") || msg.includes("503")) {
        setError("AI is not configured yet. Add your OPENROUTER_API_KEY to enable AI reviews.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">AI {modeName} Review</h3>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isGuest ? (
          <div className="flex flex-col items-center gap-4 py-8 flex-1 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-text-primary font-semibold mb-1">AI reviews require an account</p>
              <p className="text-sm text-text-secondary">
                Sign up for free to get personalised AI-powered mode reviews and insights.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>Not now</Button>
              <Button onClick={() => { onClose(); router.push("/sign-up"); }}>
                <LogIn className="w-4 h-4" />
                Sign up free
              </Button>
            </div>
          </div>
        ) : (
          <>
            {!review && !loading && !error && (
              <div className="flex flex-col items-center gap-4 py-8 flex-1">
                <Sparkles className="w-12 h-12 text-primary/40" />
                <p className="text-text-secondary text-center text-sm max-w-sm">
                  Generate a comprehensive AI review of your {modeName} mode — covering patterns,
                  progress, and personalised recommendations.
                </p>
                <p className="text-xs text-text-secondary">
                  This is generated on-demand and is never pushed automatically.
                </p>
                <Button onClick={() => void generateReview()}>
                  <Sparkles className="w-4 h-4" />
                  Generate {modeName} review
                </Button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center gap-4 py-8 flex-1">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-text-secondary text-sm">Analysing your {modeName} data…</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col gap-4 flex-1">
                <div className="flex items-start gap-2 p-4 bg-error/10 border border-error/20 rounded-xl text-sm text-error">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={onClose} className="flex-1">Close</Button>
                  <Button onClick={() => void generateReview()} className="flex-1">Retry</Button>
                </div>
              </div>
            )}

            {review && !loading && (
              <>
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="prose prose-invert prose-sm max-w-none">
                    {review.split("\n").map((line, i) => {
                      if (line.startsWith("## ")) {
                        return <h3 key={i} className="text-base font-semibold text-text-primary mt-4 mb-2 first:mt-0">{line.slice(3)}</h3>;
                      }
                      if (line.startsWith("# ")) {
                        return <h2 key={i} className="text-lg font-bold text-text-primary mt-4 mb-2 first:mt-0">{line.slice(2)}</h2>;
                      }
                      if (line.startsWith("- ") || line.startsWith("• ")) {
                        return <p key={i} className="text-sm text-text-secondary flex gap-2 mb-1"><span className="text-primary">•</span><span>{line.slice(2)}</span></p>;
                      }
                      if (!line.trim()) return <div key={i} className="h-2" />;
                      return <p key={i} className="text-sm text-text-secondary mb-2">{line}</p>;
                    })}
                  </div>
                </div>
                <div className="flex gap-3 mt-5 shrink-0">
                  <Button variant="secondary" onClick={onClose} className="flex-1">Close</Button>
                  <Button onClick={() => void generateReview()} className="flex-1">
                    <Sparkles className="w-4 h-4" />
                    Regenerate
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
