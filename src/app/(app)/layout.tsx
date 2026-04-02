"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import GuestBanner from "@/components/ui/GuestBanner";
import { AIFloatingButton, NaturalLanguageInput } from "@/components/ui/AIAssistant";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-[52px] flex flex-col">
        <GuestBanner />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <AIFloatingButton onClick={() => setAiOpen(true)} />
      {aiOpen && (
        <NaturalLanguageInput
          onClose={() => setAiOpen(false)}
          placeholder="Ask me to add tasks, log expenses, create routines, or anything else!"
        />
      )}
    </div>
  );
}
