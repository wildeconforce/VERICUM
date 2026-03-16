/**
 * Comprehensive C2PA Verification Engine, Commission & API Logic Tests
 * Tests all verification, scoring, commission, and provenance logic without external dependencies.
 * Run: node --experimental-vm-modules tests/c2pa-verification.test.mjs
 */

import { createHash } from "crypto";

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    console.log(`  ✗ FAIL: ${testName}`);
  }
}

function assertApprox(actual, expected, testName, epsilon = 0.0001) {
  const condition = Math.abs(actual - expected) < epsilon;
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    failures.push(`${testName} (expected ${expected}, got ${actual})`);
    console.log(`  ✗ FAIL: ${testName} (expected ${expected}, got ${actual})`);
  }
}

function section(name) {
  console.log(`\n━━━ ${name} ━━━`);
}

// ============================================================
// Recreate pure logic functions from source
// (Same pattern as security.test.mjs - no project imports)
// ============================================================

// --- From src/lib/c2pa/hash.ts ---
async function generateHashes(buffer) {
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  let perceptualHash = null;
  try {
    perceptualHash = createHash("md5")
      .update(buffer.subarray(0, Math.min(buffer.length, 1024)))
      .digest("hex");
  } catch {
    // perceptual hash generation failed, non-critical
  }
  return { sha256, perceptualHash };
}

function checkDuplicateHash(sha256, existingHashes) {
  const ids = existingHashes
    .filter((h) => h.content_hash === sha256)
    .map((h) => h.content_id);
  return {
    isDuplicate: ids.length > 0,
    similarContentIds: ids,
  };
}

// --- From src/lib/c2pa/extract.ts ---
function scoreMetadata(exif) {
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

// --- From src/lib/c2pa/verify.ts ---
function scoreAIDetection(exif) {
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
    score: Math.min(humanScore, 1),
  };
}

// --- Verification weights & thresholds (from src/types/verification.ts) ---
const VERIFICATION_WEIGHTS = {
  c2pa: 0.50,
  metadata: 0.15,
  aiDetection: 0.20,
  uniqueness: 0.15,
};

const VERIFICATION_THRESHOLDS = {
  verified: 0.7,
  manual_review: 0.4,
};

function calculateOverallScore(c2paScore, metadataScore, aiDetectionScore, uniquenessScore) {
  return (
    c2paScore * VERIFICATION_WEIGHTS.c2pa +
    metadataScore * VERIFICATION_WEIGHTS.metadata +
    aiDetectionScore * VERIFICATION_WEIGHTS.aiDetection +
    uniquenessScore * VERIFICATION_WEIGHTS.uniqueness
  );
}

function determineStatus(overallScore) {
  if (overallScore >= VERIFICATION_THRESHOLDS.verified) return "verified";
  if (overallScore >= VERIFICATION_THRESHOLDS.manual_review) return "manual_review";
  return "rejected";
}

// --- Provenance chain (from src/lib/c2pa/verify.ts) ---
function buildProvenance(exif, c2paManifest, c2paReadResult) {
  const events = [];

  if (exif?.dateTime) {
    events.push({
      action: "created",
      device: [exif.make, exif.model].filter(Boolean).join(" ") || undefined,
      timestamp: exif.dateTime,
      software: exif.software || undefined,
    });
  }

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

// --- Commission (from src/lib/payment/commission.ts + src/types/payment.ts) ---
const LICENSE_MULTIPLIERS = {
  personal: 1.0,
  standard: 2.0,
  extended: 5.0,
  exclusive: 10.0,
};

const BUYER_FEE_RATE = 0.15;
const DEFAULT_COMMISSION_RATE = 0.15;
const ROYALTY_PRICE_DISCOUNT = 0.6;

function calculateCommission(
  basePrice,
  licenseType,
  commissionRate = DEFAULT_COMMISSION_RATE,
  saleType = "premium",
  royaltyRate = 0
) {
  const licenseMultiplier = LICENSE_MULTIPLIERS[licenseType] || 1.0;
  let contentPrice = basePrice * licenseMultiplier;

  if (saleType === "royalty") {
    contentPrice = contentPrice * ROYALTY_PRICE_DISCOUNT;
  }

  const buyerFee = contentPrice * BUYER_FEE_RATE;
  const totalCharge = contentPrice + buyerFee;
  const commissionAmount = contentPrice * commissionRate + buyerFee;
  const sellerAmount = contentPrice * (1 - commissionRate);

  return {
    basePrice,
    licenseMultiplier,
    contentPrice: Math.round(contentPrice * 100) / 100,
    buyerFee: Math.round(buyerFee * 100) / 100,
    totalCharge: Math.round(totalCharge * 100) / 100,
    commissionAmount: Math.round(commissionAmount * 100) / 100,
    sellerAmount: Math.round(sellerAmount * 100) / 100,
    saleType,
    royaltyRate,
  };
}

// --- License key generation (from security.test.mjs) ---
function generateLicenseKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");
  const parts = hex.match(/.{1,8}/g);
  return `VRC-${parts.join("-")}`;
}

// ============================================================
// 1. Hash Generation
// ============================================================
section("1. Hash Generation (SHA-256 & Perceptual)");

const testBuffer1 = Buffer.from("Hello, VERICUM C2PA verification engine!");
const testBuffer2 = Buffer.from("Different content for testing");
const emptyBuffer = Buffer.alloc(0);

const hash1 = await generateHashes(testBuffer1);
const hash1Again = await generateHashes(testBuffer1);
const hash2 = await generateHashes(testBuffer2);
const hashEmpty = await generateHashes(emptyBuffer);

// SHA-256 consistency
assert(hash1.sha256 === hash1Again.sha256, "SHA-256 is deterministic for same input");
assert(typeof hash1.sha256 === "string", "SHA-256 returns a string");
assert(hash1.sha256.length === 64, `SHA-256 produces 64-char hex (got ${hash1.sha256.length})`);
assert(/^[a-f0-9]{64}$/.test(hash1.sha256), "SHA-256 is valid lowercase hex");

