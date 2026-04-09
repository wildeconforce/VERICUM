export interface C2PAManifest {
  title?: string;
  format?: string;
  instance_id?: string;
  claim_generator?: string;
  signature_info?: {
    issuer?: string;
    cert_serial_number?: string;
    time?: string;
  };
  assertions?: C2PAAssertion[];
  ingredients?: C2PAIngredient[];
}

export interface C2PAAssertion {
  label: string;
  data: Record<string, unknown>;
}

export interface C2PAIngredient {
  title?: string;
  format?: string;
  instance_id?: string;
  relationship?: string;
}

export interface ExifData {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  imageWidth?: number;
  imageHeight?: number;
}

export interface DeviceInfo {
  make: string | null;
  model: string | null;
  software: string | null;
}

export interface VerificationInput {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface HashResult {
  sha256: string;
  perceptualHash: string | null;
}
