"use client";

import { useStudioStore } from "@/store/studio-store";
import { TopBar } from "@/components/top-bar";
import { CharacterCanvas } from "@/components/character-canvas";
import { BottomPanel } from "@/components/bottom-panel";
import { PhotoFrameView } from "@/components/photo-frame-view";

export default function Home() {
  const { viewMode } = useStudioStore();

  if (viewMode === "photoframe") {
    return (
      <div className="h-full flex flex-col">
        <PhotoFrameView />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <TopBar />

      {/* Character display */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <CharacterCanvas />
      </div>

      {/* Bottom customization panel */}
      <BottomPanel />
    </div>
  );
}
