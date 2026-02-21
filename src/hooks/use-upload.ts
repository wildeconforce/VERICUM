"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateFile } from "@/lib/utils/image";

interface UploadState {
  progress: number;
  isUploading: boolean;
  error: string | null;
  fileKey: string | null;
}

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
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase();
      const contentId = crypto.randomUUID();
      const fileKey = `originals/${userId}/${contentId}/original.${ext}`;

      setState((s) => ({ ...s, progress: 10 }));

      const { error: uploadError } = await supabase.storage
        .from("vericum-content")
        .upload(fileKey, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setState((s) => ({ ...s, progress: 100, isUploading: false, fileKey }));
      return { fileKey, contentId };
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