// Different inputs produce different hashes
assert(hash1.sha256 !== hash2.sha256, "Different inputs produce different SHA-256 hashes");

// Perceptual hash (MD5-based placeholder)
assert(hash1.perceptualHash !== null, "Perceptual hash is generated");
assert(hash1.perceptualHash.length === 32, `Perceptual hash is 32-char hex (got ${hash1.perceptualHash.length})`);
assert(/^[a-f0-9]{32}$/.test(hash1.perceptualHash), "Perceptual hash is valid MD5 hex");
assert(hash1.perceptualHash === hash1Again.perceptualHash, "Perceptual hash is deterministic");
assert(hash1.perceptualHash !== hash2.perceptualHash, "Different inputs produce different perceptual hashes");

// Empty buffer handling
assert(typeof hashEmpty.sha256 === "string", "Empty buffer produces SHA-256");
assert(hashEmpty.sha256.length === 64, "Empty buffer SHA-256 is 64 chars");
assert(hashEmpty.perceptualHash !== null, "Empty buffer produces perceptual hash");
assert(hashEmpty.perceptualHash.length === 32, "Empty buffer perceptual hash is 32 chars");

// Known SHA-256 for empty buffer
const knownEmptySha256 = createHash("sha256").update(Buffer.alloc(0)).digest("hex");
assert(hashEmpty.sha256 === knownEmptySha256, "Empty buffer SHA-256 matches known value");

// Verify SHA-256 independently
const manualSha256 = createHash("sha256").update(testBuffer1).digest("hex");
assert(hash1.sha256 === manualSha256, "SHA-256 matches manual computation");

// Perceptual hash uses only first 1024 bytes
const longBuffer = Buffer.alloc(2048, 0);
longBuffer[0] = 0x42;
const longHash = await generateHashes(longBuffer);
const longBufferModifiedLater = Buffer.alloc(2048, 0);
longBufferModifiedLater[0] = 0x42;
longBufferModifiedLater[1500] = 0xFF; // Change after 1024 boundary
const longHashModified = await generateHashes(longBufferModifiedLater);
assert(longHash.perceptualHash === longHashModified.perceptualHash, "Perceptual hash only considers first 1024 bytes");
assert(longHash.sha256 !== longHashModified.sha256, "SHA-256 considers all bytes (detects change after 1024)");


// ============================================================
// 2. EXIF Extraction & Scoring (scoreMetadata)
// ============================================================
section("2. EXIF Metadata Scoring (scoreMetadata)");

// Null exif → score 0
const nullResult = scoreMetadata(null);
assert(nullResult.score === 0, "Null exif → score 0");
assert(nullResult.hasExif === false, "Null exif → hasExif false");
assert(nullResult.hasGPS === false, "Null exif → hasGPS false");
assert(nullResult.hasDevice === false, "Null exif → hasDevice false");
assert(nullResult.captureDate === null, "Null exif → captureDate null");

// Base EXIF only (no meaningful fields) → score 0.2
const baseExif = { software: "Photoshop" };
const baseResult = scoreMetadata(baseExif);
assertApprox(baseResult.score, 0.2, "Base EXIF only → score 0.2");
assert(baseResult.hasExif === true, "Base EXIF → hasExif true");
assert(baseResult.hasGPS === false, "Base EXIF → hasGPS false");
assert(baseResult.hasDevice === false, "Base EXIF → hasDevice false");
assert(baseResult.captureDate === null, "Base EXIF → captureDate null");

// EXIF + GPS → score 0.45
const gpsExif = { gpsLatitude: 37.7749, gpsLongitude: -122.4194 };
const gpsResult = scoreMetadata(gpsExif);
assertApprox(gpsResult.score, 0.45, "EXIF + GPS → score 0.45");
assert(gpsResult.hasGPS === true, "GPS EXIF → hasGPS true");
assert(gpsResult.hasDevice === false, "GPS EXIF → hasDevice false");

// EXIF + GPS + Device → score 0.70
const deviceExif = {
  make: "Canon",
  model: "EOS R5",
  gpsLatitude: 37.7749,
  gpsLongitude: -122.4194,
};
const deviceResult = scoreMetadata(deviceExif);
assertApprox(deviceResult.score, 0.70, "EXIF + GPS + Device → score 0.70");
assert(deviceResult.hasGPS === true, "Device EXIF → hasGPS true");
assert(deviceResult.hasDevice === true, "Device EXIF → hasDevice true");
assert(deviceResult.captureDate === null, "Device EXIF → no captureDate");

// EXIF + GPS + Device + CaptureDate → score 0.85
const dateExif = {
  make: "Canon",
  model: "EOS R5",
  gpsLatitude: 37.7749,
  gpsLongitude: -122.4194,
  dateTime: "2024-06-15T10:30:00.000Z",
};
const dateResult = scoreMetadata(dateExif);
assertApprox(dateResult.score, 0.85, "EXIF + GPS + Device + CaptureDate → score 0.85");
assert(dateResult.captureDate instanceof Date, "CaptureDate is a Date object");
assert(dateResult.captureDate.toISOString() === "2024-06-15T10:30:00.000Z", "CaptureDate has correct value");

// Full EXIF (all fields) → score 1.0
const fullExif = {
  make: "Canon",
  model: "EOS R5",
  gpsLatitude: 37.7749,
  gpsLongitude: -122.4194,
  dateTime: "2024-06-15T10:30:00.000Z",
  exposureTime: 0.001,
  fNumber: 2.8,
  iso: 400,
};
const fullResult = scoreMetadata(fullExif);
assertApprox(fullResult.score, 1.0, "Full EXIF → score 1.0");
assert(fullResult.hasExif === true, "Full EXIF → hasExif true");
assert(fullResult.hasGPS === true, "Full EXIF → hasGPS true");
assert(fullResult.hasDevice === true, "Full EXIF → hasDevice true");
assert(fullResult.captureDate !== null, "Full EXIF → captureDate not null");

