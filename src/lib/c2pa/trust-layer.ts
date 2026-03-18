/**
 * Vericum Trust Layer (VTL)
 *
 * A proprietary verification layer that sits ON TOP of standard C2PA.
 * While C2PA proves "who signed this content", VTL answers:
 *   - Is this content genuinely human-created?
 *   - Has this content been tampered with?
 *   - Can we trust the provenance chain?
 *   - What is the cross-verified trust score?
 *
 * Architecture:
 *   Layer 1: C2PA Standard (manifest + certificate chain)
 *   Layer 2: Vericum Trust Layer
 *     ├── Temporal Integrity (timestamp consistency checks)
 *     ├── Device Fingerprint (camera/device authenticity)
 *     ├── Cross-Reference (multi-signal correlation)
 *     ├── AI Ensemble (heuristic + external API fusion)
 *     └── Audit Trail (immutable verification log)
 *
 * Each sub-layer produces a confidence score [0, 1].
 * The VTL score is a weighted combination that can OVERRIDE
 * the base C2PA result when signals conflict.
 */

import { VerificationResult, ProvenanceEvent } from "@/types/verification";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VTLResult {
  /** Vericum Trust Score: 0.0 (untrusted) → 1.0 (fully trusted) */
  trustScore: number;
  /** Trust tier derived from score */
  trustTier: "platinum" | "gold" | "silver" | "bronze" | "untrusted";
  /** Individual layer results */
  layers: {
    temporal: TemporalIntegrityResult;
    device: DeviceFingerprintResult;
    crossRef: CrossReferenceResult;
    aiEnsemble: AIEnsembleResult;
  };
  /** Flags that can override the final status */
  flags: TrustFlag[];
  /** Verification audit log entry */
  auditEntry: AuditLogEntry;
}

export interface TemporalIntegrityResult {
  score: number;
  consistent: boolean;
  checks: {
    exifTimestampValid: boolean;
    c2paTimestampValid: boolean;
    timestampsConsistent: boolean;
    notFutureDate: boolean;
    reasonableAge: boolean;
  };
  details: string;
}

export interface DeviceFingerprintResult {
  score: number;
  knownDevice: boolean;
  deviceCategory: "professional_camera" | "smartphone" | "scanner" | "software" | "unknown";
  checks: {
    hasRealDevice: boolean;
    exifConsistentWithDevice: boolean;
    knownManufacturer: boolean;
    lensDataPresent: boolean;
    firmwareVersionPresent: boolean;
  };
  details: string;
}

export interface CrossReferenceResult {
  score: number;
  signalAgreement: number;
  checks: {
    c2paAndExifAgree: boolean;
    aiScoreAndMetadataAgree: boolean;
    hashUnique: boolean;
    provenanceChainComplete: boolean;
    noConflictingSignals: boolean;
  };
  conflictingSignals: string[];
  details: string;
}

export interface AIEnsembleResult {
  score: number;
  /** Which detectors contributed */
  detectors: {
    name: string;
    score: number;
    weight: number;
    available: boolean;
  }[];
  /** Fused result */
  isLikelyHuman: boolean;
  confidence: number;
  details: string;
}

export interface TrustFlag {
  type: "critical" | "warning" | "info";
  code: string;
  message: string;
}

export interface AuditLogEntry {
  verificationId: string;
  contentId: string;
  timestamp: string;
  engineVersion: string;
  inputHash: string;
  c2paPresent: boolean;
  vtlScore: number;
  trustTier: string;
  layers: Record<string, number>;
  flags: TrustFlag[];
  processingTimeMs: number;
}

// ─── Known Device Database ──────────────────────────────────────────────────

const KNOWN_CAMERA_MAKES = new Set([
  "canon", "nikon", "sony", "fujifilm", "olympus", "panasonic", "leica",
  "hasselblad", "pentax", "sigma", "ricoh", "phase one", "mamiya",
  "gopro", "dji", "insta360", "red", "blackmagic", "arri",
]);

const KNOWN_PHONE_MAKES = new Set([
  "apple", "samsung", "google", "huawei", "xiaomi", "oppo", "vivo",
  "oneplus", "motorola", "lg", "sony", "nokia", "asus", "realme",
]);

const KNOWN_SOFTWARE_EDITORS = new Set([
  "adobe photoshop", "adobe lightroom", "capture one", "darktable",
  "rawtherapee", "affinity photo", "gimp", "photomator", "pixelmator",
  "snapseed", "vsco", "luminar",
]);

// ─── Layer 1: Temporal Integrity ─────────────────────────────────────────────

