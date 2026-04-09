import { create } from "zustand";
import type {
  CharacterBase,
  CharacterState,
  Gender,
  ItemCategory,
  PhotoFrame,
  StudioItem,
} from "@/types/studio";
import { CATEGORY_ORDER } from "@/types/studio";
import { DEMO_CHARACTERS, DEMO_ITEMS, getItemsForCategory } from "@/lib/demo-data";

type ViewMode = "customize" | "photoframe" | "profile";

interface StudioStore {
  character: CharacterState;
  selectedGender: Gender;
  activeCategory: ItemCategory;
  viewMode: ViewMode;
  selectedFrame: PhotoFrame | null;
  userPhoto: string | null;
  characterPosition: "left" | "right";

  setGender: (gender: Gender) => void;
  setBase: (base: CharacterBase) => void;
  equipItem: (item: StudioItem) => void;
  unequipItem: (category: ItemCategory) => void;
  setActiveCategory: (category: ItemCategory) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedFrame: (frame: PhotoFrame | null) => void;
  setUserPhoto: (photo: string | null) => void;
  setCharacterPosition: (position: "left" | "right") => void;
  resetCharacter: () => void;
  randomize: () => void;
}

const emptyEquipped: Record<ItemCategory, StudioItem | null> = {
  hair: null,
  expression: null,
  makeup: null,
  innerwear: null,
  tops: null,
  bottoms: null,
  shoes: null,
  accessories: null,
};

function getDefaultBase(gender: Gender): CharacterBase | null {
  return DEMO_CHARACTERS.find((c) => c.gender === gender) ?? null;
}

/** Pick a random item (or null) for each category - inspired by hackrew's randomize() */
function randomOutfit(gender: Gender): Record<ItemCategory, StudioItem | null> {
  const equipped = { ...emptyEquipped };
  for (const cat of CATEGORY_ORDER) {
    const items = getItemsForCategory(cat, gender);
    if (items.length === 0) continue;
    // 30% chance to leave empty for optional categories
    const optional = cat !== "tops" && cat !== "bottoms";
    if (optional && Math.random() < 0.3) continue;
    equipped[cat] = items[Math.floor(Math.random() * items.length)];
  }
  return equipped;
}

export const useStudioStore = create<StudioStore>((set) => ({
  character: {
    base: getDefaultBase("girl"),
    equippedItems: { ...emptyEquipped },
  },
  selectedGender: "girl",
  activeCategory: "tops",
  viewMode: "customize",
  selectedFrame: null,
  userPhoto: null,
  characterPosition: "left",

  setGender: (gender) =>
    set({
      selectedGender: gender,
      character: {
        base: getDefaultBase(gender),
        equippedItems: { ...emptyEquipped },
      },
    }),

  setBase: (base) =>
    set((s) => ({ character: { ...s.character, base } })),

  equipItem: (item) =>
    set((s) => ({
      character: {
        ...s.character,
        equippedItems: { ...s.character.equippedItems, [item.category]: item },
      },
    })),

  unequipItem: (category) =>
    set((s) => ({
      character: {
        ...s.character,
        equippedItems: { ...s.character.equippedItems, [category]: null },
      },
    })),

  setActiveCategory: (category) => set({ activeCategory: category }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedFrame: (frame) => set({ selectedFrame: frame }),
  setUserPhoto: (photo) => set({ userPhoto: photo }),
  setCharacterPosition: (pos) => set({ characterPosition: pos }),

  resetCharacter: () =>
    set((s) => ({
      character: {
        base: getDefaultBase(s.selectedGender),
        equippedItems: { ...emptyEquipped },
      },
    })),

  randomize: () =>
    set((s) => ({
      character: {
        base: getDefaultBase(s.selectedGender),
        equippedItems: randomOutfit(s.selectedGender),
      },
    })),
}));
