"use client";

import { useState, useRef } from "react";
import { Sparkles, X, Send, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

interface NaturalLanguageInputProps {
  onClose: () => void;
  context?: Record<string, unknown>;
  placeholder?: string;
  title?: string;
}

export function NaturalLanguageInput({ onClose, context, placeholder, title }: NaturalLanguageInputProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { session, isGuest } = useAuth();

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session && !isGuest) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMsg,
          context: {
            ...context,
            type: "natural_language_input",
            conversationHistory: messages,
          },
          ...(isGuest ? { guest: true } : {}),
        }),
      });

      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? "Request failed");
      }

      const data = await res.json() as { response: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.includes("not configured") || msg.includes("503")) {
        setError("AI is not configured yet. Add your GEMINI_API_KEY to enable AI features.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-text-primary">
              {title ?? "AI Assistant"}
            </h3>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-10 h-10 text-primary/40 mx-auto mb-3" />
              <p className="text-text-secondary text-sm">
                {placeholder ?? "Ask me anything — I can add tasks, log expenses, create routines, and more."}
              </p>
              <div className="mt-4 flex flex-col gap-1.5">
                {[
                  "Add a Chemistry exam on Friday",
                  "Log ₦2,500 spent on food today",
                  "Remind me to review budget every Sunday",
                  "Generate a study routine for Maths and Physics",
                ].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setInput(ex)}
                    className="text-xs text-left px-3 py-2 bg-background rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 transition-all"
                  >
                    &quot;{ex}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] px-3 py-2 rounded-xl text-sm",
                msg.role === "user"
                  ? "bg-primary text-white self-end rounded-br-sm"
                  : "bg-background border border-border text-text-primary self-start rounded-bl-sm"
              )}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 self-start">
              <div className="w-8 h-8 bg-background border border-border rounded-xl flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <span className="text-xs text-text-secondary">Thinking…</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border shrink-0 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder="Type anything…"
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 bg-primary hover:bg-primary-hover disabled:opacity-50 rounded-lg flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Floating trigger button shown at bottom of every app page */
export function AIFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
      title="AI Assistant"
    >
      <Sparkles className="w-5 h-5 text-white" />
    </button>
  );
}
