import { generateHashes, checkDuplicateHash } from "./hash";
import { extractExifData, extractDeviceInfo, scoreMetadata } from "./extract";
import { VerificationInput, C2PAManifest } from "./types";
import {
  VERIFICATION_WEIGHTS,
  VERIFICATION_THRESHOLDS,
  VerificationResult,
  ProvenanceEvent,
} from "@/types/verification";

let createC2pa: any = null;

async function getC2paReader() {
  if (!createC2pa) {
    try {
      const c2paModule = eval('require')("c2pa-node");
      createC2pa = c2paModule.createC2pa;
    } catch {
      console.warn("c2pa-node not available, falling back to heuristic detection");
      return null;
    }
  }
  try {
    const c2pa = createC2pa();
    return c2pa;
  } catch {
    return null;
  }
}

function scoreAIDetection(exif: ReturnType<typeof extractExifData>): {
  isAiGenerated: boolean;
  confidence: number;
  detector: string;
  score: number;
} {
  // MVP heuristic-based AI detection
  // Strong EXIF data with device info suggests real camera capture
  let humanScore = 0;

  if (exif) {
    if (exif.make && exif.model) humanScore += 0.3;
    if (exif.exposureTime && exif.fNumber && exif.iso) humanScore += 0.25;
    if (exif.gpsLatitude && exif.gpsLongitude) humanScore += 0.2;
    if (exif.dateTime) humanScore += 0.1;
    if (exif.focalLength) humanScore += 0.15;
  }

  return {
    isAiGenerated: humanScore < 0.3,
    confidence: Math.abs(humanScore - 0.5) * 2,
    detector: "heuristic-exif-v1",
    score: Math.min(humanScore, 1), // Higher = more likely human
  };
}

function buildProvenance(
  exif: ReturnType<typeof extractExifData>,
  c2paManifest: C2PAManifest | null,
  c2paReadResult: any
): ProvenanceEvent[] {
  const events: ProvenanceEvent[] = [];

  if (exif?.dateTime) {
    events.push({
      action: "created",
      device: [exif.make, exif.model].filter(Boolean).join(" ") || undefined,
      timestamp: exif.dateTime,
      software: exif.software || undefined,
    });
  }

  // Add C2PA provenance events from real manifest
  if (c2paReadResult?.active_manifest) {
    const manifest = c2paReadResult.active_manifest;
    
    if (manifest.claim_generator) {
      events.push({
        action: "signed",
        software: manifest.claim_generator,
        timestamp: manifest.signature_info?.time || new Date().toISOString(),
        platform: "C2PA Verified",
      });
    }

    if (manifest.assertions) {
      for (const assertion of manifest.assertions) {
        if (assertion.label && assertion.label.includes("action")) {
          const actions = assertion.data?.actions || [];
          for (const action of actions) {
            events.push({
              action: action.action || "edited",
              software: action.softwareAgent || manifest.claim_generator || undefined,
              timestamp: action.when || manifest.signature_info?.time || new Date().toISOString(),
            });
          }
        }
      }
    }
  } else if (c2paManifest?.assertions) {
    for (const assertion of c2paManifest.assertions) {
      if (assertion.label.includes("action")) {
        events.push({
          action: "edited",
          software: c2paManifest.claim_generator || undefined,
          timestamp: c2paManifest.signature_info?.time || new Date().toISOString(),
        });
      }
    }
  }

  events.push({
    action: "uploaded",
    platform: "Vericum",
    timestamp: new Date().toISOString(),
  });

  return events;
}

