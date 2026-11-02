/**
 * Affiliate / referral capture for the Unified Commerce storefront.
 *
 * A partner link looks like `https://academy.axim.systems/?ref=gm-4417`.
 * The id is captured once, parked in sessionStorage, and attached to the
 * enrollment payload at checkout so revenue split attribution survives a
 * browse -> cart -> checkout journey across page loads.
 *
 * sessionStorage (not localStorage) is deliberate: attribution should not
 * follow a learner around forever on a shared machine.
 */

export const AFFILIATE_STORAGE_KEY = 'axim_academy_ref';
export const AFFILIATE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const AFFILIATE_MAX_LENGTH = 64;

/** Query params we accept as an affiliate id, most specific first. */
export const AFFILIATE_PARAMS = ['ref', 'aff', 'affiliate'];

/**
 * Reject anything that is not a plausible id. We do not want arbitrary strings
 * from a URL landing in a revenue-split record.
 */
export function sanitizeAffiliateId(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > AFFILIATE_MAX_LENGTH) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(trimmed)) return null;
  return trimmed;
}

/** Storage that never throws (Safari private mode, SSR, bot environments). */
function defaultStorage() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    /* access denied */
  }
  return null;
}

function readRecord(storage) {
  try {
    const raw = storage?.getItem(AFFILIATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const id = sanitizeAffiliateId(parsed.id);
    if (!id) return null;
    const capturedAt = Number(parsed.capturedAt);
    if (!Number.isFinite(capturedAt)) return null;
    return { id, capturedAt };
  } catch {
    return null;
  }
}

/**
 * Capture `?ref=` (or `?aff=` / `?affiliate=`) from a query string into storage.
 * Returns the captured id, or null when there is nothing valid to capture.
 * An existing, still-valid capture is never overwritten by an empty one.
 */
export function captureAffiliateRef(search, storage = defaultStorage(), now = Date.now()) {
  if (!storage) return null;
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  if (!params || typeof params.get !== 'function') return null;

  let id = null;
  for (const key of AFFILIATE_PARAMS) {
    id = sanitizeAffiliateId(params.get(key));
    if (id) break;
  }
  if (!id) return null;

  try {
    storage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify({ id, capturedAt: now }));
  } catch {
    /* quota or private mode — the id still returns for this render */
  }
  return id;
}

/** The affiliate id still inside its attribution window, else null. */
export function getAffiliateRef(storage = defaultStorage(), now = Date.now()) {
  if (!storage) return null;
  const record = readRecord(storage);
  if (!record) return null;
  if (now - record.capturedAt > AFFILIATE_TTL_MS) {
    clearAffiliateRef(storage);
    return null;
  }
  return record.id;
}

export function clearAffiliateRef(storage = defaultStorage()) {
  try {
    storage?.removeItem(AFFILIATE_STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}
