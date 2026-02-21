"use client";

import { useCallback, useState } from "react";
import { useUpload } from "@/hooks/use-upload";
import { useAuth } from "@/hooks/use-auth";
import { validateFile, getAcceptedMimeTypes } from "@/lib/utils/image";
import { Button } from "@/components/ui/button";
import { Upload, X, FileImage, Loader2 } from "lucide-react";
import { formatFileSize } from "@/lib/utils/format";

interface ContentUploaderProps {
  onUploadComplete: (result: { fileKey: string; contentId: string }) => void;
}

export function ContentUploader({ onUploadComplete }: ContentUploaderProps) {
  const { user } = useAuth();
  const { progress, isUploading, error, upload, reset } = useUpload();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setValidationError(validation.error!);
      return;
    }
    setValidationError(null);
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    const result = await upload(selectedFile, user.id);
    if (result) {
      onUploadComplete(result);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    reset();
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={getAcceptedMimeTypes()}
            onChange={handleSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-1">
            Drag & drop your file here
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse. Supports JPG, PNG, WebP, TIFF, RAW (max 50MB)
          </p>
        </div>
      ) : (
        <div className="border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FileImage className="h-10 w-10 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {!isUploading && (
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isUploading && (
            <div className="mt-3">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Uploading... {progress}%
              </p>
            </div>
          )}
          {!isUploading && (
            <Button onClick={handleUpload} className="mt-3 w-full" disabled={!user}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          )}
        </div>
      )}
      {(error || validationError) && (
        <p className="text-sm text-destructive">
          {error || validationError}
        </p>
      )}
    </div>
  );
}
