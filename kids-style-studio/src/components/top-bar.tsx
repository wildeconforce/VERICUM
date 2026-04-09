"use client";

import { useStudioStore } from "@/store/studio-store";
import { ProfileSaveButton } from "./profile-save";

export function TopBar() {
  const { viewMode, setViewMode, resetCharacter } = useStudioStore();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm">
      <h1 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
        키즈 스타일 스튜디오
      </h1>
      {viewMode === "customize" && (
        <div className="flex items-center gap-2">
          <button
            onClick={resetCharacter}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-100 transition-colors"
          >
            초기화
          </button>
          <button
            onClick={() => setViewMode("photoframe")}
            className="px-4 py-2 rounded-xl bg-amber-400 text-gray-900 text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            📸 사진찍기
          </button>
          <ProfileSaveButton />
        </div>
      )}
    </div>
  );
}
