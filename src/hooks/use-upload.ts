"use client";

import { useState, useCallback } from "react";
import { validateFile } from "@/lib/utils/image";

interface UploadState {
  progress: number;
  isUploading: boolean;
  error: string | null;
  fileKey: string | null;
}

const UPLOAD_TIMEOUT_MS = 60_000;

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    isUploading: false,
    error: null,
    fileKey: null,
  });

  const upload = useCallback(async (file: File, userId: string) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setState((s) => ({ ...s, error: validation.error! }));
      return null;
    }

    setState({ progress: 0, isUploading: true, error: null, fileKey: null });

    try {
      // Step 1: Get signed upload URL from our API (server-side, no browser lock)
      setState((s) => ({ ...s, progress: 5 }));

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
          file_size: file.size,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }

      const { upload_url, file_key, content_id } = await res.json();

      // Step 2: Upload file directly to Supabase Storage via signed URL
      // Uses XMLHttpRequest for real progress tracking + timeout
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const timeoutId = setTimeout(() => {
          xhr.abort();
          reject(new Error("Upload timed out"));
        }, UPLOAD_TIMEOUT_MS);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            // Map upload progress to 10-95% range (5% for signed URL, 95-100% for completion)
            const pct = Math.round(10 + (e.loaded / e.total) * 85);
            setState((s) => ({ ...s, progress: pct }));
          }
        });

        xhr.addEventListener("load", () => {
          clearTimeout(timeoutId);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          clearTimeout(timeoutId);
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          // Only reject if not already rejected by timeout
        });

        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.setRequestHeader("Cache-Control", "max-age=3600");
        xhr.send(file);
      });

      setState((s) => ({ ...s, progress: 100, isUploading: false, fileKey: file_key }));
      return { fileKey: file_key, contentId: content_id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setState({ progress: 0, isUploading: false, error: message, fileKey: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ progress: 0, isUploading: false, error: null, fileKey: null });
  }, []);

  return { ...state, upload, reset };
}