// Exposure only (no GPS, no device) → score 0.35
const exposureExif = { exposureTime: 0.001, fNumber: 2.8, iso: 400 };
const exposureResult = scoreMetadata(exposureExif);
assertApprox(exposureResult.score, 0.35, "EXIF + Exposure only → score 0.35");

// Score capped at 1.0 (Math.min)
const cappedExif = {
  make: "Canon", model: "EOS R5",
  gpsLatitude: 37.7749, gpsLongitude: -122.4194,
  dateTime: "2024-01-01T00:00:00Z",
  exposureTime: 0.001, fNumber: 2.8, iso: 400,
};
const cappedResult = scoreMetadata(cappedExif);
assert(cappedResult.score <= 1.0, "Score never exceeds 1.0");

// Partial GPS (only latitude, no longitude) → no GPS credit
const partialGps = { gpsLatitude: 37.7749 };
const partialGpsResult = scoreMetadata(partialGps);
assert(partialGpsResult.hasGPS === false, "Partial GPS (lat only) → hasGPS false");
assertApprox(partialGpsResult.score, 0.2, "Partial GPS → base score only");

// Partial device (only make, no model) → no device credit
const partialDevice = { make: "Canon" };
const partialDeviceResult = scoreMetadata(partialDevice);
assert(partialDeviceResult.hasDevice === false, "Partial device (make only) → hasDevice false");
assertApprox(partialDeviceResult.score, 0.2, "Partial device → base score only");


// ============================================================
// 3. AI Detection Scoring (scoreAIDetection)
// ============================================================
section("3. AI Detection Scoring (scoreAIDetection)");

// Null exif → humanScore 0, isAiGenerated true
const aiNull = scoreAIDetection(null);
assert(aiNull.score === 0, "Null exif → humanScore 0");
assert(aiNull.isAiGenerated === true, "Null exif → isAiGenerated true");
assertApprox(aiNull.confidence, 1.0, "Null exif → confidence 1.0 (|0 - 0.5| * 2)");
assert(aiNull.detector === "heuristic-exif-v1", "Detector is heuristic-exif-v1");

// Only make+model → humanScore 0.3, not AI (0.3 >= 0.3)
const aiMakeModel = scoreAIDetection({ make: "Canon", model: "EOS R5" });
assertApprox(aiMakeModel.score, 0.3, "Make+model → humanScore 0.3");
assert(aiMakeModel.isAiGenerated === false, "Make+model → NOT AI (0.3 >= 0.3)");
assertApprox(aiMakeModel.confidence, 0.4, "Make+model → confidence 0.4 (|0.3 - 0.5| * 2)");

// Full camera EXIF → humanScore 1.0
const aiFull = scoreAIDetection({
  make: "Canon",
  model: "EOS R5",
  exposureTime: 0.001,
  fNumber: 2.8,
  iso: 400,
  gpsLatitude: 37.7749,
  gpsLongitude: -122.4194,
  dateTime: "2024-06-15T10:30:00Z",
  focalLength: 50,
});
assertApprox(aiFull.score, 1.0, "Full camera EXIF → humanScore 1.0");
assert(aiFull.isAiGenerated === false, "Full camera EXIF → NOT AI");
assertApprox(aiFull.confidence, 1.0, "Full EXIF → confidence 1.0 (|1.0 - 0.5| * 2)");

// No device info but has GPS → humanScore 0.2
const aiGpsOnly = scoreAIDetection({ gpsLatitude: 37.0, gpsLongitude: -122.0 });
assertApprox(aiGpsOnly.score, 0.2, "GPS only → humanScore 0.2");
assert(aiGpsOnly.isAiGenerated === true, "GPS only → flagged as AI (0.2 < 0.3)");
assertApprox(aiGpsOnly.confidence, 0.6, "GPS only → confidence 0.6 (|0.2 - 0.5| * 2)");

// Exposure + focal length only → 0.25 + 0.15 = 0.4
const aiExposure = scoreAIDetection({
  exposureTime: 0.001, fNumber: 2.8, iso: 400, focalLength: 50,
});
assertApprox(aiExposure.score, 0.4, "Exposure + focal → humanScore 0.4");
assert(aiExposure.isAiGenerated === false, "Exposure + focal → NOT AI (0.4 >= 0.3)");

// dateTime alone → 0.1
const aiDateOnly = scoreAIDetection({ dateTime: "2024-01-01T00:00:00Z" });
assertApprox(aiDateOnly.score, 0.1, "DateTime only → humanScore 0.1");
assert(aiDateOnly.isAiGenerated === true, "DateTime only → flagged as AI (0.1 < 0.3)");

// focalLength alone → 0.15
const aiFocalOnly = scoreAIDetection({ focalLength: 85 });
assertApprox(aiFocalOnly.score, 0.15, "FocalLength only → humanScore 0.15");
assert(aiFocalOnly.isAiGenerated === true, "FocalLength only → flagged as AI (0.15 < 0.3)");

// Make+model+dateTime → 0.3+0.1 = 0.4
const aiMakeDate = scoreAIDetection({ make: "Sony", model: "A7III", dateTime: "2024-01-01T00:00:00Z" });
assertApprox(aiMakeDate.score, 0.4, "Make+model+dateTime → humanScore 0.4");
assert(aiMakeDate.isAiGenerated === false, "Make+model+dateTime → NOT AI");

// Confidence calculation spot checks
assert(Math.abs(scoreAIDetection(null).confidence - 1.0) < 0.001, "Confidence: score 0 → 1.0");
const halfConf = scoreAIDetection({ make: "Canon", model: "R5", gpsLatitude: 1, gpsLongitude: 1 });
assertApprox(halfConf.score, 0.5, "Score 0.5 case");
assertApprox(halfConf.confidence, 0.0, "Confidence: score 0.5 → 0.0 (least confident)");


// ============================================================
// 4. Composite Score Calculation
// ============================================================
section("4. Composite Score Calculation");

