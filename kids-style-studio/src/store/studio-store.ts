import { create } from "zustand";
import type {
  CharacterBase,
  CharacterState,
  Gender,
  ItemCategory,
  PhotoFrame,
  StudioItem,
} from "@/types/studio";
import { DEMO_CHARACTERS } from "@/lib/demo-data";

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
}));
