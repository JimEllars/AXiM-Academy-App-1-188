import { createClient } from '@supabase/supabase-js';
import { readSupabaseConfig } from './runtimeConfig';

const config = readSupabaseConfig(import.meta.env);

/**
 * False when the build was made against placeholder credentials. Callers must
 * check this before treating any Supabase error as a real backend failure.
 */
export const supabaseConfigured = config.configured;

export const supabaseUrl = config.url;

/**
 * The client is still constructed with a harmless fallback so imports and
 * module-level usage never throw during render; every call is gated on
 * `supabaseConfigured`.
 */
export const supabase = createClient(
  config.configured ? config.url : 'http://localhost:54321',
  config.configured ? config.key : 'unconfigured-anon-key',
);