// Verify weights sum to 1.0
const weightSum = VERIFICATION_WEIGHTS.c2pa + VERIFICATION_WEIGHTS.metadata +
  VERIFICATION_WEIGHTS.aiDetection + VERIFICATION_WEIGHTS.uniqueness;
assertApprox(weightSum, 1.0, "Weights sum to 1.0");

// Verify weight values
assert(VERIFICATION_WEIGHTS.c2pa === 0.50, "C2PA weight = 0.50");
assert(VERIFICATION_WEIGHTS.metadata === 0.15, "Metadata weight = 0.15");
assert(VERIFICATION_WEIGHTS.aiDetection === 0.20, "AI Detection weight = 0.20");
assert(VERIFICATION_WEIGHTS.uniqueness === 0.15, "Uniqueness weight = 0.15");

// All zeros → score 0, status "rejected"
const allZero = calculateOverallScore(0, 0, 0, 0);
assert(allZero === 0, "All zeros → score 0");
assert(determineStatus(allZero) === "rejected", "Score 0 → rejected");

// All ones → score 1.0, status "verified"
const allOne = calculateOverallScore(1, 1, 1, 1);
assertApprox(allOne, 1.0, "All ones → score 1.0");
assert(determineStatus(allOne) === "verified", "Score 1.0 → verified");

// Only C2PA = 1.0 → 0.5*1 + 0.15*0 + 0.2*0 + 0.15*0 = 0.5
const c2paOnly = calculateOverallScore(1, 0, 0, 0);
assertApprox(c2paOnly, 0.5, "C2PA=1 only → 0.50");
assert(determineStatus(c2paOnly) === "manual_review", "Score 0.5 → manual_review");

// Only metadata = 1.0 → 0.15
const metaOnly = calculateOverallScore(0, 1, 0, 0);
assertApprox(metaOnly, 0.15, "Metadata=1 only → 0.15");
assert(determineStatus(metaOnly) === "rejected", "Score 0.15 → rejected");

// Only AI detection = 1.0 → 0.20
const aiOnly = calculateOverallScore(0, 0, 1, 0);
assertApprox(aiOnly, 0.20, "AI=1 only → 0.20");

// Only uniqueness = 1.0 → 0.15
const uniqOnly = calculateOverallScore(0, 0, 0, 1);
assertApprox(uniqOnly, 0.15, "Uniqueness=1 only → 0.15");

// C2PA valid bonus: overallScore = max(calculated, 0.7)
const lowScore = calculateOverallScore(0.3, 0.2, 0.1, 0.5);
const withBonus = Math.max(lowScore, VERIFICATION_THRESHOLDS.verified);
assertApprox(withBonus, 0.7, "C2PA valid bonus lifts score to at least 0.7");
assert(determineStatus(withBonus) === "verified", "With C2PA bonus → verified");

// Threshold boundary tests
assert(determineStatus(0.7) === "verified", "Exactly 0.7 → verified");
assert(determineStatus(0.71) === "verified", "0.71 → verified");
assert(determineStatus(0.69) === "manual_review", "0.69 → manual_review");
assert(determineStatus(0.4) === "manual_review", "Exactly 0.4 → manual_review");
assert(determineStatus(0.41) === "manual_review", "0.41 → manual_review");
assert(determineStatus(0.39999) === "rejected", "0.39999 → rejected");
assert(determineStatus(0.399) === "rejected", "0.399 → rejected");
assert(determineStatus(0.0) === "rejected", "0.0 → rejected");
assert(determineStatus(1.0) === "verified", "1.0 → verified");
assert(determineStatus(0.5) === "manual_review", "0.5 → manual_review");

// Mixed realistic scenario: good metadata, no C2PA, unique
const realistic = calculateOverallScore(0, 0.85, 0.7, 1);
// 0*0.5 + 0.85*0.15 + 0.7*0.2 + 1*0.15 = 0 + 0.1275 + 0.14 + 0.15 = 0.4175
assertApprox(realistic, 0.4175, "Realistic no-C2PA scenario → ~0.4175");
assert(determineStatus(realistic) === "manual_review", "Realistic no-C2PA → manual_review");

// Good C2PA (0.5) + good metadata + good AI + unique
const goodAll = calculateOverallScore(0.5, 0.85, 0.7, 1);
// 0.5*0.5 + 0.85*0.15 + 0.7*0.2 + 1*0.15 = 0.25 + 0.1275 + 0.14 + 0.15 = 0.6675
assertApprox(goodAll, 0.6675, "Good-all scenario → ~0.6675");
assert(determineStatus(goodAll) === "manual_review", "Good-all without valid C2PA → manual_review");


// ============================================================
// 5. Commission Calculation
// ============================================================
section("5. Commission Calculation");

// License multipliers
assert(LICENSE_MULTIPLIERS.personal === 1.0, "Personal multiplier = 1.0");
assert(LICENSE_MULTIPLIERS.standard === 2.0, "Standard multiplier = 2.0");
assert(LICENSE_MULTIPLIERS.extended === 5.0, "Extended multiplier = 5.0");
assert(LICENSE_MULTIPLIERS.exclusive === 10.0, "Exclusive multiplier = 10.0");

// Fee rates
assert(BUYER_FEE_RATE === 0.15, "Buyer fee rate = 15%");
assert(DEFAULT_COMMISSION_RATE === 0.15, "Default commission rate = 15%");
assert(ROYALTY_PRICE_DISCOUNT === 0.6, "Royalty price discount = 0.6x");

// Base $100 personal license
const personal100 = calculateCommission(100, "personal");
assert(personal100.licenseMultiplier === 1.0, "$100 personal: multiplier 1.0");
assert(personal100.contentPrice === 100, "$100 personal: contentPrice $100");
assert(personal100.buyerFee === 15, "$100 personal: buyerFee $15");
assert(personal100.totalCharge === 115, "$100 personal: totalCharge $115");
assert(personal100.commissionAmount === 30, "$100 personal: commission $30 (15% of 100 + 15 fee)");
assert(personal100.sellerAmount === 85, "$100 personal: seller $85");
assert(personal100.saleType === "premium", "$100 personal: saleType premium");

