import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ONYX_DOMAIN_CONTEXT,
  ONYX_MAX_HISTORY_TURNS,
  ONYX_SUMMON_URL,
  OnyxError,
  buildOnyxSummonPayload,
  extractAnswer,
  filterHistory,
  summonOnyx,
} from '../src/lib/onyx.js';

const okResponse = (body, { status = 200, headers = new Map() } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => headers.get?.(name) ?? null },
  json: async () => body,
});

test('the summon payload declares the academy domain context', () => {
  const payload = buildOnyxSummonPayload({
    message: 'How do I stabilise the relay chassis?',
    courseTitle: 'Hardware Link Installation Protocol',
    lessonId: 'l1',
    lessonTitle: 'Relay Chassis Mounting',
  });

  assert.equal(payload.domain_context, 'academy');
  assert.equal(payload.domain_context, ONYX_DOMAIN_CONTEXT);
  assert.equal(payload.message, 'How do I stabilise the relay chassis?');
  assert.deepEqual(payload.context, {
    surface: 'academy_lms',
    course_title: 'Hardware Link Installation Protocol',
    lesson_id: 'l1',
    lesson_title: 'Relay Chassis Mounting',
  });
  assert.deepEqual(payload.history, []);
});

test('empty questions are rejected before any network call', () => {
  assert.throws(() => buildOnyxSummonPayload({ message: '   ' }), (err) => err.code === 'EMPTY_MESSAGE');
});

test('history is trimmed to the last turns and stripped of UI fields', () => {
  const history = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `turn ${i}`,
    timestamp: '2026-01-01T00:00:00Z',
    internal: 'drop me',
  }));

  const filtered = filterHistory(history);
  assert.equal(filtered.length, ONYX_MAX_HISTORY_TURNS);
  assert.equal(filtered.at(-1).content, 'turn 11');
  for (const turn of filtered) {
    assert.deepEqual(Object.keys(turn).sort(), ['content', 'role']);
  }

  assert.deepEqual(filterHistory('not an array'), []);
  assert.deepEqual(filterHistory([{ role: 'system', content: 'x' }]), []);
});

test('extractAnswer understands the response shapes the edge has used', () => {
  assert.equal(extractAnswer({ answer: ' a ' }), 'a');
  assert.equal(extractAnswer({ response: 'b' }), 'b');
  assert.equal(extractAnswer({ data: { answer: 'c' } }), 'c');
  assert.equal(extractAnswer({ result: { answer: 'd' } }), 'd');
  assert.equal(extractAnswer({ answer: '   ' }), null);
  assert.equal(extractAnswer({}), null);
  assert.equal(extractAnswer(null), null);
});

test('summonOnyx posts to the onyx edge endpoint with the learner token', async () => {
  const calls = [];
  const result = await summonOnyx({
    message: 'explain SBT minting',
    courseTitle: 'Course',
    lessonId: 'l4',
    accessToken: 'jwt-abc',
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return okResponse({ answer: 'Minted on Arbitrum One.', request_id: 'req-1' });
    },
    now: (() => {
      let t = 1000;
      return () => (t += 250);
    })(),
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, ONYX_SUMMON_URL);
  assert.equal(calls[0].url, 'https://onyx-edge.axim.us.com/api/v1/onyx/summon');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer jwt-abc');
  assert.equal(JSON.parse(calls[0].init.body).domain_context, 'academy');

  assert.equal(result.answer, 'Minted on Arbitrum One.');
  assert.equal(result.requestId, 'req-1');
  assert.equal(result.latencyMs, 250);
});

test('the request never carries an internal signing key', async () => {
  let captured;
  await summonOnyx({
    message: 'hi',
    accessToken: 'jwt-abc',
    fetchImpl: async (url, init) => {
      captured = init;
      return okResponse({ answer: 'ok' });
    },
  });

  const serialized = JSON.stringify(captured).toLowerCase();
  for (const forbidden of ['axim_internal_key', 'x-axim-signature', 'x-axim-timestamp', 'hmac']) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} must not reach the browser request`);
  }
});

test('401 is reported as an authorization failure, not an empty answer', async () => {
  await assert.rejects(
    () => summonOnyx({ message: 'hi', fetchImpl: async () => okResponse({}, { status: 401 }) }),
    (err) => err instanceof OnyxError && err.code === 'UNAUTHORIZED' && err.status === 401,
  );
});

test('429 is retryable', async () => {
  await assert.rejects(
    () => summonOnyx({ message: 'hi', fetchImpl: async () => okResponse({}, { status: 429 }) }),
    (err) => err.code === 'RATE_LIMITED' && err.retryable === true,
  );
});

test('5xx is retryable, 4xx is not', async () => {
  await assert.rejects(
    () => summonOnyx({ message: 'hi', fetchImpl: async () => okResponse({}, { status: 503 }) }),
    (err) => err.code === 'UPSTREAM' && err.retryable === true,
  );
  await assert.rejects(
    () => summonOnyx({ message: 'hi', fetchImpl: async () => okResponse({}, { status: 404 }) }),
    (err) => err.code === 'UPSTREAM' && err.retryable === false,
  );
});

test('network failure and unreadable payload surface as OnyxError', async () => {
  await assert.rejects(
    () => summonOnyx({
      message: 'hi',
      fetchImpl: async () => {
        throw new TypeError('Failed to fetch');
      },
    }),
    (err) => err.code === 'NETWORK' && err.retryable === true,
  );

  await assert.rejects(
    () => summonOnyx({
      message: 'hi',
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => {
          throw new Error('bad json');
        },
      }),
    }),
    (err) => err.code === 'BAD_JSON',
  );

  await assert.rejects(
    () => summonOnyx({ message: 'hi', fetchImpl: async () => okResponse({ detail: 'nope' }) }),
    (err) => err.code === 'EMPTY_ANSWER',
  );
});

test('an aborted request reports a timeout', async () => {
  await assert.rejects(
    () => summonOnyx({
      message: 'hi',
      timeoutMs: 5,
      fetchImpl: (url, init) => new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      }),
    }),
    (err) => err.code === 'TIMEOUT',
  );
});
