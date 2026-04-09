"use client";

import { useStudioStore } from "@/store/studio-store";
import { getItemsForCategory } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import type { StudioItem, ItemCategory } from "@/types/studio";

const PLACEHOLDER_COLORS: Record<ItemCategory, string> = {
  hair: "from-amber-200 to-amber-400",
  expression: "from-yellow-200 to-orange-300",
  makeup: "from-pink-200 to-rose-400",
  innerwear: "from-gray-100 to-gray-300",
  tops: "from-sky-200 to-blue-400",
  bottoms: "from-indigo-200 to-indigo-400",
  shoes: "from-emerald-200 to-emerald-400",
  accessories: "from-purple-200 to-violet-400",
};

function ItemThumbnail({ item }: { item: StudioItem }) {
  // Since we don't have real PNGs yet, show a placeholder
  const gradient = PLACEHOLDER_COLORS[item.category] || "from-gray-200 to-gray-400";

  return (
    <div
      className={cn(
        "w-full aspect-square rounded-xl bg-gradient-to-br flex items-center justify-center",
        gradient
      )}
    >
      <span className="text-xs font-bold text-white/90 text-center leading-tight px-1">
        {item.name}
      </span>
    </div>
  );
}

export function ItemGrid() {
  const { activeCategory, selectedGender, character, equipItem, unequipItem } =
    useStudioStore();

  const items = getItemsForCategory(activeCategory, selectedGender);
  const equippedItem = character.equippedItems[activeCategory];

  const handleSelect = (item: StudioItem) => {
    if (equippedItem?.id === item.id) {
      unequipItem(activeCategory);
    } else {
      equipItem(item);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-sm py-8">
        아직 아이템이 없어요
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 px-3 py-2 overflow-y-auto scrollbar-hide flex-1">
      {/* None / Reset button */}
      <button
        onClick={() => unequipItem(activeCategory)}
        className={cn(
          "aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition-all active:scale-95",
          !equippedItem
            ? "border-primary bg-primary/10"
            : "border-border bg-surface hover:bg-surface-alt"
        )}
      >
        <span className="text-lg">✕</span>
      </button>

      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleSelect(item)}
          className={cn(
            "rounded-xl border-2 overflow-hidden transition-all active:scale-95",
            equippedItem?.id === item.id
              ? "border-primary ring-2 ring-primary/30 shadow-md"
              : "border-transparent hover:border-border"
          )}
        >
          <ItemThumbnail item={item} />
        </button>
      ))}
    </div>
  );
}