// Base $100 standard license
const standard100 = calculateCommission(100, "standard");
assert(standard100.licenseMultiplier === 2.0, "$100 standard: multiplier 2.0");
assert(standard100.contentPrice === 200, "$100 standard: contentPrice $200");
assert(standard100.buyerFee === 30, "$100 standard: buyerFee $30");
assert(standard100.totalCharge === 230, "$100 standard: totalCharge $230");
assert(standard100.sellerAmount === 170, "$100 standard: seller $170");
assert(standard100.commissionAmount === 60, "$100 standard: commission $60");

// Base $100 extended license
const extended100 = calculateCommission(100, "extended");
assert(extended100.contentPrice === 500, "$100 extended: contentPrice $500");
assert(extended100.buyerFee === 75, "$100 extended: buyerFee $75");
assert(extended100.totalCharge === 575, "$100 extended: totalCharge $575");
assert(extended100.sellerAmount === 425, "$100 extended: seller $425");

// Base $100 exclusive license
const exclusive100 = calculateCommission(100, "exclusive");
assert(exclusive100.contentPrice === 1000, "$100 exclusive: contentPrice $1000");
assert(exclusive100.buyerFee === 150, "$100 exclusive: buyerFee $150");
assert(exclusive100.totalCharge === 1150, "$100 exclusive: totalCharge $1150");
assert(exclusive100.sellerAmount === 850, "$100 exclusive: seller $850");

// Royalty sale discount (0.6x)
const royalty100 = calculateCommission(100, "personal", DEFAULT_COMMISSION_RATE, "royalty", 0.05);
assert(royalty100.contentPrice === 60, "Royalty $100 personal: contentPrice $60 (100*0.6)");
assert(royalty100.buyerFee === 9, "Royalty $100 personal: buyerFee $9");
assert(royalty100.totalCharge === 69, "Royalty $100 personal: totalCharge $69");
assert(royalty100.sellerAmount === 51, "Royalty $100 personal: seller $51");
assert(royalty100.saleType === "royalty", "Royalty sale type");
assert(royalty100.royaltyRate === 0.05, "Royalty rate stored");

// Rounding to 2 decimals (test with $9.99 base)
const oddPrice = calculateCommission(9.99, "personal");
// contentPrice = 9.99, buyerFee = 9.99*0.15 = 1.4985 → 1.50
assert(oddPrice.contentPrice === 9.99, "$9.99 personal: contentPrice $9.99");
assert(oddPrice.buyerFee === 1.50, "$9.99 personal: buyerFee $1.50 (rounded)");
// totalCharge = 9.99 + 1.4985 = 11.4885 → 11.49
assert(oddPrice.totalCharge === 11.49, "$9.99 personal: totalCharge $11.49");
// commissionAmount = 9.99*0.15 + 1.4985 = 1.4985 + 1.4985 = 2.997 → 3.00
assert(oddPrice.commissionAmount === 3.00, "$9.99 personal: commission $3.00 (rounded)");
// sellerAmount = 9.99 * 0.85 = 8.4915 → 8.49
assert(oddPrice.sellerAmount === 8.49, "$9.99 personal: seller $8.49 (rounded)");

// Zero price edge case
const zero = calculateCommission(0, "personal");
assert(zero.contentPrice === 0, "Zero price: contentPrice 0");
assert(zero.buyerFee === 0, "Zero price: buyerFee 0");
assert(zero.totalCharge === 0, "Zero price: totalCharge 0");
assert(zero.sellerAmount === 0, "Zero price: seller 0");
assert(zero.commissionAmount === 0, "Zero price: commission 0");

// Maximum price ($50,000)
const max = calculateCommission(50000, "personal");
assert(max.contentPrice === 50000, "Max price: contentPrice $50,000");
assert(max.buyerFee === 7500, "Max price: buyerFee $7,500");
assert(max.totalCharge === 57500, "Max price: totalCharge $57,500");
assert(max.sellerAmount === 42500, "Max price: seller $42,500");

// Maximum price exclusive license ($50,000 * 10 = $500,000)
const maxExclusive = calculateCommission(50000, "exclusive");
assert(maxExclusive.contentPrice === 500000, "Max exclusive: contentPrice $500,000");

// Royalty + standard license
const royaltyStandard = calculateCommission(100, "standard", DEFAULT_COMMISSION_RATE, "royalty");
// contentPrice = 100*2*0.6 = 120
assert(royaltyStandard.contentPrice === 120, "Royalty standard: contentPrice $120");
assert(royaltyStandard.buyerFee === 18, "Royalty standard: buyerFee $18");

// Invalid license type defaults to multiplier 1.0
const invalidLicense = calculateCommission(100, "invalid_type");
assert(invalidLicense.licenseMultiplier === 1.0, "Invalid license → default multiplier 1.0");
assert(invalidLicense.contentPrice === 100, "Invalid license → contentPrice $100");


// ============================================================
// 6. Provenance Chain Building
// ============================================================
section("6. Provenance Chain Building");

// No EXIF, no C2PA → only "uploaded" event
const provNoExif = buildProvenance(null, null, null);
assert(provNoExif.length === 1, "No EXIF, no C2PA → 1 event");
assert(provNoExif[0].action === "uploaded", "Only event is 'uploaded'");
assert(provNoExif[0].platform === "Vericum", "Upload platform is Vericum");

// With EXIF dateTime → "created" + "uploaded"
const provWithExif = buildProvenance(
  { dateTime: "2024-06-15T10:30:00.000Z", make: "Canon", model: "EOS R5", software: "Lightroom" },
  null, null
);
assert(provWithExif.length === 2, "With EXIF → 2 events");
assert(provWithExif[0].action === "created", "First event is 'created'");
assert(provWithExif[0].device === "Canon EOS R5", "Device is 'Canon EOS R5'");
assert(provWithExif[0].timestamp === "2024-06-15T10:30:00.000Z", "Created timestamp matches EXIF");
assert(provWithExif[0].software === "Lightroom", "Software from EXIF");
assert(provWithExif[1].action === "uploaded", "Second event is 'uploaded'");

