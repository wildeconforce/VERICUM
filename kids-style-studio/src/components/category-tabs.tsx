"use client";

import { useStudioStore } from "@/store/studio-store";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/types/studio";
import type { ItemCategory } from "@/types/studio";
import { cn } from "@/lib/utils";

const ICONS: Record<ItemCategory, string> = {
  hair: "💇",
  expression: "😊",
  makeup: "💄",
  innerwear: "👕",
  tops: "👚",
  bottoms: "👖",
  shoes: "👟",
  accessories: "🎀",
};

export function CategoryTabs() {
  const { activeCategory, setActiveCategory } = useStudioStore();

  return (
    <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
      {CATEGORY_ORDER.map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveCategory(cat)}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all active:scale-95",
            activeCategory === cat
              ? "bg-[var(--color-primary)] text-white shadow-md"
              : "bg-white text-gray-500 hover:bg-pink-50"
          )}
        >
          <span className="text-base">{ICONS[cat]}</span>
          <span>{CATEGORY_LABELS[cat]}</span>
        </button>
      ))}
    </div>
  );
}
