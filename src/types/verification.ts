export interface VerificationResult {
  overallScore: number;
  status: "verified" | "rejected" | "manual_review";

  c2pa: {
    present: boolean;
    valid: boolean;
    issuer: string | null;
    timestamp: Date | null;
    manifest: object | null;
    score: number;
  };

  metadata: {
    hasExif: boolean;
    hasGPS: boolean;
    hasDevice: boolean;
    captureDate: Date | null;
    score: number;
  };

  aiDetection: {
    isAiGenerated: boolean;
    confidence: number;
    detector: string;
    score: number;
    details?: {
      exifScore: number;
      softwareCheck: { flagged: boolean; software: string | null };
      dimensionCheck: { flagged: boolean; width: number; height: number };
      entropyCheck: { flagged: boolean; entropy: number };
      quantizationCheck?: { flagged: boolean; uniformity: number };
      promptInMetadata?: boolean;
    };
  };

  uniqueness: {
    isDuplicate: boolean;
    similarContentIds: string[];
    score: number;
  };

  provenance: ProvenanceEvent[];
}

export interface ProvenanceEvent {
  action: string;
  device?: string;
  software?: string;
  timestamp: string;
  platform?: string;
  changes?: string[];
}

export const VERIFICATION_WEIGHTS = {
  c2pa: 0.50,
  metadata: 0.15,
  aiDetection: 0.20,
  uniqueness: 0.15,
} as const;

export const VERIFICATION_THRESHOLDS = {
  verified: 0.7,
  manual_review: 0.4,
} as const;
