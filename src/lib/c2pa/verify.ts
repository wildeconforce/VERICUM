import { generateHashes, checkDuplicateHash, checkPerceptualDuplicates } from "./hash";
import { extractExifData, extractDeviceInfo, scoreMetadata } from "./extract";
import { VerificationInput, C2PAManifest } from "./types";
import {
  VERIFICATION_WEIGHTS,
  VERIFICATION_THRESHOLDS,
  VerificationResult,
  ProvenanceEvent,
} from "@/types/verification";
import { computeVericumTrustLayer } from "./trust-layer";
import { runExternalAIDetectors } from "./ai-detectors";

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

// --- AI Detection Sub-Analyzers ---

const AI_SOFTWARE_KEYWORDS = [
  "stable diffusion",
  "dall-e",
  "dall·e",
  "midjourney",
  "comfyui",
  "automatic1111",
  "a1111",
  "novelai",
  "adobe firefly ai",
  "invoke ai",
  "invokeai",
  "dreamstudio",
  "stability ai",
  "stablediffusion",
  "nai diffusion",
  "artbreeder",
  "craiyon",
  "deepai",
  "nightcafe",
  "leonardo.ai",
  "playground ai",
  "runwayml",
  "runway",
  "flux",
] as const;

const AI_PROMPT_KEYWORDS = [
  "parameters",
  "prompt",
  "negative prompt",
  "negative_prompt",
  "sampler",
  "cfg scale",
  "cfg_scale",
  "seed:",
  "steps:",
  "denoising",
  "lora",
  "checkpoint",
  "model hash",
  "model_hash",
] as const;

/** Common AI generation canvas sizes (width or height) */
const AI_GENERATION_SIZES: number[] = [
  256, 384, 512, 576, 640, 768, 832, 896, 960, 1024, 1080, 1152, 1280, 1344, 1536, 2048,
];

/**
 * Check if the EXIF software field contains a known AI generation tool.
 */
function checkSoftwareField(exif: ReturnType<typeof extractExifData>): {
  flagged: boolean;
  software: string | null;
} {
  if (!exif?.software) return { flagged: false, software: null };

  const sw = exif.software.toLowerCase();
  for (const keyword of AI_SOFTWARE_KEYWORDS) {
    if (sw.includes(keyword)) {
      return { flagged: true, software: exif.software };
    }
  }
  return { flagged: false, software: exif.software };
}

/**
 * Check if image dimensions match common AI generation sizes.
 * AI tools tend to generate images at exact multiples of 64,
 * and many use square or specific aspect-ratio canvases.
 */
function checkDimensions(exif: ReturnType<typeof extractExifData>): {
  flagged: boolean;
  width: number;
  height: number;
} {
  const w = exif?.imageWidth || 0;
  const h = exif?.imageHeight || 0;
  if (w === 0 || h === 0) return { flagged: false, width: w, height: h };

  // Both dimensions are exact multiples of 64 (very common in diffusion models)
  const bothMultipleOf64 = w % 64 === 0 && h % 64 === 0;

  // Check if both dimensions are in the known AI generation sizes list
  const wInList = AI_GENERATION_SIZES.includes(w as typeof AI_GENERATION_SIZES[number]);
  const hInList = AI_GENERATION_SIZES.includes(h as typeof AI_GENERATION_SIZES[number]);

  // Square images at AI sizes are highly suspicious
  const isSquareAI = w === h && wInList;

  const flagged = isSquareAI || (bothMultipleOf64 && wInList && hInList);

  return { flagged, width: w, height: h };
}

/**
 * Check for AI-related keywords in raw file bytes (EXIF comments, XMP, IPTC).
 * Stable Diffusion and other tools often embed prompts directly.
 */
