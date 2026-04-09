"use client";

import { useStudioStore } from "@/store/studio-store";
import { ProfileSaveButton } from "./profile-save";
import { cn } from "@/lib/utils";

export function TopBar() {
  const { viewMode, setViewMode, resetCharacter } = useStudioStore();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface/80 backdrop-blur-sm">
      <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        키즈 스타일 스튜디오
      </h1>

      <div className="flex items-center gap-2">
        {viewMode === "customize" && (
          <>
            <button
              onClick={resetCharacter}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:bg-surface-alt transition-colors"
            >
              초기화
            </button>
            <button
              onClick={() => setViewMode("photoframe")}
              className="px-4 py-2 rounded-xl bg-accent text-foreground text-xs font-bold shadow-md shadow-accent/30 active:scale-95 transition-all"
            >
              📸 사진찍기
            </button>
            <ProfileSaveButton />
          </>
        )}
      </div>
    </div>
  );
}
