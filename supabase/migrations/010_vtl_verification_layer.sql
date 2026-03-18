-- Migration: Vericum Trust Layer (VTL) support
-- Adds VTL fields to verifications table and creates audit_log table

-- ─── 1. Add VTL fields to verifications ────────────────────────────────────

ALTER TABLE verifications
  ADD COLUMN IF NOT EXISTS vtl_score DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS vtl_tier VARCHAR(20),
  ADD COLUMN IF NOT EXISTS vtl_layers JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vtl_flags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS external_ai_results JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS engine_version VARCHAR(20) DEFAULT 'VTL-1.0.0';

-- Update perceptual_hash column to support real pHash (was placeholder)
-- No schema change needed — same column, better data

COMMENT ON COLUMN verifications.vtl_score IS 'Vericum Trust Layer score: 0.0 (untrusted) → 1.0 (fully trusted)';
COMMENT ON COLUMN verifications.vtl_tier IS 'Trust tier: platinum, gold, silver, bronze, untrusted';
COMMENT ON COLUMN verifications.vtl_layers IS 'Individual VTL layer scores: {temporal, device, crossRef, aiEnsemble}';
COMMENT ON COLUMN verifications.vtl_flags IS 'Trust flags: [{type, code, message}]';
COMMENT ON COLUMN verifications.external_ai_results IS 'Results from external AI detectors: [{name, score, available}]';

-- ─── 2. Create verification audit log ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id TEXT NOT NULL,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine_version VARCHAR(20) NOT NULL,
  input_hash VARCHAR(64) NOT NULL,
  c2pa_present BOOLEAN NOT NULL DEFAULT FALSE,
  vtl_score DECIMAL(5,4),
  trust_tier VARCHAR(20),
  layers JSONB DEFAULT '{}',
  flags JSONB DEFAULT '[]',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying audit trail by content
CREATE INDEX IF NOT EXISTS idx_audit_log_content_id ON verification_audit_log(content_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON verification_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_trust_tier ON verification_audit_log(trust_tier);

-- ─── 3. Create device fingerprint cache ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_make VARCHAR(100),
  device_model VARCHAR(200),
  device_category VARCHAR(30),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_count INTEGER DEFAULT 1,
  avg_trust_score DECIMAL(5,4),
  UNIQUE(user_id, device_make, device_model)
);

CREATE INDEX IF NOT EXISTS idx_device_fp_user ON device_fingerprints(user_id);

-- ─── 4. Add VTL-related indexes to verifications ────────────────────────────

CREATE INDEX IF NOT EXISTS idx_verifications_vtl_tier ON verifications(vtl_tier);
CREATE INDEX IF NOT EXISTS idx_verifications_vtl_score ON verifications(vtl_score DESC);

-- ─── 5. RLS policies for new tables ─────────────────────────────────────────

ALTER TABLE verification_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;

-- Audit log: read-only for content owners, write via service role only
CREATE POLICY "Users can view audit logs for their content"
  ON verification_audit_log FOR SELECT
  USING (
    content_id IN (
      SELECT id FROM contents WHERE user_id = auth.uid()
    )
  );

-- Device fingerprints: users can view their own
CREATE POLICY "Users can view their own device fingerprints"
  ON device_fingerprints FOR SELECT
  USING (user_id = auth.uid());

-- ─── 6. Function to upsert device fingerprint ──────────────────────────────

CREATE OR REPLACE FUNCTION upsert_device_fingerprint(
  p_user_id UUID,
  p_make VARCHAR,
  p_model VARCHAR,
  p_category VARCHAR,
  p_trust_score DECIMAL
) RETURNS void AS $$
BEGIN
  INSERT INTO device_fingerprints (user_id, device_make, device_model, device_category, avg_trust_score)
  VALUES (p_user_id, p_make, p_model, p_category, p_trust_score)
  ON CONFLICT (user_id, device_make, device_model)
  DO UPDATE SET
    last_seen_at = NOW(),
    content_count = device_fingerprints.content_count + 1,
    avg_trust_score = (device_fingerprints.avg_trust_score * device_fingerprints.content_count + p_trust_score)
                      / (device_fingerprints.content_count + 1),
    device_category = COALESCE(p_category, device_fingerprints.device_category);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