// With EXIF (no make/model) → device undefined
const provNoDevice = buildProvenance(
  { dateTime: "2024-01-01T00:00:00Z" },
  null, null
);
assert(provNoDevice.length === 2, "EXIF no device → 2 events");
assert(provNoDevice[0].device === undefined, "No device info → device undefined");

// With C2PA read result (active_manifest) → "created" + "signed" + "uploaded"
const provWithC2PA = buildProvenance(
  { dateTime: "2024-06-15T10:30:00.000Z", make: "Canon", model: "R5" },
  null,
  {
    active_manifest: {
      claim_generator: "Adobe Photoshop 25.0",
      signature_info: { time: "2024-06-15T11:00:00.000Z" },
      assertions: [],
    },
  }
);
assert(provWithC2PA.length === 3, "With C2PA manifest → 3 events");
assert(provWithC2PA[0].action === "created", "First is 'created'");
assert(provWithC2PA[1].action === "signed", "Second is 'signed'");
assert(provWithC2PA[1].software === "Adobe Photoshop 25.0", "Signed by Adobe Photoshop");
assert(provWithC2PA[1].platform === "C2PA Verified", "Signed platform is C2PA Verified");
assert(provWithC2PA[1].timestamp === "2024-06-15T11:00:00.000Z", "Signed timestamp from signature_info");
assert(provWithC2PA[2].action === "uploaded", "Third is 'uploaded'");

// With C2PA actions → includes "edited" events
const provWithActions = buildProvenance(
  { dateTime: "2024-01-01T00:00:00Z" },
  null,
  {
    active_manifest: {
      claim_generator: "Adobe Lightroom",
      signature_info: { time: "2024-01-01T01:00:00Z" },
      assertions: [
        {
          label: "c2pa.action.v2",
          data: {
            actions: [
              { action: "edited", softwareAgent: "Lightroom", when: "2024-01-01T00:30:00Z" },
              { action: "cropped", softwareAgent: "Lightroom", when: "2024-01-01T00:45:00Z" },
            ],
          },
        },
      ],
    },
  }
);
assert(provWithActions.length === 5, "With C2PA actions → 5 events (created + signed + 2 edited + uploaded)");
assert(provWithActions[0].action === "created", "Event 0: created");
assert(provWithActions[1].action === "signed", "Event 1: signed");
assert(provWithActions[2].action === "edited", "Event 2: edited");
assert(provWithActions[2].software === "Lightroom", "Event 2: software from action");
assert(provWithActions[2].timestamp === "2024-01-01T00:30:00Z", "Event 2: timestamp from action.when");
assert(provWithActions[3].action === "cropped", "Event 3: cropped");
assert(provWithActions[4].action === "uploaded", "Event 4: uploaded");

// Verify timestamp format (ISO 8601)
const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
for (const event of provWithActions) {
  assert(isoRegex.test(event.timestamp), `Event '${event.action}' timestamp is ISO 8601: ${event.timestamp}`);
}

// Fallback: c2paManifest (not c2paReadResult) with assertions
const provFallback = buildProvenance(
  null,
  {
    claim_generator: "Camera App",
    signature_info: { time: "2024-03-01T12:00:00Z" },
    assertions: [{ label: "c2pa.action.v1", data: {} }],
  },
  null
);
assert(provFallback.length === 2, "Fallback manifest → 2 events (edited + uploaded)");
assert(provFallback[0].action === "edited", "Fallback: first is 'edited'");
assert(provFallback[0].software === "Camera App", "Fallback: software from manifest");
assert(provFallback[1].action === "uploaded", "Fallback: second is 'uploaded'");

// No claim_generator in active_manifest → no signed event
const provNoGenerator = buildProvenance(
  null,
  null,
  {
    active_manifest: {
      assertions: [],
    },
  }
);
assert(provNoGenerator.length === 1, "No claim_generator → only uploaded event");
assert(provNoGenerator[0].action === "uploaded", "Only uploaded without claim_generator");


// ============================================================
// 7. Duplicate Detection Logic
// ============================================================
section("7. Duplicate Detection Logic");

const testHash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
const emptyDb = [];
const dbWithMatch = [
  { content_hash: testHash, content_id: "content-001" },
  { content_hash: "aaaa0000bbbb1111cccc2222dddd3333eeee4444ffff5555aaaa6666bbbb7777", content_id: "content-002" },
];
const dbWithMultipleMatches = [
  { content_hash: testHash, content_id: "content-001" },
  { content_hash: testHash, content_id: "content-003" },
];

// No existing hashes → not duplicate
const dupEmpty = checkDuplicateHash(testHash, emptyDb);
assert(dupEmpty.isDuplicate === false, "No existing hashes → isDuplicate false");
assert(dupEmpty.similarContentIds.length === 0, "No existing hashes → empty similarContentIds");

// Matching hash → duplicate
const dupMatch = checkDuplicateHash(testHash, dbWithMatch);
assert(dupMatch.isDuplicate === true, "Matching hash → isDuplicate true");
assert(dupMatch.similarContentIds.length === 1, "One match → 1 contentId");
assert(dupMatch.similarContentIds[0] === "content-001", "Returns correct contentId");

// No matching hash → not duplicate
const dupNoMatch = checkDuplicateHash("0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff", dbWithMatch);
assert(dupNoMatch.isDuplicate === false, "Non-matching hash → isDuplicate false");

// Multiple matches
const dupMulti = checkDuplicateHash(testHash, dbWithMultipleMatches);
assert(dupMulti.isDuplicate === true, "Multiple matches → isDuplicate true");
assert(dupMulti.similarContentIds.length === 2, "Multiple matches → 2 contentIds");
assert(dupMulti.similarContentIds.includes("content-001"), "Includes content-001");
assert(dupMulti.similarContentIds.includes("content-003"), "Includes content-003");


