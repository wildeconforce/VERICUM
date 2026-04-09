"use client";

import { useRef, useCallback, useState } from "react";
import { useStudioStore } from "@/store/studio-store";
import { LAYER_Z_INDEX, CATEGORY_ORDER } from "@/types/studio";
import type { ItemCategory } from "@/types/studio";

/* ---- SVG fallback (PNG 로드 실패 시) ---- */
function PlaceholderCharacter({ gender }: { gender: "girl" | "boy" }) {
  const skin = "#FFE0C2";
  const outline = "#4A4A5A";
  const hair = gender === "girl" ? "#8B5E3C" : "#2D2D3F";
  const top = gender === "girl" ? "#FF6B9D" : "#6BC5B8";
  const top2 = gender === "girl" ? "#FFB3D0" : "#A8E6CF";

  return (
    <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-lg">
      <ellipse cx="100" cy="80" rx="45" ry="50" fill={skin} stroke={outline} strokeWidth="3" />
      {gender === "girl" ? (
        <>
          <path d="M55 60Q50 20 80 15Q100 10 120 15Q150 20 145 60" fill={hair} stroke={outline} strokeWidth="3" />
          <ellipse cx="50" cy="80" rx="12" ry="35" fill={hair} stroke={outline} strokeWidth="2" />
          <ellipse cx="150" cy="80" rx="12" ry="35" fill={hair} stroke={outline} strokeWidth="2" />
          <circle cx="55" cy="52" r="6" fill="#FF6B9D" stroke={outline} strokeWidth="1.5" />
          <circle cx="145" cy="52" r="6" fill="#FF6B9D" stroke={outline} strokeWidth="1.5" />
        </>
      ) : (
        <path d="M55 65Q48 25 75 15Q100 5 125 15Q152 25 145 65L140 50Q130 35 100 30Q70 35 60 50Z" fill={hair} stroke={outline} strokeWidth="3" />
      )}
      <ellipse cx="82" cy="80" rx="8" ry="10" fill="white" stroke={outline} strokeWidth="2" />
      <ellipse cx="118" cy="80" rx="8" ry="10" fill="white" stroke={outline} strokeWidth="2" />
      <circle cx="84" cy="80" r="5" fill="#4A4A5A" />
      <circle cx="120" cy="80" r="5" fill="#4A4A5A" />
      <circle cx="86" cy="78" r="2" fill="white" />
      <circle cx="122" cy="78" r="2" fill="white" />
      <ellipse cx="70" cy="92" rx="8" ry="5" fill="#FFB3D0" opacity=".6" />
      <ellipse cx="130" cy="92" rx="8" ry="5" fill="#FFB3D0" opacity=".6" />
      <path d="M92 98Q100 106 108 98" fill="none" stroke={outline} strokeWidth="2" strokeLinecap="round" />
      <path d="M80 125L75 130Q65 135 60 160L55 230Q55 240 65 240L135 240Q145 240 145 230L140 160Q135 135 125 130L120 125" fill={top} stroke={outline} strokeWidth="3" />
      <path d="M85 128Q100 140 115 128" fill={top2} stroke={outline} strokeWidth="2" />
      <path d="M60 155Q45 165 40 200Q38 210 45 212" fill={skin} stroke={outline} strokeWidth="3" strokeLinecap="round" />
      <path d="M140 155Q155 165 160 200Q162 210 155 212" fill={skin} stroke={outline} strokeWidth="3" strokeLinecap="round" />
      <circle cx="43" cy="214" r="8" fill={skin} stroke={outline} strokeWidth="2" />
      <circle cx="157" cy="214" r="8" fill={skin} stroke={outline} strokeWidth="2" />
      {gender === "girl" ? (
        <>
          <path d="M60 235Q55 260 50 280L150 280Q145 260 140 235" fill={top2} stroke={outline} strokeWidth="3" />
          <rect x="75" y="278" width="16" height="65" rx="8" fill={skin} stroke={outline} strokeWidth="2" />
          <rect x="109" y="278" width="16" height="65" rx="8" fill={skin} stroke={outline} strokeWidth="2" />
        </>
      ) : (
        <>
          <path d="M60 235L55 280L100 280V240V280L145 280L140 235" fill="#C4A882" stroke={outline} strokeWidth="3" />
          <rect x="72" y="278" width="18" height="60" rx="9" fill={skin} stroke={outline} strokeWidth="2" />
          <rect x="110" y="278" width="18" height="60" rx="9" fill={skin} stroke={outline} strokeWidth="2" />
        </>
      )}
      <ellipse cx="83" cy="348" rx="16" ry="8" fill="white" stroke={outline} strokeWidth="2" />
      <ellipse cx="119" cy="348" rx="16" ry="8" fill="white" stroke={outline} strokeWidth="2" />
    </svg>
  );
}

/* ---- Main Canvas ---- */
export function CharacterCanvas({ compact = false }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { character, selectedGender } = useStudioStore();
  const [baseError, setBaseError] = useState(false);

  const sortedItems = CATEGORY_ORDER
    .map((cat) => character.equippedItems[cat])
    .filter(Boolean)
    .sort((a, b) => LAYER_Z_INDEX[a!.category] - LAYER_Z_INDEX[b!.category]);

  const hasBase = character.base !== null && !baseError;

  return (
    <div
      ref={canvasRef}
      className={`character-canvas relative flex items-center justify-center ${
        compact ? "h-48 w-36" : "h-[55vh] w-full max-w-xs"
      }`}
    >
      {!compact && (
        <div className="absolute inset-x-4 top-4 bottom-8 rounded-full bg-gradient-to-b from-pink-200/30 to-violet-200/30" />
      )}

      <div className="relative z-10 w-full h-full flex items-end justify-center pb-2">
        {hasBase ? (
          <div className="relative w-full h-full">
            {/* Base body */}
            <img
              src={character.base!.basePath}
              alt="캐릭터"
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
              onError={() => setBaseError(true)}
            />
            {/* Item layers */}
            {sortedItems.map((item) => (
              <img
                key={item!.id}
                src={item!.imagePath}
                alt={item!.name}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ zIndex: LAYER_Z_INDEX[item!.category as ItemCategory] }}
                draggable={false}
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <PlaceholderCharacter gender={selectedGender} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Canvas → PNG export hook ---- */
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

      const load = (src: string) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        return new Promise<HTMLImageElement>((res, rej) => {
          img.onload = () => res(img);
          img.onerror = rej;
        });
      };

      try {
        const baseImg = await load(character.base.basePath);
        ctx.drawImage(baseImg, 0, 0, width, height);

        for (const cat of CATEGORY_ORDER) {
          const item = character.equippedItems[cat];
          if (!item) continue;
          try {
            const img = await load(item.imagePath);
            ctx.drawImage(img, 0, 0, width, height);
          } catch {
            // skip missing item images
          }
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
