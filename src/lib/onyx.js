/**
 * Onyx AI summon client — the only place the Academy talks to the edge.
 *
 * Transport note (security): the browser holds a *learner* credential only —
 * the Supabase access token. It never holds AXIM_INTERNAL_KEY. A signature made
 * with an internal key inside a Vite bundle is not a signature: the key ships to
 * every visitor and the "verification" protects nothing. The edge bridge signs
 * the satellite-to-Core relay server-side; the client just presents a token and
 * the domain context.
 *
 * No silent fabrication: when the uplink fails the caller gets an error and the
 * UI says so. A mock answer that reads like a real one is worse than an outage,
 * because nobody notices the assistant is dead.
 */

export const ONYX_SUMMON_URL = 'https://onyx-edge.axim.us.com/api/v1/onyx/summon';
export const ONYX_DOMAIN_CONTEXT = 'academy';
export const ONYX_TIMEOUT_MS = 20000;
export const ONYX_MAX_HISTORY_TURNS = 8;
export const ONYX_MAX_MESSAGE_CHARS = 2000;

export class OnyxError extends Error {
  constructor(code, message, { status = null, retryable = false } = {}) {
    super(message);
    this.name = 'OnyxError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

/** Trim the transcript to the last N turns, dropping ids/timestamps. */
export function filterHistory(history = [], maxTurns = ONYX_MAX_HISTORY_TURNS) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant') && msg.content)
    .slice(-maxTurns)
    .map((msg) => ({ role: msg.role, content: String(msg.content).slice(0, ONYX_MAX_MESSAGE_CHARS) }));
}

/** Request body for POST /api/v1/onyx/summon. */
export function buildOnyxSummonPayload({
  message,
  courseTitle = null,
  lessonId = null,
  lessonTitle = null,
  history = [],
} = {}) {
  const text = String(message ?? '').trim();
  if (!text) {
    throw new OnyxError('EMPTY_MESSAGE', 'Ask Onyx something first.');
  }
  return {
    domain_context: ONYX_DOMAIN_CONTEXT,
    message: text.slice(0, ONYX_MAX_MESSAGE_CHARS),
    history: filterHistory(history),
    context: {
      surface: 'academy_lms',
      course_title: courseTitle,
      lesson_id: lessonId,
      lesson_title: lessonTitle,
    },
  };
}

/** The edge has shipped a few response shapes; accept the documented ones. */
export function extractAnswer(data) {
  if (!data) return null;
  const candidates = [
    data.answer,
    data.response,
    data.reply,
    data.content,
    data.message,
    data.data?.answer,
    data.data?.response,
    data.result?.answer,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return null;
}

/**
 * POST the summon request.
 *
 * @returns {Promise<{answer:string, latencyMs:number, requestId:string|null}>}
 * @throws  {OnyxError} for every failure mode, never a synthetic answer
 */
export async function summonOnyx({
  message,
  courseTitle = null,
  lessonId = null,
  lessonTitle = null,
  history = [],
  accessToken = null,
  fetchImpl = globalThis.fetch,
  timeoutMs = ONYX_TIMEOUT_MS,
  url = ONYX_SUMMON_URL,
  now = () => Date.now(),
} = {}) {
  const body = buildOnyxSummonPayload({ message, courseTitle, lessonId, lessonTitle, history });
  if (typeof fetchImpl !== 'function') {
    throw new OnyxError('NO_TRANSPORT', 'Onyx uplink unavailable in this environment.');
  }

  const startedAt = now();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller?.signal,
    });
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    throw new OnyxError(
      aborted ? 'TIMEOUT' : 'NETWORK',
      aborted
        ? `Onyx did not answer within ${Math.round(timeoutMs / 1000)}s.`
        : 'Onyx uplink unreachable from this network.',
      { retryable: true },
    );
  } finally {
    if (timer) clearTimeout(timer);
  }

  const latencyMs = now() - startedAt;

  if (response.status === 401 || response.status === 403) {
    throw new OnyxError('UNAUTHORIZED', 'Your session is not authorized for Onyx. Sign in again.', {
      status: response.status,
    });
  }
  if (response.status === 429) {
    throw new OnyxError('RATE_LIMITED', 'Onyx is rate limiting this learner. Try again shortly.', {
      status: 429,
      retryable: true,
    });
  }
  if (!response.ok) {
    throw new OnyxError('UPSTREAM', `Onyx returned HTTP ${response.status}.`, {
      status: response.status,
      retryable: response.status >= 500,
    });
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new OnyxError('BAD_JSON', 'Onyx returned an unreadable payload.', { retryable: true });
  }

  const answer = extractAnswer(data);
  if (!answer) {
    throw new OnyxError('EMPTY_ANSWER', 'Onyx returned no answer text.', { retryable: true });
  }

  return {
    answer,
    latencyMs,
    requestId: data.request_id ?? data.requestId ?? response.headers?.get?.('x-request-id') ?? null,
  };
}
