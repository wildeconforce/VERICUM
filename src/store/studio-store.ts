import { create } from "zustand";
import type {
  CharacterBase,
  CharacterState,
  Gender,
  ItemCategory,
  StudioItem,
  PhotoFrame,
} from "@/types/studio";

type ViewMode = "customize" | "photoframe" | "profile";

interface StudioStore {
  // Character state
  character: CharacterState;
  selectedGender: Gender;

  // UI state
  activeCategory: ItemCategory;
  viewMode: ViewMode;
  selectedFrame: PhotoFrame | null;
  userPhoto: string | null;
  characterPosition: "left" | "right";

  // Actions
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

const initialCharacterState: CharacterState = {
  base: null,
  equippedItems: {
    hair: null,
    expression: null,
    makeup: null,
    innerwear: null,
    tops: null,
    bottoms: null,
    shoes: null,
    accessories: null,
  },
};

export const useStudioStore = create<StudioStore>((set) => ({
  character: initialCharacterState,
  selectedGender: "girl",
  activeCategory: "tops",
  viewMode: "customize",
  selectedFrame: null,
  userPhoto: null,
  characterPosition: "left",

  setGender: (gender) =>
    set({
      selectedGender: gender,
      character: initialCharacterState,
    }),

  setBase: (base) =>
    set((state) => ({
      character: { ...state.character, base },
    })),

  equipItem: (item) =>
    set((state) => ({
      character: {
        ...state.character,
        equippedItems: {
          ...state.character.equippedItems,
          [item.category]: item,
        },
      },
    })),

  unequipItem: (category) =>
    set((state) => ({
      character: {
        ...state.character,
        equippedItems: {
          ...state.character.equippedItems,
          [category]: null,
        },
      },
    })),

  setActiveCategory: (category) => set({ activeCategory: category }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedFrame: (frame) => set({ selectedFrame: frame }),
  setUserPhoto: (photo) => set({ userPhoto: photo }),
  setCharacterPosition: (position) => set({ characterPosition: position }),

  resetCharacter: () =>
    set({
      character: initialCharacterState,
    }),
}));
