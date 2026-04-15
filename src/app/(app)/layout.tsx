"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import GuestBanner from "@/components/ui/GuestBanner";
import { AIFloatingButton, NaturalLanguageInput } from "@/components/ui/AIAssistant";
import PomodoroBar from "@/components/ui/PomodoroBar";
import QuickAddButton from "@/components/quick-add/QuickAddButton";
import { useTimer } from "@/contexts/TimerContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [aiOpen, setAiOpen] = useState(false);
  const { state } = useTimer();
  const timerActive = state.status !== "idle";

  return (
    <div className="flex min-h-screen bg-background">
      <PomodoroBar />
      <Sidebar />
      <div className="flex-1 ml-[52px] flex flex-col">
        {/* GuestBanner is in the document flow — it pushes content down */}
        <GuestBanner />
        <main
          className={[
            "flex-1 p-6",
            timerActive ? "pt-16" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </main>
      </div>
      <AIFloatingButton onClick={() => setAiOpen(true)} />
      <QuickAddButton />
      {aiOpen && (
        <NaturalLanguageInput
          onClose={() => setAiOpen(false)}
          placeholder="Ask me to add tasks, log expenses, create routines, or anything else!"
        />
      )}
    </div>
  );
}

