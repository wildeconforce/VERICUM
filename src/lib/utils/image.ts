import { FILE_LIMITS, MIME_TO_TYPE } from "@/lib/constants";

export function getContentTypeFromMime(mimeType: string): string | null {
  return MIME_TO_TYPE[mimeType] || null;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const contentType = getContentTypeFromMime(file.type);
  if (!contentType) {
    return { valid: false, error: `Unsupported file type: ${file.type}` };
  }

  const limits = FILE_LIMITS[contentType as keyof typeof FILE_LIMITS];
  if (file.size > limits.maxSize) {
    const maxMB = limits.maxSize / (1024 * 1024);
    return { valid: false, error: `File too large. Maximum size is ${maxMB}MB` };
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && !(limits.formats as readonly string[]).includes(ext)) {
    return { valid: false, error: `Unsupported format: .${ext}` };
  }

  return { valid: true };
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function getAcceptedMimeTypes(): string {
  return Object.keys(MIME_TO_TYPE).join(",");
}
