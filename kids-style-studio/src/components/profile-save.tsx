"use client";

import { useState, useCallback } from "react";
import { useCharacterExport } from "./character-canvas";
import { useStudioStore } from "@/store/studio-store";

export function ProfileSaveButton() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { exportAsPng } = useCharacterExport();
  const { character } = useStudioStore();

  const handleSave = useCallback(async () => {
    if (!character.base) return;
    setSaving(true);
    try {
      const url = await exportAsPng(400, 400);
      if (!url) return;
      const link = document.createElement("a");
      link.download = "my-character-profile.png";
      link.href = url;
      link.click();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [exportAsPng, character.base]);

  return (
    <button
      onClick={handleSave}
      disabled={saving || !character.base}
      className="px-4 py-2 rounded-xl bg-violet-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-40"
    >
      {saved ? "✅ 저장됨!" : saving ? "..." : "프로필 저장"}
    </button>
  );
}
