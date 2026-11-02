import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PAYMENT_METHODS,
  ENROLLMENT_COLUMNS,
  EnrollmentPayloadError,
  buildEnrollmentPayload,
  buildProgressPayload,
  isUnknownColumnError,
  isUuid,
  stripOptionalColumns,
} from '../src/lib/enrollmentPayload.js';

const USER_ID = '11111111-2222-4333-8444-555555555555';
const COURSE_ID = '99999999-8888-4777-8666-555555555555';

test('every emitted key is a real academy_enrollments column', () => {
  const payload = buildEnrollmentPayload({
    userId: USER_ID,
    courseId: COURSE_ID,
    paymentMethod: 'crypto',
    txHash: '0xabc123',
    stripeIntent: 'pi_123',
    walletAddress: '0xWALLET',
    promoCode: 'axim100',
    affiliateId: 'gm-4417',
  });

  for (const key of Object.keys(payload)) {
    assert.ok(ENROLLMENT_COLUMNS.includes(key), `${key} is not a real column`);
  }
  // The regression this module exists for: these two names do not exist.
  assert.equal('payment_method' in payload, true);
  assert.equal('tx_hash' in payload, true);
});

test('crypto enrollment maps wallet and tx hash', () => {
  const payload = buildEnrollmentPayload({
    userId: USER_ID,
    courseId: COURSE_ID,
    paymentMethod: 'crypto',
    txHash: ' 0xdeadbeef ',
    walletAddress: ' 0x1234567890abcdef1234567890abcdef12345678 ',
  });

  assert.deepEqual(payload, {
    user_id: USER_ID,
    course_id: COURSE_ID,
    status: 'active',
    payment_method: 'crypto',
    tx_hash: '0xdeadbeef',
    web3_wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
  });
});

test('a 100% internal grant stores the promo code and the affiliate ref', () => {
  const payload = buildEnrollmentPayload({
    userId: USER_ID,
    courseId: COURSE_ID,
    paymentMethod: 'internal_grant',
    promoCode: ' axim100 ',
    affiliateId: 'gm-4417',
  });

  assert.equal(payload.payment_method, 'internal_grant');
  assert.equal(payload.applied_promo_code, 'AXIM100', 'promo codes are stored uppercase');
  assert.equal(payload.affiliate_id, 'gm-4417');
  assert.equal(payload.tx_hash, undefined);
});

test('fiat enrollment keeps the Stripe intent and no tx hash', () => {
  const payload = buildEnrollmentPayload({
    userId: USER_ID,
    courseId: COURSE_ID,
    paymentMethod: 'fiat',
    stripeIntent: 'pi_9',
  });

  assert.equal(payload.stripe_payment_intent, 'pi_9');
  assert.equal(payload.tx_hash, undefined);
  assert.equal(payload.affiliate_id, undefined);
});

test('a missing uuid user is rejected instead of writing the string "anon"', () => {
  for (const userId of ['anon', 'usr-1234', '', null, undefined, '0xWalletAddress']) {
    assert.throws(
      () => buildEnrollmentPayload({ userId, courseId: COURSE_ID }),
      (err) => err instanceof EnrollmentPayloadError && err.code === 'INVALID_USER',
      `expected INVALID_USER for ${String(userId)}`,
    );
  }
});

test('missing course and unknown payment method are rejected', () => {
  assert.throws(
    () => buildEnrollmentPayload({ userId: USER_ID }),
    (err) => err.code === 'MISSING_COURSE',
  );
  assert.throws(
    () => buildEnrollmentPayload({ userId: USER_ID, courseId: COURSE_ID, paymentMethod: 'bitcoin' }),
    (err) => err.code === 'INVALID_PAYMENT_METHOD',
  );
});

test('the three unified-commerce payment methods are accepted', () => {
  for (const method of PAYMENT_METHODS) {
    const payload = buildEnrollmentPayload({ userId: USER_ID, courseId: COURSE_ID, paymentMethod: method });
    assert.equal(payload.payment_method, method);
  }
});

test('isUuid handles the shapes that reach the store', () => {
  assert.equal(isUuid(USER_ID), true);
  assert.equal(isUuid(USER_ID.toUpperCase()), true);
  assert.equal(isUuid('anon'), false);
  assert.equal(isUuid('usr-1750000000000'), false);
  assert.equal(isUuid(null), false);
});

test('stripOptionalColumns degrades one column at a time', () => {
  const payload = buildEnrollmentPayload({
    userId: USER_ID,
    courseId: COURSE_ID,
    paymentMethod: 'crypto',
    txHash: '0x1',
    affiliateId: 'gm-1',
  });

  const first = stripOptionalColumns(payload);
  assert.equal('affiliate_id' in first, false);
  assert.equal('tx_hash' in first, true);

  const second = stripOptionalColumns(first);
  assert.equal('tx_hash' in second, false);
  assert.equal('payment_method' in second, true);

  const base = { user_id: USER_ID, course_id: COURSE_ID, status: 'active' };
  assert.deepEqual(stripOptionalColumns(base), base, 'nothing optional left to strip');
});

test('isUnknownColumnError recognises PostgREST and Postgres shapes', () => {
  assert.equal(isUnknownColumnError({ code: 'PGRST204', message: 'Could not find the payment_method column' }), true);
  assert.equal(isUnknownColumnError({ code: '42703', message: 'column "tx_hash" does not exist' }), true);
  assert.equal(isUnknownColumnError({ message: 'column affiliate_id does not exist' }), true);
  assert.equal(isUnknownColumnError({ code: '23505', message: 'duplicate key value' }), false);
  assert.equal(isUnknownColumnError(null), false);
});

test('progress payload only carries real academy_progress columns', () => {
  const payload = buildProgressPayload({
    enrollmentId: USER_ID,
    lessonId: COURSE_ID,
    quizScore: 100,
    completedAt: '2026-11-02T12:00:00.000Z',
  });

  assert.deepEqual(payload, {
    enrollment_id: USER_ID,
    lesson_id: COURSE_ID,
    is_completed: true,
    quiz_score: 100,
    completed_at: '2026-11-02T12:00:00.000Z',
  });
  assert.throws(() => buildProgressPayload({}), /enrollmentId and lessonId are required/);
});
