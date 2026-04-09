"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useStudioStore } from "@/store/studio-store";
import { CATEGORY_ORDER } from "@/types/studio";

/**
 * Load an image as a Promise (from hackrew's loadImage pattern).
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ---- SVG fallback ---- */
function PlaceholderCharacter({ gender }: { gender: "girl" | "boy" }) {
  const skin = "#FFE0C2";
  const o = "#4A4A5A";
  const hair = gender === "girl" ? "#8B5E3C" : "#2D2D3F";
  const c1 = gender === "girl" ? "#FF6B9D" : "#6BC5B8";
  const c2 = gender === "girl" ? "#FFB3D0" : "#A8E6CF";

  return (
    <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-lg">
      <ellipse cx="100" cy="80" rx="45" ry="50" fill={skin} stroke={o} strokeWidth="3" />
      {gender === "girl" ? (
        <>
          <path d="M55 60Q50 20 80 15Q100 10 120 15Q150 20 145 60" fill={hair} stroke={o} strokeWidth="3" />
          <ellipse cx="50" cy="80" rx="12" ry="35" fill={hair} stroke={o} strokeWidth="2" />
          <ellipse cx="150" cy="80" rx="12" ry="35" fill={hair} stroke={o} strokeWidth="2" />
          <circle cx="55" cy="52" r="6" fill="#FF6B9D" stroke={o} strokeWidth="1.5" />
          <circle cx="145" cy="52" r="6" fill="#FF6B9D" stroke={o} strokeWidth="1.5" />
        </>
      ) : (
        <path d="M55 65Q48 25 75 15Q100 5 125 15Q152 25 145 65L140 50Q130 35 100 30Q70 35 60 50Z" fill={hair} stroke={o} strokeWidth="3" />
      )}
      <ellipse cx="82" cy="80" rx="8" ry="10" fill="white" stroke={o} strokeWidth="2" />
      <ellipse cx="118" cy="80" rx="8" ry="10" fill="white" stroke={o} strokeWidth="2" />
      <circle cx="84" cy="80" r="5" fill="#4A4A5A" /><circle cx="120" cy="80" r="5" fill="#4A4A5A" />
      <circle cx="86" cy="78" r="2" fill="white" /><circle cx="122" cy="78" r="2" fill="white" />
      <ellipse cx="70" cy="92" rx="8" ry="5" fill="#FFB3D0" opacity=".6" />
      <ellipse cx="130" cy="92" rx="8" ry="5" fill="#FFB3D0" opacity=".6" />
      <path d="M92 98Q100 106 108 98" fill="none" stroke={o} strokeWidth="2" strokeLinecap="round" />
      <path d="M80 125L75 130Q65 135 60 160L55 230Q55 240 65 240L135 240Q145 240 145 230L140 160Q135 135 125 130L120 125" fill={c1} stroke={o} strokeWidth="3" />
      <path d="M85 128Q100 140 115 128" fill={c2} stroke={o} strokeWidth="2" />
      <path d="M60 155Q45 165 40 200Q38 210 45 212" fill={skin} stroke={o} strokeWidth="3" strokeLinecap="round" />
      <path d="M140 155Q155 165 160 200Q162 210 155 212" fill={skin} stroke={o} strokeWidth="3" strokeLinecap="round" />
      <circle cx="43" cy="214" r="8" fill={skin} stroke={o} strokeWidth="2" />
      <circle cx="157" cy="214" r="8" fill={skin} stroke={o} strokeWidth="2" />
      {gender === "girl" ? (
        <>
          <path d="M60 235Q55 260 50 280L150 280Q145 260 140 235" fill={c2} stroke={o} strokeWidth="3" />
          <rect x="75" y="278" width="16" height="65" rx="8" fill={skin} stroke={o} strokeWidth="2" />
          <rect x="109" y="278" width="16" height="65" rx="8" fill={skin} stroke={o} strokeWidth="2" />
        </>
      ) : (
        <>
          <path d="M60 235L55 280L100 280V240V280L145 280L140 235" fill="#C4A882" stroke={o} strokeWidth="3" />
          <rect x="72" y="278" width="18" height="60" rx="9" fill={skin} stroke={o} strokeWidth="2" />
          <rect x="110" y="278" width="18" height="60" rx="9" fill={skin} stroke={o} strokeWidth="2" />
        </>
      )}
      <ellipse cx="83" cy="348" rx="16" ry="8" fill="white" stroke={o} strokeWidth="2" />
      <ellipse cx="119" cy="348" rx="16" ry="8" fill="white" stroke={o} strokeWidth="2" />
    </svg>
  );
}

/* ==== Canvas-based character renderer (hackrew pattern) ==== */
export function CharacterCanvas({ compact = false }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { character, selectedGender } = useStudioStore();
  const [useFallback, setUseFallback] = useState(false);

  const W = compact ? 144 : 320;
  const H = compact ? 192 : 480;

  /**
   * renderLayerStack: working canvas pattern from hackrew.
   * Renders all layers to an offscreen canvas first, then copies to
   * the visible canvas in one shot to prevent flickering.
   */
  useEffect(() => {
    if (!character.base || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Working canvas (offscreen) - hackrew pattern
    const working = document.createElement("canvas");
    working.width = W;
    working.height = H;
    const wCtx = working.getContext("2d")!;

    let cancelled = false;

    (async () => {
      wCtx.clearRect(0, 0, W, H);

      // 1) Draw base body
      try {
        const baseImg = await loadImage(character.base!.basePath);
        if (cancelled) return;
        wCtx.drawImage(baseImg, 0, 0, W, H);
      } catch {
        setUseFallback(true);
        return;
      }

      setUseFallback(false);

      // 2) Draw each equipped item layer in order (hackrew's renderLayerStack)
      for (const cat of CATEGORY_ORDER) {
        const item = character.equippedItems[cat];
        if (!item) continue;
        try {
          const img = await loadImage(item.imagePath);
          if (cancelled) return;
          wCtx.drawImage(img, 0, 0, W, H);
        } catch {
          // skip missing images
        }
      }

      // 3) Copy working canvas to display canvas in one shot
      if (!cancelled) {
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(working, 0, 0);
      }
    })();

    return () => { cancelled = true; };
  }, [character, W, H]);

  return (
    <div
      className={`character-canvas relative flex items-center justify-center ${
        compact ? "h-48 w-36" : "h-[55vh] w-full max-w-xs"
      }`}
    >
      {!compact && (
        <div className="absolute inset-x-4 top-4 bottom-8 rounded-full bg-gradient-to-b from-pink-200/30 to-violet-200/30" />
      )}

      <div className="relative z-10 w-full h-full flex items-end justify-center pb-2">
        {character.base && !useFallback ? (
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="w-full h-full object-contain"
            style={{ imageRendering: "crisp-edges" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <PlaceholderCharacter gender={selectedGender} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ==== Canvas → PNG export hook ==== */
export function useCharacterExport() {
  const { character } = useStudioStore();

  const exportAsPng = useCallback(
    async (width = 600, height = 800): Promise<string | null> => {
      if (!character.base) return null;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      try {
        const baseImg = await loadImage(character.base.basePath);
        ctx.drawImage(baseImg, 0, 0, width, height);

        for (const cat of CATEGORY_ORDER) {
          const item = character.equippedItems[cat];
          if (!item) continue;
          try {
            const img = await loadImage(item.imagePath);
            ctx.drawImage(img, 0, 0, width, height);
          } catch { /* skip */ }
        }
      } catch {
        return null;
      }

      return canvas.toDataURL("image/png");
    },
    [character]
  );

  return { exportAsPng };
}
