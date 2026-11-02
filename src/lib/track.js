/**
 * Ladder of Value — track (category) normalization.
 *
 * Tracks arrive from three places and none of them agree on spelling:
 *   - the DB `academy_courses.category` text column ("Creative Labs")
 *   - marketing links ("?category=creative-labs")
 *   - partner referrals ("?track=professional_edge")
 *
 * Everything funnels through `normalizeTrack` so a link and a DB row always
 * compare equal.
 */

export const ALL_TRACKS = 'All';

/** Canonical track labels, in catalog display order. Must match the DB seed. */
export const TRACKS = [
  'Foundation',
  'Creative Labs',
  'Professional Edge',
  'Hardware',
  'AI',
  'Protocol',
];

/** UI filter chips: "All" plus every canonical track. */
export const TRACK_FILTERS = [ALL_TRACKS, ...TRACKS];

/** "Creative Labs" -> "creative-labs" */
export function trackToSlug(track) {
  return safeDecode(String(track ?? ''))
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Partner links are sometimes double-encoded; never throw on a stray '%'. */
function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Resolve an arbitrary inbound value to a canonical track label.
 * Returns `fallback` (default "All") when the value is missing or unknown.
 */
export function normalizeTrack(value, fallback = ALL_TRACKS) {
  if (value === null || value === undefined) return fallback;
  const slug = trackToSlug(value);
  if (!slug) return fallback;
  if (slug === trackToSlug(ALL_TRACKS)) return ALL_TRACKS;
  const match = TRACKS.find((track) => trackToSlug(track) === slug);
  return match ?? fallback;
}

/**
 * Read a track off a URLSearchParams-like object.
 * Accepts `?category=` (storefront links) and `?track=` (campaign links).
 */
export function readTrackParam(searchParams, fallback = ALL_TRACKS) {
  if (!searchParams || typeof searchParams.get !== 'function') return fallback;
  const raw = searchParams.get('category') ?? searchParams.get('track');
  return normalizeTrack(raw, fallback);
}

/**
 * Build the storefront URL for a track, preserving an affiliate ref when present.
 * Home is the catalog, so a filtered catalog link is always `/?category=<slug>`.
 */
export function buildCatalogHref(track, { ref = null } = {}) {
  const params = new URLSearchParams();
  const normalized = normalizeTrack(track, null);
  if (normalized && normalized !== ALL_TRACKS) {
    params.set('category', trackToSlug(normalized));
  }
  if (ref) params.set('ref', ref);
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

/** Does a course belong to the currently selected track? */
export function courseMatchesTrack(course, activeTrack) {
  const active = normalizeTrack(activeTrack, ALL_TRACKS);
  if (active === ALL_TRACKS) return true;
  return normalizeTrack(course?.category, null) === active;
}