function checkPromptInRawBytes(fileBuffer: Buffer): boolean {
  try {
    // Only scan the first 64KB where metadata lives
    const scanSize = Math.min(fileBuffer.length, 65536);
    const headerStr = fileBuffer.subarray(0, scanSize).toString("latin1").toLowerCase();

    for (const keyword of AI_PROMPT_KEYWORDS) {
      if (headerStr.includes(keyword)) return true;
    }
    // Also check for common AI software names in raw bytes (XMP, IPTC, etc.)
    for (const keyword of AI_SOFTWARE_KEYWORDS) {
      if (headerStr.includes(keyword)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Lightweight Shannon entropy calculation on the first N bytes.
 * AI-generated images often have subtly different entropy characteristics
 * compared to real camera captures (typically slightly higher uniformity
 * in the compressed stream).
 *
 * Returns entropy in bits (0-8 for byte data).
 */
function calculateEntropy(fileBuffer: Buffer): { flagged: boolean; entropy: number } {
  try {
    // Sample the first 8KB of pixel data — skip the first 2 bytes (JPEG SOI marker)
    // and look past typical header area
    const offset = Math.min(512, fileBuffer.length);
    const sampleSize = Math.min(8192, fileBuffer.length - offset);
    if (sampleSize < 256) return { flagged: false, entropy: 0 };

    const sample = fileBuffer.subarray(offset, offset + sampleSize);

    // Build frequency table
    const freq = new Uint32Array(256);
    for (let i = 0; i < sample.length; i++) {
      freq[sample[i]]++;
    }

    // Shannon entropy
    let entropy = 0;
    const len = sample.length;
    for (let i = 0; i < 256; i++) {
      if (freq[i] === 0) continue;
      const p = freq[i] / len;
      entropy -= p * Math.log2(p);
    }

    // Heuristic: very high entropy (>7.9) is normal for compressed images.
    // Unusually low entropy (<6.5) in the compressed stream, or extremely
    // uniform distribution (>7.98) can indicate synthetic generation.
    // These are soft signals, not definitive.
    const flagged = entropy < 6.5 || entropy > 7.98;

    return { flagged, entropy: Math.round(entropy * 1000) / 1000 };
  } catch {
    return { flagged: false, entropy: 0 };
  }
}

/**
 * Check JPEG quantization table patterns.
 * Real cameras use manufacturer-specific quantization tables.
 * AI-generated JPEGs (or those re-encoded by AI tools) often use
 * standard/default libjpeg tables or have unusually uniform tables.
 */
function checkJpegQuantizationTables(fileBuffer: Buffer): {
  flagged: boolean;
  uniformity: number;
} {
  try {
    // JPEG files start with FF D8
    if (fileBuffer.length < 4 || fileBuffer[0] !== 0xff || fileBuffer[1] !== 0xd8) {
      return { flagged: false, uniformity: 0 };
    }

    // Scan for DQT marker (FF DB) — Define Quantization Table
    const tables: number[][] = [];
    let pos = 2;
    const maxScan = Math.min(fileBuffer.length, 65536);

    while (pos < maxScan - 1) {
      if (fileBuffer[pos] === 0xff && fileBuffer[pos + 1] === 0xdb) {
        // Found DQT marker
        const length = fileBuffer.readUInt16BE(pos + 2);
        let tablePos = pos + 4;
        const tableEnd = pos + 2 + length;

        while (tablePos < tableEnd && tablePos + 65 <= fileBuffer.length) {
          const precision = (fileBuffer[tablePos] >> 4) & 0x0f;
          // const tableId = fileBuffer[tablePos] & 0x0f;
          tablePos++;

          const tableSize = precision === 0 ? 64 : 128;
          if (tablePos + tableSize > fileBuffer.length) break;

          const values: number[] = [];
          for (let i = 0; i < 64; i++) {
            if (precision === 0) {
              values.push(fileBuffer[tablePos + i]);
            } else {
              values.push(fileBuffer.readUInt16BE(tablePos + i * 2));
            }
          }
          tables.push(values);
          tablePos += tableSize;
        }

        pos = tableEnd;
        continue;
      }

      // Skip to next marker
      if (fileBuffer[pos] === 0xff && fileBuffer[pos + 1] !== 0x00) {
        if (pos + 3 < fileBuffer.length) {
          const segLen = fileBuffer.readUInt16BE(pos + 2);
          pos += 2 + segLen;
        } else {
          pos++;
        }
      } else {
        pos++;
      }
    }

    if (tables.length === 0) return { flagged: false, uniformity: 0 };

    // Analyze table uniformity: compute coefficient of variation for each table
    // Very uniform tables (low CV) suggest default/synthetic encoding
    let totalUniformity = 0;
    for (const table of tables) {
      const mean = table.reduce((a, b) => a + b, 0) / table.length;
      if (mean === 0) continue;
      const variance = table.reduce((a, b) => a + (b - mean) ** 2, 0) / table.length;
      const cv = Math.sqrt(variance) / mean; // coefficient of variation
      // Lower CV = more uniform table
      // Real cameras typically have CV > 0.8 due to perceptual weighting
      // Default libjpeg tables have CV ~ 0.5-0.7
      totalUniformity += cv;
    }

    const avgUniformity = totalUniformity / tables.length;

    // Flag if tables are suspiciously uniform (low variation)
    // This is a soft signal — many legitimate images can have low CV too
    const flagged = avgUniformity < 0.5;

    return { flagged, uniformity: Math.round(avgUniformity * 1000) / 1000 };
  } catch {
    return { flagged: false, uniformity: 0 };
  }
}

// --- Main Scoring Function ---

function scoreAIDetection(
  exif: ReturnType<typeof extractExifData>,
  fileBuffer: Buffer
): {
  isAiGenerated: boolean;
  confidence: number;
  detector: string;
  score: number;
  details: {
    exifScore: number;
    softwareCheck: { flagged: boolean; software: string | null };
    dimensionCheck: { flagged: boolean; width: number; height: number };
    entropyCheck: { flagged: boolean; entropy: number };
    quantizationCheck: { flagged: boolean; uniformity: number };
    promptInMetadata: boolean;
  };
} {
  // ---- 1. Original EXIF-based human score (backward-compatible weights) ----
  let exifScore = 0;
  if (exif) {
    if (exif.make && exif.model) exifScore += 0.3;
    if (exif.exposureTime && exif.fNumber && exif.iso) exifScore += 0.25;
    if (exif.gpsLatitude && exif.gpsLongitude) exifScore += 0.2;
    if (exif.dateTime) exifScore += 0.1;
    if (exif.focalLength) exifScore += 0.15;
  }
  exifScore = Math.min(exifScore, 1);

  // ---- 2. Software field check ----
  const softwareCheck = checkSoftwareField(exif);

  // ---- 3. Dimension check ----
  const dimensionCheck = checkDimensions(exif);

  // ---- 4. Prompt / AI keyword check in raw metadata ----
  const promptInMetadata = checkPromptInRawBytes(fileBuffer);

  // ---- 5. Entropy analysis ----
  const entropyCheck = calculateEntropy(fileBuffer);

  // ---- 6. JPEG quantization table analysis ----
  const quantizationCheck = checkJpegQuantizationTables(fileBuffer);

  // ---- Combine signals into final human score ----
  // Start with the EXIF-based score as the base (weight: 0.45)
  // Then apply penalties for AI-indicative signals
  // and minor bonuses for non-flagged checks

  // Weighted components:
  //   EXIF score:          45% of final (backward-compatible core)
  //   Software check:      15%
  //   Dimension check:     10%
  //   Prompt metadata:     15%
  //   Entropy:              5%
  //   Quantization:        10%

  const softwareScore = softwareCheck.flagged ? 0 : 1;
  const dimensionScore = dimensionCheck.flagged ? 0.2 : 1; // Soft penalty — many legit images are 1024x1024
  const promptScore = promptInMetadata ? 0 : 1;
  const entropyScore = entropyCheck.flagged ? 0.3 : 1;
  const quantizationScore = quantizationCheck.flagged ? 0.3 : 1;

  let humanScore =
    exifScore * 0.45 +
    softwareScore * 0.15 +
    dimensionScore * 0.10 +
    promptScore * 0.15 +
    entropyScore * 0.05 +
    quantizationScore * 0.10;

  // Hard override: if software is flagged or prompt found, cap the human score
  if (softwareCheck.flagged || promptInMetadata) {
    humanScore = Math.min(humanScore, 0.2);
  }

  humanScore = Math.max(0, Math.min(humanScore, 1));

  // Confidence: how far from the ambiguous midpoint (0.5)
  const confidence = Math.abs(humanScore - 0.5) * 2;

  return {
    isAiGenerated: humanScore < 0.3,
    confidence,
    detector: "heuristic-multi-v2",
    score: humanScore,
    details: {
      exifScore,
      softwareCheck,
      dimensionCheck,
      entropyCheck,
      quantizationCheck,
      promptInMetadata,
    },
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

  // Step 4: AI detection (multi-signal heuristic)
  const aiDetection = scoreAIDetection(exif, input.fileBuffer);

  // Step 5: Duplicate check (SHA-256 exact + pHash perceptual)
  const [uniqueness, perceptualDuplicates] = await Promise.all([
    checkDuplicateHash(hashes.sha256, supabaseAdmin),
    hashes.perceptualHash
      ? checkPerceptualDuplicates(hashes.perceptualHash, supabaseAdmin)
      : Promise.resolve([]),
  ]);
  const uniquenessScore = uniqueness.isDuplicate ? 0 : perceptualDuplicates.length > 0 ? 0.3 : 1;

  // Step 6: External AI detection (Hive, Optic, Illuminarty — parallel)
  const externalAIResults = await runExternalAIDetectors(
    input.fileBuffer,
    input.mimeType
  );

  // Step 7: Vericum Trust Layer (VTL) — our proprietary verification
  const vtl = computeVericumTrustLayer(
    {
      overallScore: 0, // Will be calculated after
      status: "manual_review",
      c2pa: c2paResult,
      metadata: metadataScore,
      aiDetection,
      uniqueness: {
        isDuplicate: uniqueness.isDuplicate,
        similarContentIds: uniqueness.similarContentIds,
        score: uniquenessScore,
        perceptuallySimilar: perceptualDuplicates,
      },
      provenance: [],
    },
    exif as Record<string, unknown> | null,
    externalAIResults,
    input.fileName, // contentId placeholder — real ID set by API route
    hashes.sha256
  );

  console.log(`[VTL] Trust score: ${vtl.trustScore.toFixed(3)}, tier: ${vtl.trustTier}, flags: ${vtl.flags.length}`);

  // Step 8: Calculate composite score (C2PA base + VTL layer)
  let overallScore =
    c2paResult.score * VERIFICATION_WEIGHTS.c2pa +
    metadataScore.score * VERIFICATION_WEIGHTS.metadata +
    aiDetection.score * VERIFICATION_WEIGHTS.aiDetection +
    uniquenessScore * VERIFICATION_WEIGHTS.uniqueness +
    vtl.trustScore * VERIFICATION_WEIGHTS.vtl;

  // C2PA validity bonus: a valid C2PA manifest is strong proof of provenance
  if (c2paResult.present && c2paResult.valid) {
    overallScore = Math.max(overallScore, VERIFICATION_THRESHOLDS.verified);
  }

  // VTL critical flag override: can downgrade verified content
  const hasCriticalFlag = vtl.flags.some((f) => f.type === "critical");
  if (hasCriticalFlag && overallScore >= VERIFICATION_THRESHOLDS.verified) {
    overallScore = Math.min(overallScore, VERIFICATION_THRESHOLDS.manual_review + 0.05);
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

  console.log(`[VVE] Verification complete: score=${overallScore.toFixed(3)}, status=${status}, c2pa=${c2paResult.present}, vtl=${vtl.trustTier}`);

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
      perceptuallySimilar: perceptualDuplicates,
    },
    provenance,
    vtl,
  };
}