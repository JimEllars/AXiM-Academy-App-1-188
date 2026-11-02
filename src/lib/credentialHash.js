/**
 * Credential hashing — the text that gets printed on the PDF certificate and
 * looked up on /verify/:hash.
 *
 * What this is: a SHA-256 digest over the canonical fields of one enrollment
 * (learner, course, issue date). It binds the numbers on the certificate to a
 * single short string, so a screenshot with an edited date or course title no
 * longer hashes to the same value.
 *
 * What this is not: a server-side signature. Anyone holding the enrollment row
 * can recompute the digest, so the authoritative check is still the row itself.
 * A signature requires the credential-minting Edge Function
 * (`/api/v1/credentials/mint`) to sign the payload with a key the client never
 * sees. Until that exists, the hash is a tamper-evidence aid and the DB row is
 * the source of truth. Do not describe it as anything more.
 *
 * Web Crypto only — no dependency, works in the browser and in Node >= 20,
 * which is what makes this unit-testable.
 */

export const CREDENTIAL_HASH_VERSION = 'AXM-CERT-v1';

/** 64 hex chars, uppercase tolerated. */
const HASH_PATTERN = /^[a-f0-9]{64}$/i;

/**
 * A certificate hash is only stable if its inputs are stable, so the issue date
 * must come from the record, never from `new Date()`. Falls back to created_at
 * for enrollments completed before the trigger started stamping completed_at.
 */
export function resolveIssuedAt(enrollment) {
  const raw = enrollment?.completed_at ?? enrollment?.created_at ?? null;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z'); // second precision, UTC
}

/** The exact fields that go into the digest. */
export function canonicalCredentialFields({ enrollmentId, userId, courseId, issuedAt } = {}) {
  return {
    version: CREDENTIAL_HASH_VERSION,
    enrollmentId: String(enrollmentId ?? '').trim().toLowerCase(),
    userId: String(userId ?? '').trim().toLowerCase(),
    courseId: String(courseId ?? '').trim().toLowerCase(),
    issuedAt: String(issuedAt ?? '').trim(),
  };
}

/** Stable serialization: fixed field order, `key=value` pairs, `|` separated. */
export function buildCanonicalString(fields) {
  const c = canonicalCredentialFields(fields);
  return [
    c.version,
    `enrollment=${c.enrollmentId}`,
    `user=${c.userId}`,
    `course=${c.courseId}`,
    `issued=${c.issuedAt}`,
  ].join('|');
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 of the canonical string, lowercase hex.
 * `cryptoImpl` is injectable so tests can pin a deterministic digest.
 */
export async function computeCredentialHash(fields, cryptoImpl = globalThis.crypto) {
  const text = buildCanonicalString(fields);
  if (!cryptoImpl?.subtle) {
    throw new Error('Web Crypto unavailable: cannot compute credential hash');
  }
  const digest = await cryptoImpl.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(digest);
}

/** Convenience wrapper: derive the hash straight from an enrollment row. */
export async function hashEnrollment(enrollment, courseIdOverride, cryptoImpl) {
  if (!enrollment?.id) throw new Error('enrollment.id is required to hash a credential');
  return computeCredentialHash(
    {
      enrollmentId: enrollment.id,
      userId: enrollment.user_id,
      courseId: courseIdOverride ?? enrollment.course_id,
      issuedAt: resolveIssuedAt(enrollment),
    },
    cryptoImpl,
  );
}

export function isCredentialHash(value) {
  return typeof value === 'string' && HASH_PATTERN.test(value.trim());
}

/**
 * Group the digest for readability on a printed certificate:
 * `4f9c1a2b 7d3e5f60 98ab12cd ...` (8 groups of 8).
 */
export function formatCredentialHash(hashHex) {
  const hex = String(hashHex ?? '').trim().toLowerCase();
  if (!isCredentialHash(hex)) return hex;
  return hex.match(/.{1,8}/g).join(' ');
}

/** `/verify/<hash>` target used by the certificate footer and share links. */
export function buildVerifyPath(hashHex) {
  const hex = String(hashHex ?? '').trim().toLowerCase();
  return `/verify/${hex}`;
}

/** Accepts a scanned/typed value: trims, strips spaces and the `HASH:` label. */
export function normalizeHashInput(value) {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/^(sha-?256|hash)\s*:\s*/i, '')
    .replace(/\s+/g, '')
    .toLowerCase();
  // A pasted line may carry a label or punctuation around the digest.
  const digest = cleaned.match(/[0-9a-f]{64}/);
  return digest ? digest[0] : cleaned;
}
