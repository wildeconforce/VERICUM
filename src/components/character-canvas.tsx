"use client";

import { useRef, useCallback } from "react";
import { useStudioStore } from "@/store/studio-store";
import { LAYER_Z_INDEX, CATEGORY_ORDER } from "@/types/studio";
import type { ItemCategory } from "@/types/studio";

/**
 * SVG placeholder for when PNG assets are not yet available.
 * Renders a cute chibi character outline.
 */
function PlaceholderCharacter({ gender }: { gender: "girl" | "boy" }) {
  const skinColor = "#FFE0C2";
  const outlineColor = "#4A4A5A";
  const hairColor = gender === "girl" ? "#8B5E3C" : "#2D2D3F";
  const clothesColor = gender === "girl" ? "#FF6B9D" : "#6BC5B8";
  const clothesColor2 = gender === "girl" ? "#FFB3D0" : "#A8E6CF";

  return (
    <svg viewBox="0 0 200 400" className="w-full h-full">
      {/* Head */}
      <ellipse
        cx="100"
        cy="80"
        rx="45"
        ry="50"
        fill={skinColor}
        stroke={outlineColor}
        strokeWidth="3"
      />

      {/* Hair */}
      {gender === "girl" ? (
        <>
          {/* Girl hair - twin tails */}
          <path
            d="M55 60 Q50 20 80 15 Q100 10 120 15 Q150 20 145 60"
            fill={hairColor}
            stroke={outlineColor}
            strokeWidth="3"
          />
          <ellipse cx="50" cy="80" rx="12" ry="35" fill={hairColor} stroke={outlineColor} strokeWidth="2" />
          <ellipse cx="150" cy="80" rx="12" ry="35" fill={hairColor} stroke={outlineColor} strokeWidth="2" />
          {/* Ribbons */}
          <circle cx="55" cy="52" r="6" fill="#FF6B9D" stroke={outlineColor} strokeWidth="1.5" />
          <circle cx="145" cy="52" r="6" fill="#FF6B9D" stroke={outlineColor} strokeWidth="1.5" />
        </>
      ) : (
        /* Boy hair - messy short */
        <path
          d="M55 65 Q48 25 75 15 Q100 5 125 15 Q152 25 145 65 L140 50 Q130 35 100 30 Q70 35 60 50 Z"
          fill={hairColor}
          stroke={outlineColor}
          strokeWidth="3"
        />
      )}

      {/* Eyes */}
      <ellipse cx="82" cy="80" rx="8" ry="10" fill="white" stroke={outlineColor} strokeWidth="2" />
      <ellipse cx="118" cy="80" rx="8" ry="10" fill="white" stroke={outlineColor} strokeWidth="2" />
      <circle cx="84" cy="80" r="5" fill="#4A4A5A" />
      <circle cx="120" cy="80" r="5" fill="#4A4A5A" />
      <circle cx="86" cy="78" r="2" fill="white" />
      <circle cx="122" cy="78" r="2" fill="white" />

      {/* Blush */}
      <ellipse cx="70" cy="92" rx="8" ry="5" fill="#FFB3D0" opacity="0.6" />
      <ellipse cx="130" cy="92" rx="8" ry="5" fill="#FFB3D0" opacity="0.6" />

      {/* Mouth */}
      <path
        d="M92 98 Q100 106 108 98"
        fill="none"
        stroke={outlineColor}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Body */}
      <path
        d="M80 125 L75 130 Q65 135 60 160 L55 230 Q55 240 65 240 L135 240 Q145 240 145 230 L140 160 Q135 135 125 130 L120 125"
        fill={clothesColor}
        stroke={outlineColor}
        strokeWidth="3"
      />

      {/* Collar / detail */}
      <path
        d="M85 128 Q100 140 115 128"
        fill={clothesColor2}
        stroke={outlineColor}
        strokeWidth="2"
      />

      {/* Arms */}
      <path
        d="M60 155 Q45 165 40 200 Q38 210 45 212"
        fill={skinColor}
        stroke={outlineColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M140 155 Q155 165 160 200 Q162 210 155 212"
        fill={skinColor}
        stroke={outlineColor}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Hands */}
      <circle cx="43" cy="214" r="8" fill={skinColor} stroke={outlineColor} strokeWidth="2" />
      <circle cx="157" cy="214" r="8" fill={skinColor} stroke={outlineColor} strokeWidth="2" />

      {/* Legs / Bottoms */}
      {gender === "girl" ? (
        <>
          {/* Skirt */}
          <path
            d="M60 235 Q55 260 50 280 L150 280 Q145 260 140 235"
            fill={clothesColor2}
            stroke={outlineColor}
            strokeWidth="3"
          />
          {/* Legs */}
          <rect x="75" y="278" width="16" height="65" rx="8" fill={skinColor} stroke={outlineColor} strokeWidth="2" />
          <rect x="109" y="278" width="16" height="65" rx="8" fill={skinColor} stroke={outlineColor} strokeWidth="2" />
        </>
      ) : (
        <>
          {/* Shorts */}
          <path
            d="M60 235 L55 280 L100 280 L100 240 L100 280 L145 280 L140 235"
            fill="#C4A882"
            stroke={outlineColor}
            strokeWidth="3"
          />
          {/* Legs */}
          <rect x="72" y="278" width="18" height="60" rx="9" fill={skinColor} stroke={outlineColor} strokeWidth="2" />
          <rect x="110" y="278" width="18" height="60" rx="9" fill={skinColor} stroke={outlineColor} strokeWidth="2" />
        </>
      )}

      {/* Shoes */}
      <ellipse cx="83" cy="348" rx="16" ry="8" fill="white" stroke={outlineColor} strokeWidth="2" />
      <ellipse cx="119" cy="348" rx="16" ry="8" fill="white" stroke={outlineColor} strokeWidth="2" />
    </svg>
  );
}

