import type { CharacterBase, StudioItem, PhotoFrame } from "@/types/studio";

export const DEMO_CHARACTERS: CharacterBase[] = [
  {
    id: "girl-01",
    name: "하나",
    gender: "girl",
    thumbnail: "/assets/characters/girl-01-base.png",
    basePath: "/assets/characters/girl-01-base.png",
  },
  {
    id: "boy-01",
    name: "민수",
    gender: "boy",
    thumbnail: "/assets/characters/boy-01-base.png",
    basePath: "/assets/characters/boy-01-base.png",
  },
];

export const DEMO_ITEMS: StudioItem[] = [
  // ===== Hair =====
  { id: "hair-girl-twin-braids", name: "트윈 브레이드", category: "hair", gender: "girl", imagePath: "/assets/items/hair/girl-twin-braids.png", thumbnail: "/assets/items/hair/girl-twin-braids.png", zIndex: 5 },
  { id: "hair-girl-bob", name: "단발", category: "hair", gender: "girl", imagePath: "/assets/items/hair/girl-bob.png", thumbnail: "/assets/items/hair/girl-bob.png", zIndex: 5 },
  { id: "hair-girl-ponytail", name: "포니테일", category: "hair", gender: "girl", imagePath: "/assets/items/hair/girl-ponytail.png", thumbnail: "/assets/items/hair/girl-ponytail.png", zIndex: 5 },
  // boy
  { id: "hair-boy-messy", name: "내추럴 숏", category: "hair", gender: "boy", imagePath: "/assets/items/hair/boy-messy.png", thumbnail: "/assets/items/hair/boy-messy.png", zIndex: 5 },
  { id: "hair-boy-spiky", name: "스파이키", category: "hair", gender: "boy", imagePath: "/assets/items/hair/boy-spiky.png", thumbnail: "/assets/items/hair/boy-spiky.png", zIndex: 5 },

  // ===== Tops =====
  { id: "tops-girl-pink-cardigan", name: "핑크 가디건", category: "tops", gender: "girl", imagePath: "/assets/items/tops/girl-pink-cardigan.png", thumbnail: "/assets/items/tops/girl-pink-cardigan.png", theme: "casual", zIndex: 3 },
  { id: "tops-girl-idol", name: "아이돌 드레스", category: "tops", gender: "girl", imagePath: "/assets/items/tops/girl-idol-dress.png", thumbnail: "/assets/items/tops/girl-idol-dress.png", theme: "idol", zIndex: 3 },
  { id: "tops-girl-school", name: "세일러 교복", category: "tops", gender: "girl", imagePath: "/assets/items/tops/girl-school-uniform.png", thumbnail: "/assets/items/tops/girl-school-uniform.png", theme: "school", zIndex: 3 },
  { id: "tops-girl-racer", name: "레이싱 슈트", category: "tops", gender: "girl", imagePath: "/assets/items/tops/girl-racer.png", thumbnail: "/assets/items/tops/girl-racer.png", theme: "racer", zIndex: 3 },
  // boy
  { id: "tops-boy-tee", name: "민트 티셔츠", category: "tops", gender: "boy", imagePath: "/assets/items/tops/boy-tshirt.png", thumbnail: "/assets/items/tops/boy-tshirt.png", theme: "casual", zIndex: 3 },
  { id: "tops-boy-school", name: "교복 상의", category: "tops", gender: "boy", imagePath: "/assets/items/tops/boy-school.png", thumbnail: "/assets/items/tops/boy-school.png", theme: "school", zIndex: 3 },

  // ===== Bottoms =====
  { id: "bot-girl-knee-socks", name: "리본 니삭스", category: "bottoms", gender: "girl", imagePath: "/assets/items/bottoms/girl-knee-socks.png", thumbnail: "/assets/items/bottoms/girl-knee-socks.png", zIndex: 2 },
  { id: "bot-girl-skirt", name: "플리츠 스커트", category: "bottoms", gender: "girl", imagePath: "/assets/items/bottoms/girl-skirt.png", thumbnail: "/assets/items/bottoms/girl-skirt.png", zIndex: 2 },
  { id: "bot-girl-shorts", name: "데님 숏츠", category: "bottoms", gender: "girl", imagePath: "/assets/items/bottoms/girl-shorts.png", thumbnail: "/assets/items/bottoms/girl-shorts.png", zIndex: 2 },
  // boy
  { id: "bot-boy-cargo", name: "카고 쇼츠", category: "bottoms", gender: "boy", imagePath: "/assets/items/bottoms/boy-cargo.png", thumbnail: "/assets/items/bottoms/boy-cargo.png", zIndex: 2 },

  // ===== Shoes =====
  { id: "shoes-girl-mary-jane", name: "메리제인", category: "shoes", gender: "girl", imagePath: "/assets/items/shoes/girl-mary-jane.png", thumbnail: "/assets/items/shoes/girl-mary-jane.png", zIndex: 4 },
  { id: "shoes-sneakers-white", name: "하얀 운동화", category: "shoes", gender: "unisex", imagePath: "/assets/items/shoes/sneakers-white.png", thumbnail: "/assets/items/shoes/sneakers-white.png", zIndex: 4 },
  { id: "shoes-boots", name: "부츠", category: "shoes", gender: "unisex", imagePath: "/assets/items/shoes/boots.png", thumbnail: "/assets/items/shoes/boots.png", zIndex: 4 },

  // ===== Accessories =====
  { id: "acc-pink-sunglasses", name: "핑크 선글라스", category: "accessories", gender: "unisex", imagePath: "/assets/items/accessories/girl-pink-sunglasses.png", thumbnail: "/assets/items/accessories/girl-pink-sunglasses.png", zIndex: 8 },
  { id: "acc-ribbon", name: "리본", category: "accessories", gender: "girl", imagePath: "/assets/items/accessories/ribbon.png", thumbnail: "/assets/items/accessories/ribbon.png", zIndex: 8 },
  { id: "acc-cap", name: "모자", category: "accessories", gender: "unisex", imagePath: "/assets/items/accessories/cap.png", thumbnail: "/assets/items/accessories/cap.png", zIndex: 8 },
];

export const DEMO_FRAMES: PhotoFrame[] = [
  { id: "frame-heart", name: "하트 프레임", imagePath: "/assets/frames/heart.png", thumbnail: "/assets/frames/heart.png" },
  { id: "frame-star", name: "별 프레임", imagePath: "/assets/frames/star.png", thumbnail: "/assets/frames/star.png" },
  { id: "frame-polaroid", name: "폴라로이드", imagePath: "/assets/frames/polaroid.png", thumbnail: "/assets/frames/polaroid.png" },
];

export function getItemsForCategory(category: string, gender: string): StudioItem[] {
  return DEMO_ITEMS.filter(
    (i) => i.category === category && (i.gender === gender || i.gender === "unisex")
  );
}
