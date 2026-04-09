"use client";

import { useRef, useState, useCallback } from "react";
import { useStudioStore } from "@/store/studio-store";
import { CharacterCanvas, useCharacterExport } from "./character-canvas";
import { cn } from "@/lib/utils";

export function PhotoFrameView() {
  const { characterPosition, setCharacterPosition, userPhoto, setUserPhoto, setViewMode } = useStudioStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const { exportAsPng } = useCharacterExport();
  const [saving, setSaving] = useState(false);

  const onPhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setUserPhoto(r.result as string);
    r.readAsDataURL(file);
  }, [setUserPhoto]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#FFF5F8";
      ctx.fillRect(0, 0, 600, 800);

      if (userPhoto) {
        const img = new Image();
        img.src = userPhoto;
        await new Promise((res) => { img.onload = res; });
        const s = Math.max(600 / img.width, 800 / img.height);
        const w = img.width * s, h = img.height * s;
        ctx.drawImage(img, (600 - w) / 2, (800 - h) / 2, w, h);
      }

      const charPng = await exportAsPng(300, 500);
      if (charPng) {
        const ci = new Image();
        ci.src = charPng;
        await new Promise((res) => { ci.onload = res; });
        ctx.drawImage(ci, characterPosition === "left" ? 20 : 280, 250, 300, 500);
      }

      ctx.font = "14px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "right";
      ctx.fillText("키즈 스타일 스튜디오", 585, 785);

      const link = document.createElement("a");
      link.download = "kids-style-studio-photo.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setSaving(false);
    }
  }, [userPhoto, characterPosition, exportAsPng]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setViewMode("customize")} className="text-sm text-[var(--color-primary)] font-semibold">← 꾸미기로</button>
        <h2 className="text-base font-bold">포토 프레임</h2>
        <div className="w-16" />
      </div>

      <div className="flex-1 mx-4 rounded-2xl bg-white shadow-lg overflow-hidden relative flex items-center justify-center">
        {userPhoto ? (
          <img src={userPhoto} alt="내 사진" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 to-violet-100/50 flex items-center justify-center">
            <button onClick={() => fileRef.current?.click()} className="bg-white/80 backdrop-blur px-6 py-3 rounded-2xl text-sm font-semibold text-[var(--color-primary)] shadow-md active:scale-95 transition-transform">
              📷 사진 추가하기
            </button>
          </div>
        )}
        <div className={cn("absolute bottom-0 w-1/2 h-2/3", characterPosition === "left" ? "left-0" : "right-0")}>
          <CharacterCanvas compact />
        </div>
        <div className="absolute bottom-2 right-3 text-[10px] text-white/60 font-medium">키즈 스타일 스튜디오</div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold active:scale-95 transition-transform">📷 사진 변경</button>
          <button onClick={() => setCharacterPosition(characterPosition === "left" ? "right" : "left")} className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold active:scale-95 transition-transform">↔️ 위치 변경</button>
        </div>
        <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold shadow-md active:scale-95 transition-transform disabled:opacity-50">
          {saving ? "저장 중..." : "💾 사진 저장하기"}
        </button>
      </div>
    </div>
  );
}
