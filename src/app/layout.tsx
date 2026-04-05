import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AchievementToastProvider } from "@/components/ui/AchievementToast";
import { TimerProvider } from "@/contexts/TimerContext";

export const metadata: Metadata = {
  title: "Routinely - Your Personal Operating System",
  description: "Manage your routines, track your progress, and level up your life",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-text-primary antialiased">
        <TimerProvider>
          {children}
        </TimerProvider>
        <AchievementToastProvider />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              color: "#f1f1f1",
              border: "1px solid #2a2a2a",
            },
          }}
        />
      </body>
    </html>
  );
}