export async function verifyContent(
  input: VerificationInput,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any
): Promise<VerificationResult> {
  // Step 1: Generate hashes
  const hashes = await generateHashes(input.fileBuffer);

  // Step 2: Extract EXIF metadata
  const exif = extractExifData(input.fileBuffer);
  const deviceInfo = extractDeviceInfo(exif);
  const metadataScore = scoreMetadata(exif);

  // Step 3: C2PA manifest check using c2pa-node SDK
  let c2paResult = {
    present: false,
    valid: false,
    issuer: null as string | null,
    timestamp: null as Date | null,
    manifest: null as C2PAManifest | null,
    score: 0,
  };

  let c2paReadResult: any = null;

  try {
    const c2pa = await getC2paReader();
    
    if (c2pa) {
      // Use real c2pa-node SDK to read and validate manifest
      const result = await c2pa.read({
        buffer: input.fileBuffer,
        mimeType: input.mimeType,
      });

      if (result && result.active_manifest) {
        c2paReadResult = result;
        const activeManifest = result.active_manifest;
        
        // Check validation status
        const validationErrors = result.validation_status?.filter(
          (v: any) => v.code && !v.code.includes(".valid")
        ) || [];
        const isValid = validationErrors.length === 0;

        // Extract issuer from signature info
        const issuer = activeManifest.signature_info?.issuer || 
                       activeManifest.claim_generator || 
                       "Unknown Issuer";
        
        // Extract timestamp
        const timestamp = activeManifest.signature_info?.time 
          ? new Date(activeManifest.signature_info.time) 
          : null;

        // Build manifest object for storage
        const manifestData: C2PAManifest = {
          title: activeManifest.title || input.fileName,
          format: activeManifest.format || input.mimeType,
          claim_generator: activeManifest.claim_generator,
          assertions: activeManifest.assertions || [],
          signature_info: activeManifest.signature_info,
        };

        // Score: 1.0 if valid C2PA, 0.5 if present but validation issues
        c2paResult = {
          present: true,
          valid: isValid,
          issuer,
          timestamp,
          manifest: manifestData,
          score: isValid ? 1.0 : 0.5,
        };

        console.log(`[VVE] C2PA manifest found! Issuer: ${issuer}, Valid: ${isValid}`);
      } else {
        console.log("[VVE] No C2PA manifest found in file");
      }
    } else {
      // Fallback: check for C2PA/JUMBF markers in the file
      const hasC2PAMarker =
        input.fileBuffer.includes(Buffer.from("c2pa")) ||
        input.fileBuffer.includes(Buffer.from("jumb")) ||
        input.fileBuffer.includes(Buffer.from("C2PA"));

      if (hasC2PAMarker) {
        c2paResult = {
          present: true,
          valid: false,
          issuer: "C2PA Marker Detected (SDK unavailable)",
          timestamp: new Date(),
          manifest: { title: input.fileName, format: input.mimeType },
          score: 0.5,
        };
        console.log("[VVE] C2PA marker detected via fallback");
      }
    }
  } catch (err) {
    console.error("[VVE] C2PA extraction error:", err);
    // Still try fallback marker detection
    try {
      const hasC2PAMarker =
        input.fileBuffer.includes(Buffer.from("c2pa")) ||
        input.fileBuffer.includes(Buffer.from("jumb")) ||
        input.fileBuffer.includes(Buffer.from("C2PA"));

      if (hasC2PAMarker) {
        c2paResult = {
          present: true,
          valid: false,
          issuer: "C2PA Marker Detected (validation failed)",
          timestamp: new Date(),
          manifest: { title: input.fileName, format: input.mimeType },
          score: 0.3,
        };
      }
    } catch {
      // Complete failure
    }
  }

  // Step 4: AI detection (heuristic)
  const aiDetection = scoreAIDetection(exif);

  // Step 5: Duplicate check
  const uniqueness = await checkDuplicateHash(hashes.sha256, supabaseAdmin);
  const uniquenessScore = uniqueness.isDuplicate ? 0 : 1;

  // Step 6: Calculate composite score
  let overallScore =
    c2paResult.score * VERIFICATION_WEIGHTS.c2pa +
    metadataScore.score * VERIFICATION_WEIGHTS.metadata +
    aiDetection.score * VERIFICATION_WEIGHTS.aiDetection +
    uniquenessScore * VERIFICATION_WEIGHTS.uniqueness;

  // C2PA validity bonus: a valid C2PA manifest is strong proof of provenance
  if (c2paResult.present && c2paResult.valid) {
    overallScore = Math.max(overallScore, VERIFICATION_THRESHOLDS.verified);
  }

  // Determine status
  let status: "verified" | "rejected" | "manual_review";
  if (overallScore >= VERIFICATION_THRESHOLDS.verified) {
    status = "verified";
  } else if (overallScore >= VERIFICATION_THRESHOLDS.manual_review) {
    status = "manual_review";
  } else {
    status = "rejected";
  }

  const provenance = buildProvenance(exif, c2paResult.manifest, c2paReadResult);

  console.log(`[VVE] Verification complete: score=${overallScore.toFixed(3)}, status=${status}, c2pa=${c2paResult.present}, valid=${c2paResult.valid}`);

  return {
    overallScore,
    status,
    c2pa: c2paResult,
    metadata: metadataScore,
    aiDetection,
    uniqueness: {
      isDuplicate: uniqueness.isDuplicate,
      similarContentIds: uniqueness.similarContentIds,
      score: uniquenessScore,
    },
    provenance,
  };
}