/**
 * Runtime configuration checks.
 *
 * The repository ships a committed `.env` whose values are placeholders
 * (`https://your-project-id.supabase.co`, a 13-character "anon key"). A build
 * made from it compiles, boots, and then fails every single request — which
 * looks exactly like a backend outage and gets debugged as one.
 *
 * These guards let the app say "this build has no commerce backend" instead of
 * surfacing a PostgREST error to a learner.
 */

const PLACEHOLDER_TOKENS = [
  'your-project',
  'your-anon',
  'your-',
  'placeholder',
  'changeme',
  'change-me',
  'example.com',
  'project-id',
  'xxxxxxxx',
];

/** True for empty strings and for the obvious placeholder values. */
export function isPlaceholderValue(value) {
  if (typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  return PLACEHOLDER_TOKENS.some((token) => lower.includes(token));
}

/**
 * Supabase needs a real project URL and a key that is long enough to be a JWT
 * or a publishable key. Placeholders fail both.
 */
export function isConfiguredSupabase({ url, key } = {}) {
  if (isPlaceholderValue(url) || isPlaceholderValue(key)) return false;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(String(url).trim())) return false;
  return String(key).trim().length >= 20;
}

export function readSupabaseConfig(env = {}) {
  const url = env?.VITE_SUPABASE_URL ?? '';
  const key = env?.VITE_SUPABASE_ANON_KEY ?? '';
  return { url, key, configured: isConfiguredSupabase({ url, key }) };
}

/** An SBT contract address is only usable when it is a real 20-byte address. */
export function readSbtConfig(env = {}) {
  const address = env?.VITE_SBT_CONTRACT_ADDRESS ?? '';
  return { address: address.trim(), configured: /^0x[0-9a-f]{40}$/i.test(address.trim()) };
}