// ============================================================
// 8. Verification Status Assignment
// ============================================================
section("8. Verification Status Assignment");

assert(determineStatus(0.0) === "rejected", "Score 0.0 → rejected");
assert(determineStatus(0.1) === "rejected", "Score 0.1 → rejected");
assert(determineStatus(0.2) === "rejected", "Score 0.2 → rejected");
assert(determineStatus(0.3) === "rejected", "Score 0.3 → rejected");
assert(determineStatus(0.39) === "rejected", "Score 0.39 → rejected");
assert(determineStatus(0.399) === "rejected", "Score 0.399 → rejected");
assert(determineStatus(0.3999) === "rejected", "Score 0.3999 → rejected");
assert(determineStatus(0.4) === "manual_review", "Score 0.4 → manual_review");
assert(determineStatus(0.5) === "manual_review", "Score 0.5 → manual_review");
assert(determineStatus(0.6) === "manual_review", "Score 0.6 → manual_review");
assert(determineStatus(0.69) === "manual_review", "Score 0.69 → manual_review");
assert(determineStatus(0.699) === "manual_review", "Score 0.699 → manual_review");
assert(determineStatus(0.6999) === "manual_review", "Score 0.6999 → manual_review");
assert(determineStatus(0.7) === "verified", "Score 0.7 → verified");
assert(determineStatus(0.8) === "verified", "Score 0.8 → verified");
assert(determineStatus(0.9) === "verified", "Score 0.9 → verified");
assert(determineStatus(1.0) === "verified", "Score 1.0 → verified");

// Exhaustive boundary sweep around 0.4
for (let i = 35; i < 45; i++) {
  const score = i / 100;
  const expected = score >= 0.7 ? "verified" : score >= 0.4 ? "manual_review" : "rejected";
  assert(determineStatus(score) === expected, `Score ${score.toFixed(2)} → ${expected}`);
}

// Exhaustive boundary sweep around 0.7
for (let i = 65; i < 75; i++) {
  const score = i / 100;
  const expected = score >= 0.7 ? "verified" : "manual_review";
  assert(determineStatus(score) === expected, `Score ${score.toFixed(2)} → ${expected}`);
}


// ============================================================
// 9. License Key Generation
// ============================================================
section("9. License Key Generation");

const licKey1 = generateLicenseKey();
const licKey2 = generateLicenseKey();

assert(licKey1.startsWith("VRC-"), "License key starts with VRC-");
assert(licKey1.length === 39, `License key length is exactly 39 (got ${licKey1.length})`);
assert(/^VRC-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/.test(licKey1), "License key format: VRC-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX");
assert(licKey1 !== licKey2, "Two generated keys are different");

// Only valid characters (VRC-, hex uppercase, dashes)
assert(/^[VRC0-9A-F-]+$/.test(licKey1), "Only contains VRC, hex chars, and dashes");

// 5 parts separated by dashes
const parts = licKey1.split("-");
assert(parts.length === 5, "Key has 5 dash-separated parts");
assert(parts[0] === "VRC", "First part is VRC");
for (let i = 1; i < 5; i++) {
  assert(parts[i].length === 8, `Part ${i} is 8 chars`);
  assert(/^[A-F0-9]{8}$/.test(parts[i]), `Part ${i} is valid hex`);
}

// All unique across 1000 generations
const keySet1000 = new Set();
for (let i = 0; i < 1000; i++) {
  keySet1000.add(generateLicenseKey());
}
assert(keySet1000.size === 1000, "1000 generated keys are ALL unique");

// Verify format across batch
let allValid = true;
for (const key of keySet1000) {
  if (!/^VRC-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/.test(key)) {
    allValid = false;
    break;
  }
}
assert(allValid, "All 1000 keys match expected format");


// ============================================================
// 10. Edge Cases
// ============================================================
section("10. Edge Cases");

// Very large buffer (1MB zeros) hash generation
const largeBuf = Buffer.alloc(1024 * 1024, 0);
const largeHash = await generateHashes(largeBuf);
assert(largeHash.sha256.length === 64, "1MB buffer → valid 64-char SHA-256");
assert(/^[a-f0-9]{64}$/.test(largeHash.sha256), "1MB buffer → valid hex SHA-256");
assert(largeHash.perceptualHash.length === 32, "1MB buffer → valid 32-char perceptual hash");
// Perceptual hash should only use first 1024 bytes
const smallBuf = Buffer.alloc(1024, 0);
const smallHash = await generateHashes(smallBuf);
assert(largeHash.perceptualHash === smallHash.perceptualHash, "1MB and 1KB all-zero → same perceptual hash (first 1024 bytes)");
assert(largeHash.sha256 !== smallHash.sha256, "1MB and 1KB → different SHA-256");

// Negative price handling
const negativeComm = calculateCommission(-100, "personal");
assert(negativeComm.contentPrice === -100, "Negative price: contentPrice -100 (no validation in commission calc)");
assert(negativeComm.buyerFee === -15, "Negative price: buyerFee -15");
assert(negativeComm.totalCharge === -115, "Negative price: totalCharge -115");

// Invalid license type defaults to multiplier 1.0
const unknownLicense = calculateCommission(50, "super_premium");
assert(unknownLicense.licenseMultiplier === 1.0, "Unknown license type → multiplier 1.0");
assert(unknownLicense.contentPrice === 50, "Unknown license → contentPrice = basePrice");

const emptyLicense = calculateCommission(50, "");
assert(emptyLicense.licenseMultiplier === 1.0, "Empty string license → multiplier 1.0");

const nullishLicense = calculateCommission(50, undefined);
assert(nullishLicense.licenseMultiplier === 1.0, "Undefined license → multiplier 1.0");

// C2PA score values used in composite calculation
const c2paScores = [0, 0.3, 0.5, 1.0];
for (const c2paScore of c2paScores) {
  const score = calculateOverallScore(c2paScore, 0.5, 0.5, 1.0);
  const expected = c2paScore * 0.5 + 0.5 * 0.15 + 0.5 * 0.2 + 1.0 * 0.15;
  assertApprox(score, expected, `C2PA=${c2paScore} composite score = ${expected.toFixed(4)}`);
}