export function checkTemporalIntegrity(
  verification: VerificationResult
): TemporalIntegrityResult {
  const now = new Date();
  const checks = {
    exifTimestampValid: false,
    c2paTimestampValid: false,
    timestampsConsistent: false,
    notFutureDate: true,
    reasonableAge: true,
  };

  let score = 0.5; // Neutral starting point
  const issues: string[] = [];

  // Check EXIF timestamp
  const captureDate = verification.metadata.captureDate;
  if (captureDate) {
    checks.exifTimestampValid = true;
    score += 0.1;

    // Not in the future
    if (captureDate > now) {
      checks.notFutureDate = false;
      score -= 0.3;
      issues.push("EXIF timestamp is in the future");
    }

    // Not unreasonably old (before digital cameras existed, pre-1990)
    const minDate = new Date("1990-01-01");
    if (captureDate < minDate) {
      checks.reasonableAge = false;
      score -= 0.2;
      issues.push("EXIF timestamp predates digital photography era");
    }
  }

  // Check C2PA timestamp
  const c2paTimestamp = verification.c2pa.timestamp;
  if (c2paTimestamp) {
    checks.c2paTimestampValid = true;
    score += 0.1;

    if (c2paTimestamp > now) {
      checks.notFutureDate = false;
      score -= 0.3;
      issues.push("C2PA timestamp is in the future");
    }
  }

  // Cross-check: EXIF and C2PA timestamps should be consistent
  if (captureDate && c2paTimestamp) {
    const diffMs = Math.abs(captureDate.getTime() - c2paTimestamp.getTime());
    const diffHours = diffMs / (1000 * 60 * 60);

    // C2PA signing typically happens shortly after capture
    // Allow up to 30 days for reasonable editing workflow
    if (diffHours <= 720) {
      checks.timestampsConsistent = true;
      score += 0.2;
    } else {
      issues.push(
        `Timestamps diverge by ${Math.round(diffHours / 24)} days`
      );
    }
  } else if (!captureDate && !c2paTimestamp) {
    score -= 0.1;
    issues.push("No timestamps available for validation");
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    consistent: checks.timestampsConsistent || (!captureDate || !c2paTimestamp),
    checks,
    details:
      issues.length > 0
        ? issues.join("; ")
        : "Temporal integrity checks passed",
  };
}

// ─── Layer 2: Device Fingerprint ─────────────────────────────────────────────

export function checkDeviceFingerprint(
  verification: VerificationResult,
  exifData: Record<string, unknown> | null
): DeviceFingerprintResult {
  const checks = {
    hasRealDevice: false,
    exifConsistentWithDevice: false,
    knownManufacturer: false,
    lensDataPresent: false,
    firmwareVersionPresent: false,
  };

  let score = 0.3; // Base score
  const details: string[] = [];

  const make = ((exifData?.make as string) || "").toLowerCase().trim();
  const model = ((exifData?.model as string) || "").toLowerCase().trim();
  const software = ((exifData?.software as string) || "").toLowerCase().trim();

  // Check if device info exists
  if (make && model) {
    checks.hasRealDevice = true;
    score += 0.15;
  }

  // Check known manufacturer
  let deviceCategory: DeviceFingerprintResult["deviceCategory"] = "unknown";

  if (make) {
    if (KNOWN_CAMERA_MAKES.has(make)) {
      checks.knownManufacturer = true;
      deviceCategory = "professional_camera";
      score += 0.2;
    } else if (KNOWN_PHONE_MAKES.has(make)) {
      checks.knownManufacturer = true;
      deviceCategory = "smartphone";
      score += 0.15;
    }
  }

  if (software) {
    for (const editor of KNOWN_SOFTWARE_EDITORS) {
      if (software.includes(editor)) {
        deviceCategory = deviceCategory === "unknown" ? "software" : deviceCategory;
        break;
      }
    }
  }

  // Check EXIF consistency with claimed device
  if (verification.metadata.hasExif && checks.hasRealDevice) {
    // Professional cameras should have exposure data
    if (
      deviceCategory === "professional_camera" &&
      exifData?.exposureTime &&
      exifData?.fNumber &&
      exifData?.iso
    ) {
      checks.exifConsistentWithDevice = true;
      score += 0.15;
    } else if (deviceCategory === "smartphone") {
      // Smartphones should at least have basic exposure
      checks.exifConsistentWithDevice = !!(exifData?.exposureTime || exifData?.fNumber);
      if (checks.exifConsistentWithDevice) score += 0.1;
    }
  }

  // Lens data (strong signal for real cameras)
  if (exifData?.focalLength) {
    checks.lensDataPresent = true;
    score += 0.1;
  }

  // Firmware/software version
  if (software && /\d+\.\d+/.test(software)) {
    checks.firmwareVersionPresent = true;
    score += 0.05;
  }

  if (!checks.hasRealDevice) {
    details.push("No device information found");
  }
  if (!checks.knownManufacturer && make) {
    details.push(`Unknown manufacturer: ${make}`);
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    knownDevice: checks.knownManufacturer,
    deviceCategory,
    checks,
    details: details.length > 0 ? details.join("; ") : "Device fingerprint valid",
  };
}

