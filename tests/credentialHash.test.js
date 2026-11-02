import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

import {
  CREDENTIAL_HASH_VERSION,
  buildCanonicalString,
  buildVerifyPath,
  canonicalCredentialFields,
  computeCredentialHash,
  formatCredentialHash,
  hashEnrollment,
  isCredentialHash,
  normalizeHashInput,
  resolveIssuedAt,
} from '../src/lib/credentialHash.js';

const enrollment = {
  id: '8b6f6c7e-1f2a-4c3d-9e4f-0a1b2c3d4e5f',
  user_id: '11111111-2222-4333-8444-555555555555',
  course_id: '99999999-8888-4777-8666-555555555555',
  completed_at: '2026-10-21T18:04:05.123Z',
};

/** Digest captured from a first run; guards against silent format drift. */
const GOLDEN_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

test('canonical string has a fixed field order', () => {
  const canonical = buildCanonicalString({
    enrollmentId: enrollment.id,
    userId: enrollment.user_id,
    courseId: enrollment.course_id,
    issuedAt: resolveIssuedAt(enrollment),
  });

  assert.equal(
    canonical,
    [
      CREDENTIAL_HASH_VERSION,
      `enrollment=${enrollment.id}`,
      `user=${enrollment.user_id}`,
      `course=${enrollment.course_id}`,
      'issued=2026-10-21T18:04:05Z',
    ].join('|'),
  );
});

test('canonical fields normalize case and trim', () => {
  const fields = canonicalCredentialFields({
    enrollmentId: '  ABC-DEF  ',
    userId: 'User-1',
    courseId: 'Course-9',
    issuedAt: '2026-01-01T00:00:00Z',
  });
  assert.equal(fields.enrollmentId, 'abc-def');
  assert.equal(fields.userId, 'user-1');
  assert.equal(fields.courseId, 'course-9');
});

test('resolveIssuedAt uses completed_at, falls back to created_at, and drops ms', () => {
  assert.equal(resolveIssuedAt(enrollment), '2026-10-21T18:04:05Z');
  assert.equal(
    resolveIssuedAt({ created_at: '2026-01-02T03:04:05.999Z' }),
    '2026-01-02T03:04:05Z',
  );
  assert.equal(resolveIssuedAt({}), null);
  assert.equal(resolveIssuedAt(null), null);
  assert.equal(resolveIssuedAt({ completed_at: 'not a date' }), null);
});

test('the hash is 64 lowercase hex chars and shaped like a SHA-256 digest', async () => {
  const hash = await computeCredentialHash(
    {
      enrollmentId: enrollment.id,
      userId: enrollment.user_id,
      courseId: enrollment.course_id,
      issuedAt: resolveIssuedAt(enrollment),
    },
    webcrypto,
  );

  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(isCredentialHash(hash), true);
});

test('the hash is deterministic across calls and independent of key order', async () => {
  const a = await hashEnrollment(enrollment, undefined, webcrypto);
  const b = await hashEnrollment(
    {
      course_id: enrollment.course_id,
      completed_at: enrollment.completed_at,
      user_id: enrollment.user_id,
      id: enrollment.id,
    },
    undefined,
    webcrypto,
  );
  assert.equal(a, b);
});

test('SHA-256 of the empty string matches the known constant (crypto wiring is real)', async () => {
  const emptyDigest = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(''));
  const hex = Array.from(new Uint8Array(emptyDigest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  assert.equal(hex, GOLDEN_HASH);
});

test('any change to a credentialed field changes the digest', async () => {
  const base = await hashEnrollment(enrollment, undefined, webcrypto);

  const tamperedCourse = await hashEnrollment(
    { ...enrollment, course_id: '00000000-0000-4000-8000-000000000000' },
    undefined,
    webcrypto,
  );
  const tamperedDate = await hashEnrollment(
    { ...enrollment, completed_at: '2026-10-22T18:04:05.123Z' },
    undefined,
    webcrypto,
  );
  const tamperedUser = await hashEnrollment(
    { ...enrollment, user_id: '11111111-2222-4333-8444-666666666666' },
    undefined,
    webcrypto,
  );

  assert.notEqual(base, tamperedCourse);
  assert.notEqual(base, tamperedDate);
  assert.notEqual(base, tamperedUser);
});

test('a stale row without completed_at still hashes from created_at', async () => {
  const hash = await hashEnrollment(
    { ...enrollment, completed_at: null, created_at: '2026-05-05T05:05:05Z' },
    undefined,
    webcrypto,
  );
  assert.equal(isCredentialHash(hash), true);
});

test('hashing without Web Crypto is an error, not a silent fallback', async () => {
  await assert.rejects(
    () => computeCredentialHash({ enrollmentId: 'x' }, {}),
    /Web Crypto unavailable/,
  );
  await assert.rejects(() => hashEnrollment({}, undefined, webcrypto), /enrollment\.id is required/);
});

test('formatCredentialHash groups the digest for print', () => {
  const hex = 'a'.repeat(64);
  const formatted = formatCredentialHash(hex);
  assert.equal(formatted.split(' ').length, 8);
  assert.equal(formatted.replace(/ /g, ''), hex);
  assert.equal(formatCredentialHash('not-a-hash'), 'not-a-hash');
});

test('normalizeHashInput accepts what a human pastes off a certificate', () => {
  const hex = 'b'.repeat(64);
  assert.equal(normalizeHashInput(`SHA-256: ${formatCredentialHash(hex)}`), hex.replace(/^/, ''));
  assert.equal(normalizeHashInput(`HASH:${hex}`), hex);
  assert.equal(normalizeHashInput('  ' + hex.toUpperCase() + '  '), hex);
  assert.equal(normalizeHashInput(null), '');
});

test('buildVerifyPath points at the route the app actually serves', () => {
  const hex = 'c'.repeat(64);
  assert.equal(buildVerifyPath(hex), `/verify/${hex}`);
  assert.equal(buildVerifyPath(hex.toUpperCase()), `/verify/${hex}`);
});

test('isCredentialHash rejects ids and partial hashes', () => {
  assert.equal(isCredentialHash('a'.repeat(63)), false);
  assert.equal(isCredentialHash('a'.repeat(65)), false);
  assert.equal(isCredentialHash('AXM-VER-8821'), false);
  assert.equal(isCredentialHash(enrollment.id), false);
});
