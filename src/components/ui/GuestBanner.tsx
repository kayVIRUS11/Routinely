"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";

export default function GuestBanner() {
  const [isGuest, setIsGuest] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("routinely_is_guest") === "true"
  );
  const [dismissed, setDismissed] = useState(false);

  if (!isGuest || dismissed) return null;

  return (
    <div className="fixed top-0 left-[52px] right-0 z-40 bg-warning/10 border-b border-warning/20 px-4 py-2 flex items-center gap-3">
      <AlertCircle className="w-4 h-4 text-warning shrink-0" />
      <p className="text-sm text-warning flex-1">
        You are in guest mode — your data is stored locally and will be lost if you clear your
        browser.{" "}
        <Link href="/sign-up" className="font-semibold underline hover:no-underline">
          Create a free account
        </Link>{" "}
        to sync across devices.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-warning/60 hover:text-warning transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
