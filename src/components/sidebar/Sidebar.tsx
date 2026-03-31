"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Timer,
  BookOpen,
  Briefcase,
  Dumbbell,
  DollarSign,
  LayoutGrid,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", icon: Home, label: "Home Hub" },
  { href: "/pomodoro", icon: Timer, label: "Pomodoro" },
];

const modeItems = [
  { href: "/study", icon: BookOpen, label: "Study", badge: 3 },
  { href: "/professional", icon: Briefcase, label: "Professional", badge: 2 },
  { href: "/fitness", icon: Dumbbell, label: "Fitness", badge: 0 },
  { href: "/financial", icon: DollarSign, label: "Financial", badge: 1 },
  { href: "/general", icon: LayoutGrid, label: "General", badge: 0 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);

  return (
    <aside
      className="fixed left-0 top-0 h-full z-50 flex flex-col bg-sidebar border-r border-border transition-all duration-300 ease-in-out"
      style={{ width: hovered ? "220px" : "52px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-3.5 border-b border-border shrink-0 overflow-hidden">
        <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">R</span>
        </div>
        {hovered && (
          <span className="ml-3 text-text-primary font-semibold text-sm whitespace-nowrap">
            Routinely
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 flex flex-col gap-1 overflow-hidden">
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            {...item}
            active={pathname === item.href}
            expanded={hovered}
          />
        ))}

        {/* Divider */}
        <div className="my-2 mx-3 border-t border-border" />

        {/* Mode items */}
        {modeItems.map((item) => (
          <SidebarItem
            key={item.href}
            {...item}
            active={pathname.startsWith(item.href)}
            expanded={hovered}
          />
        ))}

        {/* Add mode */}
        <button className={cn(
          "flex items-center mx-2 px-2 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-card transition-colors duration-200 gap-3",
          "overflow-hidden whitespace-nowrap"
        )}>
          <Plus className="w-4 h-4 shrink-0" />
          {hovered && <span className="text-sm">New Mode</span>}
        </button>
      </nav>

      {/* Bottom items */}
      <div className="py-3 border-t border-border flex flex-col gap-1 overflow-hidden">
        <SidebarItem
          href="/settings"
          icon={Settings}
          label="Settings"
          active={pathname === "/settings"}
          expanded={hovered}
        />
        <SidebarItem
          href="/profile"
          icon={User}
          label="Profile"
          active={pathname === "/profile"}
          expanded={hovered}
        />
      </div>
    </aside>
  );
}

interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  expanded?: boolean;
  badge?: number;
}

function SidebarItem({ href, icon: Icon, label, active, expanded, badge }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center mx-2 px-2 py-2 rounded-lg transition-colors duration-200 gap-3 overflow-hidden whitespace-nowrap",
        active
          ? "bg-primary/10 text-primary"
          : "text-text-secondary hover:text-text-primary hover:bg-card"
      )}
    >
      <div className="relative shrink-0">
        <Icon className="w-4 h-4" />
        {badge && badge > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-medium">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </div>
      {expanded && <span className="text-sm">{label}</span>}
    </Link>
  );
}
