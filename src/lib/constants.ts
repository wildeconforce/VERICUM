export const APP_NAME = "Vericum";
export const APP_DESCRIPTION = "Verified content marketplace powered by C2PA authenticity";

export const CATEGORIES = [
  "photojournalism",
  "nature-wildlife",
  "street-urban",
  "portrait",
  "event-documentary",
  "aerial-drone",
  "food-lifestyle",
  "architecture",
  "sports",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  photojournalism: "Photojournalism",
  "nature-wildlife": "Nature & Wildlife",
  "street-urban": "Street & Urban",
  portrait: "Portrait",
  "event-documentary": "Event & Documentary",
  "aerial-drone": "Aerial & Drone",
  "food-lifestyle": "Food & Lifestyle",
  architecture: "Architecture",
  sports: "Sports",
  other: "Other",
};

export const CONTENT_TYPES = ["photo", "video", "document", "audio"] as const;

export const FILE_LIMITS = {
  photo: { maxSize: 50 * 1024 * 1024, formats: ["jpg", "jpeg", "png", "webp", "tiff", "cr2", "nef", "arw"] },
  video: { maxSize: 500 * 1024 * 1024, formats: ["mp4", "mov", "mkv"] },
  document: { maxSize: 20 * 1024 * 1024, formats: ["pdf"] },
  audio: { maxSize: 100 * 1024 * 1024, formats: ["wav", "mp3", "flac"] },
} as const;

export const MIME_TO_TYPE: Record<string, string> = {
  "image/jpeg": "photo",
  "image/png": "photo",
  "image/webp": "photo",
  "image/tiff": "photo",
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/x-matroska": "video",
  "application/pdf": "document",
  "audio/wav": "audio",
  "audio/mpeg": "audio",
  "audio/flac": "audio",
};

export const LICENSE_TYPES = ["personal", "standard", "extended", "exclusive"] as const;

export const LICENSE_LABELS: Record<string, string> = {
  personal: "Personal Use",
  standard: "Standard Commercial",
  extended: "Extended Commercial",
  exclusive: "Exclusive Rights",
};

export const LICENSE_DESCRIPTIONS: Record<string, string> = {
  personal: "For personal, non-commercial use only",
  standard: "Commercial use in a single project",
  extended: "Commercial use in unlimited projects",
  exclusive: "Full rights transfer to buyer",
};

export const ITEMS_PER_PAGE = 20;
export const MAX_ITEMS_PER_PAGE = 50;
