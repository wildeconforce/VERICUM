import { ExifData, DeviceInfo } from "./types";

export function extractExifData(buffer: Buffer): ExifData | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ExifParser = require("exif-parser");
    const parser = ExifParser.create(buffer);
    const result = parser.parse();
    const tags = result.tags || {};

    return {
      make: tags.Make || undefined,
      model: tags.Model || undefined,
      software: tags.Software || undefined,
      dateTime: tags.DateTimeOriginal
        ? new Date(tags.DateTimeOriginal * 1000).toISOString()
        : undefined,
      exposureTime: tags.ExposureTime || undefined,
      fNumber: tags.FNumber || undefined,
      iso: tags.ISO || undefined,
      focalLength: tags.FocalLength || undefined,
      gpsLatitude: tags.GPSLatitude || undefined,
      gpsLongitude: tags.GPSLongitude || undefined,
      gpsAltitude: tags.GPSAltitude || undefined,
      imageWidth: tags.ImageWidth || tags.ExifImageWidth || undefined,
      imageHeight: tags.ImageHeight || tags.ExifImageHeight || undefined,
    };
  } catch {
    return null;
  }
}

export function extractDeviceInfo(exif: ExifData | null): DeviceInfo {
  return {
    make: exif?.make || null,
    model: exif?.model || null,
    software: exif?.software || null,
  };
}

export function scoreMetadata(exif: ExifData | null): {
  hasExif: boolean;
  hasGPS: boolean;
  hasDevice: boolean;
  captureDate: Date | null;
  score: number;
} {
  if (!exif) {
    return { hasExif: false, hasGPS: false, hasDevice: false, captureDate: null, score: 0 };
  }

  const hasExif = true;
  const hasGPS = !!(exif.gpsLatitude && exif.gpsLongitude);
  const hasDevice = !!(exif.make && exif.model);
  const captureDate = exif.dateTime ? new Date(exif.dateTime) : null;
  const hasExposure = !!(exif.exposureTime && exif.fNumber && exif.iso);

  let score = 0.2; // Base score for having any EXIF
  if (hasGPS) score += 0.25;
  if (hasDevice) score += 0.25;
  if (captureDate) score += 0.15;
  if (hasExposure) score += 0.15;

  return { hasExif, hasGPS, hasDevice, captureDate, score: Math.min(score, 1) };
}