interface CharacterCanvasProps {
  compact?: boolean;
}

export function CharacterCanvas({ compact = false }: CharacterCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { character, selectedGender } = useStudioStore();

  const sortedItems = CATEGORY_ORDER
    .map((cat) => character.equippedItems[cat])
    .filter(Boolean)
    .sort((a, b) => LAYER_Z_INDEX[a!.category] - LAYER_Z_INDEX[b!.category]);

  const hasBase = character.base !== null;

  return (
    <div
      ref={canvasRef}
      className={`character-canvas relative flex items-center justify-center ${
        compact ? "h-48 w-36" : "h-[55vh] w-full max-w-xs"
      }`}
    >
      {/* Decorative background circle */}
      {!compact && (
        <div className="absolute inset-x-4 top-4 bottom-8 rounded-full bg-gradient-to-b from-primary-light/20 to-secondary-light/20" />
      )}

      <div className="relative z-10 w-full h-full flex items-end justify-center pb-2">
        {hasBase ? (
          /* Real PNG layering system */
          <div className="relative w-full h-full">
            {/* Base body */}
            <img
              src={character.base!.basePath}
              alt="캐릭터"
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
            />
            {/* Equipped item layers */}
            {sortedItems.map((item) => (
              <img
                key={item!.id}
                src={item!.imagePath}
                alt={item!.name}
                className="absolute inset-0 w-full h-full object-contain"
                style={{ zIndex: LAYER_Z_INDEX[item!.category as ItemCategory] }}
                draggable={false}
              />
            ))}
          </div>
        ) : (
          /* SVG placeholder */
          <div className="w-full h-full flex items-center justify-center p-4">
            <PlaceholderCharacter gender={selectedGender} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Export character as PNG using Canvas API.
 * Used for profile image save and photo frame composite.
 */
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

      // Load and draw base
      const baseImg = new Image();
      baseImg.crossOrigin = "anonymous";
      baseImg.src = character.base.basePath;
      await new Promise((resolve) => {
        baseImg.onload = resolve;
      });
      ctx.drawImage(baseImg, 0, 0, width, height);

      // Load and draw items in order
      const sortedItems = CATEGORY_ORDER
        .map((cat) => character.equippedItems[cat])
        .filter(Boolean);

      for (const item of sortedItems) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = item!.imagePath;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        ctx.drawImage(img, 0, 0, width, height);
      }

      return canvas.toDataURL("image/png");
    },
    [character]
  );

  return { exportAsPng };
}
