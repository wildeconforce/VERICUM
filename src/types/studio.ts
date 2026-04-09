export type Gender = "girl" | "boy";

export type ItemCategory =
  | "hair"
  | "expression"
  | "makeup"
  | "innerwear"
  | "tops"
  | "bottoms"
  | "shoes"
  | "accessories";

export interface CharacterBase {
  id: string;
  name: string;
  gender: Gender;
  thumbnail: string;
  basePath: string; // base body image (no hair, no clothes)
}

export interface StudioItem {
  id: string;
  name: string;
  category: ItemCategory;
  gender: Gender | "unisex";
  imagePath: string;
  thumbnail: string;
  theme?: string; // e.g. "idol", "school", "racer", "influencer", "model"
  zIndex: number;
}

export interface PhotoFrame {
  id: string;
  name: string;
  imagePath: string;
  thumbnail: string;
}

export interface CharacterState {
  base: CharacterBase | null;
  equippedItems: Record<ItemCategory, StudioItem | null>;
}

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  hair: "헤어",
  expression: "표정",
  makeup: "메이크업",
  innerwear: "이너웨어",
  tops: "상의",
  bottoms: "하의",
  shoes: "신발",
  accessories: "악세서리",
};

export const CATEGORY_ORDER: ItemCategory[] = [
  "hair",
  "expression",
  "makeup",
  "innerwear",
  "tops",
  "bottoms",
  "shoes",
  "accessories",
];

// Z-index layers for rendering order
export const LAYER_Z_INDEX: Record<ItemCategory, number> = {
  innerwear: 1,
  bottoms: 2,
  tops: 3,
  shoes: 4,
  hair: 5,
  expression: 6,
  makeup: 7,
  accessories: 8,
};
