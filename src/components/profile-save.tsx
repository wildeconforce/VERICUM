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
      const dataUrl = await exportAsPng(400, 400);
      if (!dataUrl) return;

      const link = document.createElement("a");
      link.download = "my-character-profile.png";
      link.href = dataUrl;
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
      className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold shadow-md shadow-secondary/30 active:scale-95 transition-all disabled:opacity-40"
    >
      {saved ? "✅ 저장됨!" : saving ? "..." : "프로필 저장"}
    </button>
  );
}
