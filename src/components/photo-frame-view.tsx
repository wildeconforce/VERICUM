"use client";

import { useRef, useState, useCallback } from "react";
import { useStudioStore } from "@/store/studio-store";
import { CharacterCanvas, useCharacterExport } from "./character-canvas";
import { cn } from "@/lib/utils";

export function PhotoFrameView() {
  const {
    characterPosition,
    setCharacterPosition,
    userPhoto,
    setUserPhoto,
    setViewMode,
  } = useStudioStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const compositeRef = useRef<HTMLDivElement>(null);
  const { exportAsPng } = useCharacterExport();
  const [saving, setSaving] = useState(false);

  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setUserPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [setUserPhoto]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Composite: user photo + character + watermark
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw background
      ctx.fillStyle = "#FFF5F8";
      ctx.fillRect(0, 0, 600, 800);

      // Draw user photo if exists
      if (userPhoto) {
        const photoImg = new Image();
        photoImg.src = userPhoto;
        await new Promise((resolve) => {
          photoImg.onload = resolve;
        });
        // Fill the canvas with the photo (cover)
        const scale = Math.max(600 / photoImg.width, 800 / photoImg.height);
        const w = photoImg.width * scale;
        const h = photoImg.height * scale;
        ctx.drawImage(photoImg, (600 - w) / 2, (800 - h) / 2, w, h);
      }

      // Draw character
      const charPng = await exportAsPng(300, 500);
      if (charPng) {
        const charImg = new Image();
        charImg.src = charPng;
        await new Promise((resolve) => {
          charImg.onload = resolve;
        });
        const x = characterPosition === "left" ? 20 : 280;
        ctx.drawImage(charImg, x, 250, 300, 500);
      }

      // Watermark
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "right";
      ctx.fillText("키즈 스타일 스튜디오", 585, 785);

      // Download
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setViewMode("customize")}
          className="text-sm text-primary font-semibold"
        >
          ← 꾸미기로
        </button>
        <h2 className="text-base font-bold">포토 프레임</h2>
        <div className="w-16" />
      </div>

      {/* Composite preview */}
      <div
        ref={compositeRef}
        className="flex-1 mx-4 rounded-2xl bg-white shadow-lg overflow-hidden relative flex items-center justify-center"
      >
        {/* User photo background */}
        {userPhoto ? (
          <img
            src={userPhoto}
            alt="내 사진"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-light/30 to-secondary-light/30 flex items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/80 backdrop-blur px-6 py-3 rounded-2xl text-sm font-semibold text-primary shadow-md active:scale-95 transition-transform"
            >
              📷 사진 추가하기
            </button>
          </div>
        )}

        {/* Character overlay */}
        <div
          className={cn(
            "absolute bottom-0 w-1/2 h-2/3",
            characterPosition === "left" ? "left-0" : "right-0"
          )}
        >
          <CharacterCanvas compact />
        </div>

        {/* Watermark */}
        <div className="absolute bottom-2 right-3 text-[10px] text-white/60 font-medium">
          키즈 스타일 스튜디오
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 rounded-xl bg-surface border border-border text-sm font-semibold active:scale-95 transition-transform"
          >
            📷 사진 변경
          </button>
          <button
            onClick={() =>
              setCharacterPosition(
                characterPosition === "left" ? "right" : "left"
              )
            }
            className="flex-1 py-2.5 rounded-xl bg-surface border border-border text-sm font-semibold active:scale-95 transition-transform"
          >
            ↔️ 위치 변경
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/30 active:scale-95 transition-transform disabled:opacity-50"
        >
          {saving ? "저장 중..." : "💾 사진 저장하기"}
        </button>
      </div>
    </div>
  );
}