// ─── Layer 3: Cross-Reference ────────────────────────────────────────────────

export function checkCrossReference(
  verification: VerificationResult
): CrossReferenceResult {
  const checks = {
    c2paAndExifAgree: false,
    aiScoreAndMetadataAgree: false,
    hashUnique: false,
    provenanceChainComplete: false,
    noConflictingSignals: true,
  };

  let score = 0.5;
  const conflicting: string[] = [];

  // C2PA and EXIF agreement: both present or both absent
  const hasC2PA = verification.c2pa.present;
  const hasExif = verification.metadata.hasExif;

  if (hasC2PA && hasExif) {
    checks.c2paAndExifAgree = true;
    score += 0.15;
  } else if (hasC2PA && !hasExif) {
    // C2PA without EXIF is suspicious — might be a synthetic image with injected C2PA
    conflicting.push("C2PA manifest present but no EXIF metadata");
    checks.noConflictingSignals = false;
    score -= 0.1;
  } else if (!hasC2PA && hasExif) {
    // No C2PA but has EXIF — common for older cameras, not suspicious
    checks.c2paAndExifAgree = true;
    score += 0.05;
  }

  // AI score and metadata agreement
  const aiSaysHuman = verification.aiDetection.score >= 0.5;
  const metadataSaysReal = verification.metadata.score >= 0.5;

  if (aiSaysHuman === metadataSaysReal) {
    checks.aiScoreAndMetadataAgree = true;
    score += 0.1;
  } else {
    conflicting.push(
      `AI detector says ${aiSaysHuman ? "human" : "AI"} but metadata suggests ${metadataSaysReal ? "real" : "synthetic"}`
    );
    checks.noConflictingSignals = false;
    score -= 0.1;
  }

  // Hash uniqueness
  if (!verification.uniqueness.isDuplicate) {
    checks.hashUnique = true;
    score += 0.1;
  } else {
    conflicting.push("Duplicate content detected");
    checks.noConflictingSignals = false;
    score -= 0.15;
  }

  // Provenance chain completeness
  if (verification.provenance.length >= 2) {
    // At least "created" and "uploaded" events
    checks.provenanceChainComplete = true;
    score += 0.1;
  }

  // Bonus: strong agreement across all signals
  const allAgree =
    checks.c2paAndExifAgree &&
    checks.aiScoreAndMetadataAgree &&
    checks.hashUnique;
  if (allAgree) {
    score += 0.1;
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    signalAgreement: allAgree ? 1.0 : conflicting.length === 0 ? 0.7 : 0.3,
    checks,
    conflictingSignals: conflicting,
    details:
      conflicting.length > 0
        ? `Conflicting signals: ${conflicting.join("; ")}`
        : "All verification signals are consistent",
  };
}

// ─── Layer 4: AI Ensemble (local + external) ─────────────────────────────────

export function buildAIEnsemble(
  localResult: VerificationResult["aiDetection"],
  externalResults: { name: string; score: number; available: boolean }[]
): AIEnsembleResult {
  const detectors: AIEnsembleResult["detectors"] = [];

  // Local heuristic detector always runs (weight: 0.4 if no externals, else 0.25)
  const hasExternals = externalResults.some((r) => r.available);

  detectors.push({
    name: localResult.detector,
    score: localResult.score,
    weight: hasExternals ? 0.25 : 1.0,
    available: true,
  });

  if (hasExternals) {
    // Distribute remaining 0.75 weight among available externals
    const availableExternals = externalResults.filter((r) => r.available);
    const externalWeight = 0.75 / availableExternals.length;

    for (const ext of externalResults) {
      detectors.push({
        name: ext.name,
        score: ext.score,
        weight: ext.available ? externalWeight : 0,
        available: ext.available,
      });
    }
  }

  // Weighted fusion
  let fusedScore = 0;
  let totalWeight = 0;
  for (const d of detectors) {
    if (d.available) {
      fusedScore += d.score * d.weight;
      totalWeight += d.weight;
    }
  }
  if (totalWeight > 0) {
    fusedScore /= totalWeight;
  }

  // Confidence: agreement among detectors
  const availableScores = detectors.filter((d) => d.available).map((d) => d.score);
  let confidence = 1.0;
  if (availableScores.length > 1) {
    const mean = availableScores.reduce((a, b) => a + b, 0) / availableScores.length;
    const variance =
      availableScores.reduce((a, b) => a + (b - mean) ** 2, 0) / availableScores.length;
    // High variance = low confidence
    confidence = Math.max(0, 1 - Math.sqrt(variance) * 2);
  }

  return {
    score: fusedScore,
    detectors,
    isLikelyHuman: fusedScore >= 0.5,
    confidence,
    details: `AI ensemble: ${detectors.filter((d) => d.available).length} detectors, fused score ${fusedScore.toFixed(3)}`,
  };
}

