"use client";

import { useStudioStore } from "@/store/studio-store";
import { cn } from "@/lib/utils";
import type { Gender } from "@/types/studio";

const OPTIONS: { value: Gender; label: string; emoji: string }[] = [
  { value: "girl", label: "소녀", emoji: "👧" },
  { value: "boy", label: "소년", emoji: "👦" },
];

export function GenderSelector() {
  const { selectedGender, setGender } = useStudioStore();

  return (
    <div className="flex gap-2 px-3">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => setGender(o.value)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95",
            selectedGender === o.value
              ? "bg-[var(--color-primary)] text-white shadow-md"
              : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
          )}
        >
          <span>{o.emoji}</span>
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}
