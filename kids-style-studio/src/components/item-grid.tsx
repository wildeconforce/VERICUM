"use client";

import { useState } from "react";
import { useStudioStore } from "@/store/studio-store";
import { getItemsForCategory } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import type { StudioItem, ItemCategory } from "@/types/studio";

const GRADIENT: Record<ItemCategory, string> = {
  hair: "from-amber-200 to-amber-400",
  expression: "from-yellow-200 to-orange-300",
  makeup: "from-pink-200 to-rose-400",
  innerwear: "from-gray-100 to-gray-300",
  tops: "from-sky-200 to-blue-400",
  bottoms: "from-indigo-200 to-indigo-400",
  shoes: "from-emerald-200 to-emerald-400",
  accessories: "from-purple-200 to-violet-400",
};

function Thumb({ item }: { item: StudioItem }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className={cn("w-full aspect-square rounded-xl bg-gradient-to-br flex items-center justify-center", GRADIENT[item.category])}>
        <span className="text-[11px] font-bold text-white/90 text-center leading-tight px-1">{item.name}</span>
      </div>
    );
  }

  return (
    <div className="w-full aspect-square rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden p-1">
      <img
        src={item.thumbnail}
        alt={item.name}
        className="w-full h-full object-contain"
        draggable={false}
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export function ItemGrid() {
  const { activeCategory, selectedGender, character, equipItem, unequipItem } = useStudioStore();
  const items = getItemsForCategory(activeCategory, selectedGender);
  const equipped = character.equippedItems[activeCategory];

  const toggle = (item: StudioItem) => {
    equipped?.id === item.id ? unequipItem(activeCategory) : equipItem(item);
  };

  if (items.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-8">아직 아이템이 없어요</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-2 px-3 py-2 overflow-y-auto scrollbar-hide flex-1">
      {/* Reset */}
      <button
        onClick={() => unequipItem(activeCategory)}
        className={cn(
          "aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition-all active:scale-95",
          !equipped ? "border-[var(--color-primary)] bg-pink-50" : "border-gray-200 bg-white hover:bg-gray-50"
        )}
      >
        <span className="text-lg text-gray-400">✕</span>
      </button>

      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => toggle(item)}
          className={cn(
            "rounded-xl border-2 overflow-hidden transition-all active:scale-95",
            equipped?.id === item.id
              ? "border-[var(--color-primary)] ring-2 ring-pink-300/50 shadow-md"
              : "border-transparent hover:border-gray-200"
          )}
        >
          <Thumb item={item} />
        </button>
      ))}
    </div>
  );
}