// ─── Trust Score Calculation ─────────────────────────────────────────────────

const VTL_WEIGHTS = {
  temporal: 0.15,
  device: 0.20,
  crossRef: 0.25,
  aiEnsemble: 0.40,
} as const;

function determineTrustTier(score: number): VTLResult["trustTier"] {
  if (score >= 0.90) return "platinum";
  if (score >= 0.75) return "gold";
  if (score >= 0.55) return "silver";
  if (score >= 0.35) return "bronze";
  return "untrusted";
}

// ─── Main VTL Entry Point ────────────────────────────────────────────────────

export function computeVericumTrustLayer(
  verification: VerificationResult,
  exifData: Record<string, unknown> | null,
  externalAIResults: { name: string; score: number; available: boolean }[],
  contentId: string,
  inputHash: string
): VTLResult {
  const startTime = Date.now();
  const flags: TrustFlag[] = [];

  // Run all sub-layers
  const temporal = checkTemporalIntegrity(verification);
  const device = checkDeviceFingerprint(verification, exifData);
  const crossRef = checkCrossReference(verification);
  const aiEnsemble = buildAIEnsemble(verification.aiDetection, externalAIResults);

  // Compute weighted trust score
  let trustScore =
    temporal.score * VTL_WEIGHTS.temporal +
    device.score * VTL_WEIGHTS.device +
    crossRef.score * VTL_WEIGHTS.crossRef +
    aiEnsemble.score * VTL_WEIGHTS.aiEnsemble;

  // Apply flags and overrides

  // Critical: duplicate content
  if (verification.uniqueness.isDuplicate) {
    flags.push({
      type: "critical",
      code: "DUPLICATE_CONTENT",
      message: "This content already exists in the database",
    });
    trustScore = Math.min(trustScore, 0.2);
  }

  // Critical: future timestamp
  if (!temporal.checks.notFutureDate) {
    flags.push({
      type: "critical",
      code: "FUTURE_TIMESTAMP",
      message: "Content has a future timestamp — possible metadata manipulation",
    });
    trustScore *= 0.5;
  }

  // Warning: conflicting signals
  if (crossRef.conflictingSignals.length > 0) {
    flags.push({
      type: "warning",
      code: "CONFLICTING_SIGNALS",
      message: crossRef.conflictingSignals.join("; "),
    });
  }

  // Warning: no device info
  if (!device.checks.hasRealDevice) {
    flags.push({
      type: "warning",
      code: "NO_DEVICE_INFO",
      message: "No camera or device information found in metadata",
    });
  }

  // Info: C2PA bonus
  if (verification.c2pa.present && verification.c2pa.valid) {
    flags.push({
      type: "info",
      code: "C2PA_VERIFIED",
      message: `Valid C2PA manifest from ${verification.c2pa.issuer}`,
    });
    // Boost trust score for valid C2PA
    trustScore = Math.max(trustScore, 0.75);
  }

  // Low AI confidence warning
  if (aiEnsemble.confidence < 0.5) {
    flags.push({
      type: "warning",
      code: "LOW_AI_CONFIDENCE",
      message: "AI detection confidence is low — result may be unreliable",
    });
  }

  trustScore = Math.max(0, Math.min(1, trustScore));
  const trustTier = determineTrustTier(trustScore);
  const processingTimeMs = Date.now() - startTime;

  const auditEntry: AuditLogEntry = {
    verificationId: `vtl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    contentId,
    timestamp: new Date().toISOString(),
    engineVersion: "VTL-1.0.0",
    inputHash,
    c2paPresent: verification.c2pa.present,
    vtlScore: trustScore,
    trustTier,
    layers: {
      temporal: temporal.score,
      device: device.score,
      crossRef: crossRef.score,
      aiEnsemble: aiEnsemble.score,
    },
    flags,
    processingTimeMs,
  };

  return {
    trustScore,
    trustTier,
    layers: { temporal, device, crossRef, aiEnsemble },
    flags,
    auditEntry,
  };
}
