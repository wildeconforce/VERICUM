"use client";

import { useStudioStore } from "@/store/studio-store";
import { CategoryTabs } from "./category-tabs";
import { ItemGrid } from "./item-grid";
import { GenderSelector } from "./gender-selector";

export function BottomPanel() {
  return (
    <div className="flex flex-col bg-surface-alt rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.06)] overflow-hidden"
      style={{ height: "40vh" }}
    >
      {/* Gender toggle */}
      <div className="pt-3 pb-1">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
        <GenderSelector />
      </div>

      {/* Category tabs */}
      <CategoryTabs />

      {/* Items */}
      <ItemGrid />
    </div>
  );
}
