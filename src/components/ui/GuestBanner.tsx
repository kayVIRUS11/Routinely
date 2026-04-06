"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function GuestBanner() {
  const { isGuest } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (!isGuest || dismissed) return null;

  return (
    <div
      className="w-full bg-warning/10 border-b border-warning/20 px-4 flex items-center gap-3 shrink-0"
      style={{ height: 40, minHeight: 40 }}
    >
      <AlertCircle className="w-4 h-4 text-warning shrink-0" />
      <p className="text-sm text-warning flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span>You are in guest mode — your data is stored locally.</span>
        <span className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push("/sign-up")}
            className="font-semibold underline hover:no-underline transition-colors"
          >
            Create free account
          </button>
          <span className="text-warning/60">·</span>
          <button
            onClick={() => router.push("/sign-in")}
            className="font-semibold underline hover:no-underline transition-colors"
          >
            Sign in
          </button>
        </span>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-warning/60 hover:text-warning transition-colors"
        aria-label="Dismiss guest banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
