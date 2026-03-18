/**
 * External AI Detection API integrations.
 *
 * Supports:
 * - Hive Moderation (AI-generated content detection)
 * - Optic (AI image forensics)
 * - Illuminarty (AI art detection)
 *
 * All integrations are optional — gracefully falls back to local
 * heuristic detection when API keys are not configured.
 *
 * Environment variables:
 * - HIVE_API_KEY: Hive Moderation API key
 * - OPTIC_API_KEY: Optic API key
 * - ILLUMINARTY_API_KEY: Illuminarty API key
 */

export interface ExternalAIResult {
  name: string;
  /** Human confidence: 0.0 (AI) → 1.0 (human) */
  score: number;
  /** Whether this detector was available and returned a result */
  available: boolean;
  /** Raw response data for audit trail */
  rawResponse?: Record<string, unknown>;
  /** Error message if the detector failed */
  error?: string;
}

// ─── Hive Moderation ─────────────────────────────────────────────────────────

async function detectWithHive(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ExternalAIResult> {
  const apiKey = process.env.HIVE_API_KEY;
  if (!apiKey) {
    return { name: "hive", score: 0, available: false, error: "API key not configured" };
  }

  try {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append("media", blob, "image.jpg");

    const response = await fetch("https://api.thehive.ai/api/v2/task/sync", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Hive API returned ${response.status}`);
    }

    const data = await response.json();

    // Hive returns classes with scores for "ai_generated"
    // Extract the AI-generated probability
    const output = data?.status?.[0]?.response?.output;
    if (!output) {
      return { name: "hive", score: 0.5, available: true, rawResponse: data };
    }

    // Find the ai_generated class
    let aiScore = 0;
    for (const cls of output) {
      if (cls.classes) {
        for (const c of cls.classes) {
          if (c.class === "ai_generated") {
            aiScore = c.score || 0;
          }
        }
      }
    }

    // Invert: our convention is 1.0 = human, 0.0 = AI
    const humanScore = 1 - aiScore;

    return {
      name: "hive",
      score: humanScore,
      available: true,
      rawResponse: data,
    };
  } catch (err) {
    return {
      name: "hive",
      score: 0,
      available: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Optic AI ────────────────────────────────────────────────────────────────

async function detectWithOptic(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ExternalAIResult> {
  const apiKey = process.env.OPTIC_API_KEY;
  if (!apiKey) {
    return { name: "optic", score: 0, available: false, error: "API key not configured" };
  }

  try {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append("file", blob, "image.jpg");

    const response = await fetch("https://api.optic.xyz/v1/detect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Optic API returned ${response.status}`);
    }

    const data = await response.json();

    // Optic returns a "human" probability directly
    const humanScore = data?.human_probability ?? data?.score ?? 0.5;

    return {
      name: "optic",
      score: humanScore,
      available: true,
      rawResponse: data,
    };
  } catch (err) {
    return {
      name: "optic",
      score: 0,
      available: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Illuminarty ─────────────────────────────────────────────────────────────

async function detectWithIlluminarty(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ExternalAIResult> {
  const apiKey = process.env.ILLUMINARTY_API_KEY;
  if (!apiKey) {
    return { name: "illuminarty", score: 0, available: false, error: "API key not configured" };
  }

  try {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append("image", blob, "image.jpg");

    const response = await fetch("https://api.illuminarty.ai/v1/analyze", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: formData,
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      throw new Error(`Illuminarty API returned ${response.status}`);
    }

    const data = await response.json();

    // Illuminarty returns ai_probability (0 = human, 1 = AI)
    const aiProb = data?.ai_probability ?? data?.ai_score ?? 0.5;
    const humanScore = 1 - aiProb;

    return {
      name: "illuminarty",
      score: humanScore,
      available: true,
      rawResponse: data,
    };
  } catch (err) {
    return {
      name: "illuminarty",
      score: 0,
      available: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

/**
 * Run all configured external AI detectors in parallel.
 * Returns results for each detector (available or not).
 * Gracefully handles failures — never throws.
 */
export async function runExternalAIDetectors(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ExternalAIResult[]> {
  const results = await Promise.allSettled([
    detectWithHive(fileBuffer, mimeType),
    detectWithOptic(fileBuffer, mimeType),
    detectWithIlluminarty(fileBuffer, mimeType),
  ]);

  return results.map((result, index) => {
    const names = ["hive", "optic", "illuminarty"];
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      name: names[index],
      score: 0,
      available: false,
      error: result.reason?.message || "Detection failed",
    };
  });
}

/**
 * Check which external AI detectors are configured (have API keys).
 */
export function getConfiguredDetectors(): string[] {
  const detectors: string[] = [];
  if (process.env.HIVE_API_KEY) detectors.push("hive");
  if (process.env.OPTIC_API_KEY) detectors.push("optic");
  if (process.env.ILLUMINARTY_API_KEY) detectors.push("illuminarty");
  return detectors;
}