// Very small amounts and rounding
const tinyPrice = calculateCommission(0.01, "personal");
assert(tinyPrice.contentPrice === 0.01, "Tiny price: contentPrice $0.01");
assert(tinyPrice.buyerFee === 0, "Tiny price: buyerFee rounds to $0.00");
assert(tinyPrice.totalCharge === 0.01, "Tiny price: totalCharge $0.01");

// Royalty + extended = big discount
const royaltyExtended = calculateCommission(100, "extended", DEFAULT_COMMISSION_RATE, "royalty");
// 100 * 5.0 * 0.6 = 300
assert(royaltyExtended.contentPrice === 300, "Royalty extended: 100*5*0.6 = $300");

// scoreMetadata with empty object (has EXIF but no fields)
const emptyExifResult = scoreMetadata({});
assertApprox(emptyExifResult.score, 0.2, "Empty EXIF object → base score 0.2");
assert(emptyExifResult.hasExif === true, "Empty EXIF object → hasExif true");
assert(emptyExifResult.hasGPS === false, "Empty EXIF object → hasGPS false");
assert(emptyExifResult.hasDevice === false, "Empty EXIF object → hasDevice false");

// scoreAIDetection with empty object
const aiEmptyExif = scoreAIDetection({});
assert(aiEmptyExif.score === 0, "Empty EXIF object → AI humanScore 0");
assert(aiEmptyExif.isAiGenerated === true, "Empty EXIF object → flagged as AI");

// Provenance with only make (no model)
const provMakeOnly = buildProvenance(
  { dateTime: "2024-01-01T00:00:00Z", make: "Canon" },
  null, null
);
assert(provMakeOnly[0].device === "Canon", "Make only → device is just 'Canon'");

// Provenance with only model (no make)
const provModelOnly = buildProvenance(
  { dateTime: "2024-01-01T00:00:00Z", model: "EOS R5" },
  null, null
);
assert(provModelOnly[0].device === "EOS R5", "Model only → device is just 'EOS R5'");

// Provenance with no make, no model → device undefined
const provNoMakeModel = buildProvenance(
  { dateTime: "2024-01-01T00:00:00Z" },
  null, null
);
assert(provNoMakeModel[0].device === undefined, "No make/model → device undefined");

// Hash consistency across multiple calls
const consistencyBuf = Buffer.from("consistency test");
const hashes = [];
for (let i = 0; i < 10; i++) {
  const h = await generateHashes(consistencyBuf);
  hashes.push(h.sha256);
}
const allSame = hashes.every((h) => h === hashes[0]);
assert(allSame, "SHA-256 is consistent across 10 calls");

// Commission with custom commission rate
const customRate = calculateCommission(100, "personal", 0.20);
// commissionAmount = 100 * 0.20 + 15 = 35
assert(customRate.commissionAmount === 35, "Custom 20% rate: commission $35");
// sellerAmount = 100 * 0.80 = 80
assert(customRate.sellerAmount === 80, "Custom 20% rate: seller $80");

// Commission with 0% commission
const zeroRate = calculateCommission(100, "personal", 0);
assert(zeroRate.commissionAmount === 15, "0% commission rate: commission = buyerFee only ($15)");
assert(zeroRate.sellerAmount === 100, "0% commission rate: seller gets full contentPrice");

// Metadata score components are additive
// base(0.2) + GPS(0.25) + Device(0.25) + Date(0.15) + Exposure(0.15) = 1.0
const additive = 0.2 + 0.25 + 0.25 + 0.15 + 0.15;
assertApprox(additive, 1.0, "Metadata score components sum to exactly 1.0");

// AI detection score components: make+model(0.3) + exposure(0.25) + GPS(0.2) + date(0.1) + focal(0.15) = 1.0
const aiAdditive = 0.3 + 0.25 + 0.2 + 0.1 + 0.15;
assertApprox(aiAdditive, 1.0, "AI detection score components sum to exactly 1.0");

// Multiple buffers with single byte difference
const buf1 = Buffer.from([0x00, 0x01, 0x02, 0x03]);
const buf2 = Buffer.from([0x00, 0x01, 0x02, 0x04]);
const h1 = await generateHashes(buf1);
const h2 = await generateHashes(buf2);
assert(h1.sha256 !== h2.sha256, "Single byte difference → different SHA-256");

// Provenance: action defaults to 'edited' when action field missing in C2PA actions
const provDefaultAction = buildProvenance(
  null,
  null,
  {
    active_manifest: {
      claim_generator: "TestApp",
      signature_info: { time: "2024-01-01T00:00:00Z" },
      assertions: [
        {
          label: "c2pa.action.v2",
          data: { actions: [{ softwareAgent: "TestApp" }] },
        },
      ],
    },
  }
);
// signed + default-action-edited + uploaded = 3
assert(provDefaultAction.length === 3, "Default action → 3 events");
assert(provDefaultAction[1].action === "edited", "Missing action field defaults to 'edited'");

// Verify all 4 license types produce correct multiplied prices
const licenseTypes = ["personal", "standard", "extended", "exclusive"];
const expectedMultipliers = [1.0, 2.0, 5.0, 10.0];
for (let i = 0; i < licenseTypes.length; i++) {
  const result = calculateCommission(100, licenseTypes[i]);
  assert(result.contentPrice === 100 * expectedMultipliers[i],
    `${licenseTypes[i]} license: $100 base → $${100 * expectedMultipliers[i]} content price`);
}


// ============================================================
// RESULTS
// ============================================================
console.log("\n" + "═".repeat(50));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("═".repeat(50));

if (failures.length > 0) {
  console.log("\nFAILED TESTS:");
  failures.forEach((f) => console.log(`  ✗ ${f}`));
}

console.log(`\nTotal assertions: ${passed + failed}`);
process.exit(failed > 0 ? 1 : 0);
