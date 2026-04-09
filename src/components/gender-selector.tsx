"use client";

import { useStudioStore } from "@/store/studio-store";
import { cn } from "@/lib/utils";
import type { Gender } from "@/types/studio";

export function GenderSelector() {
  const { selectedGender, setGender } = useStudioStore();

  const options: { value: Gender; label: string; emoji: string }[] = [
    { value: "girl", label: "소녀", emoji: "👧" },
    { value: "boy", label: "소년", emoji: "👦" },
  ];

  return (
    <div className="flex gap-2 px-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setGender(opt.value)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95",
            selectedGender === opt.value
              ? "bg-primary text-white shadow-md shadow-primary/30"
              : "bg-surface text-muted border border-border hover:bg-surface-alt"
          )}
        >
          <span>{opt.emoji}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
