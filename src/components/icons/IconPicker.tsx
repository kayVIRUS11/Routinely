"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ICON_CATEGORIES, ICON_MAP, type IconKey } from "./icons";

interface IconPickerProps {
  value: string;
  onChange: (key: IconKey) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [category, setCategory] = useState(ICON_CATEGORIES[0]!.label);

  const currentCategory = ICON_CATEGORIES.find((c) => c.label === category) ?? ICON_CATEGORIES[0]!;

  return (
    <div>
      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ICON_CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => setCategory(cat.label)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
              category === cat.label
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-background text-text-secondary hover:text-text-primary",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Icon grid — 6 per row */}
      <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-1">
        {currentCategory.keys.map((key) => {
          const Icon = ICON_MAP[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              title={key.replace(/_/g, " ")}
              className={cn(
                "w-full aspect-square rounded-xl flex items-center justify-center border transition-all",
                value === key
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-background text-text-secondary hover:text-text-primary hover:border-border/60",
              )}
            >
              {Icon && <Icon className="w-5 h-5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
