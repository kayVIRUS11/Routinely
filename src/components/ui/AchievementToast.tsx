"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface AchievementToastData {
  id: string;
  name: string;
  description: string;
  icon?: string;
  xp?: number;
}

// Global queue managed via a simple event emitter pattern
type Listener = (achievement: AchievementToastData) => void;
const listeners: Listener[] = [];

export function triggerAchievementToast(achievement: AchievementToastData) {
  listeners.forEach((l) => l(achievement));
}

function addListener(l: Listener) {
  listeners.push(l);
  return () => {
    const idx = listeners.indexOf(l);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function AchievementToastProvider() {
  const router = useRouter();
  const [queue, setQueue] = useState<AchievementToastData[]>([]);
  const [current, setCurrent] = useState<AchievementToastData | null>(null);
  const [visible, setVisible] = useState(false);
  const [shimmer, setShimmer] = useState(false);

  // Listen for new achievements
  useEffect(() => {
    const remove = addListener((achievement) => {
      setQueue((q) => [...q, achievement]);
    });
    return remove;
  }, []);

  // Process queue: show one at a time
  const showNext = useCallback(() => {
    setQueue((q) => {
      if (q.length === 0) return q;
      const [next, ...rest] = q;
      setCurrent(next);
      setVisible(true);
      setShimmer(true);
      setTimeout(() => setShimmer(false), 800);
      return rest;
    });
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      showNext();
    }
  }, [queue, current, showNext]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!visible || !current) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(null);
      }, 400);
    }, 5000);
    return () => clearTimeout(timer);
  }, [visible, current]);

  // After dismissal, check queue again
  useEffect(() => {
    if (!current && queue.length > 0) {
      setTimeout(showNext, 200);
    }
  }, [current, queue, showNext]);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => setCurrent(null), 400);
  };

  const handleClick = () => {
    dismiss();
    router.push("/profile");
  };

  if (!current) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-[9999] w-80 cursor-pointer",
        "transition-all duration-400 ease-out",
        visible
          ? "opacity-100 translate-y-0 translate-x-0"
          : "opacity-0 translate-y-[-20px]"
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "relative bg-card border-2 border-warning/60 rounded-2xl p-4 shadow-2xl",
          "flex items-center gap-4 overflow-hidden",
          shimmer && "animate-pulse"
        )}
      >
        {/* Shimmer overlay */}
        {shimmer && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-warning/10 to-transparent pointer-events-none animate-[shimmer_0.8s_ease-in-out]" />
        )}

        {/* Gold glow effect */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-warning/20 pointer-events-none" />

        {/* Badge icon */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl bg-warning/15 border border-warning/30 flex items-center justify-center">
            {current.icon ? (
              <span className="text-2xl">{current.icon}</span>
            ) : (
              <Star className="w-6 h-6 text-warning fill-current" />
            )}
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-xl ring-2 ring-warning/40 ring-offset-1 ring-offset-card" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-warning uppercase tracking-wider mb-0.5">
            Achievement Unlocked!
          </p>
          <p className="text-sm font-bold text-text-primary truncate">{current.name}</p>
          <p className="text-xs text-text-secondary truncate mt-0.5">{current.description}</p>
          {current.xp && (
            <p className="text-xs text-warning font-medium mt-1">+{current.xp} XP</p>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          className="shrink-0 p-1 text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Queue indicator */}
      {queue.length > 0 && (
        <div className="mt-1 flex justify-end">
          <span className="text-[10px] text-text-secondary">+{queue.length} more</span>
        </div>
      )}
    </div>
  );
}
