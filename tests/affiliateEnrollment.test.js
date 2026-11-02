import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AFFILIATE_STORAGE_KEY,
  captureAffiliateRef,
  getAffiliateRef,
} from '../src/lib/affiliate.js';
import { buildEnrollmentPayload } from '../src/lib/enrollmentPayload.js';

/**
 * Integration check across the three modules the affiliate flow touches:
 * landing capture (affiliate) -> checkout payload (enrollmentPayload) -> row.
 * Each module is exercised through its real export, not a copy of its logic.
 */

const USER_ID = '11111111-2222-4333-8444-555555555555';
const COURSE_ID = '99999999-8888-4777-8666-555555555555';

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('a partner landing link reaches the enrollment row', () => {
  const storage = makeStorage();

  // 1. Learner lands on /course/9?ref=gm-4417 from a partner newsletter.
  captureAffiliateRef('?ref=gm-4417&utm_campaign=fall', storage, 1_800_000_000_000);

  // 2. Later, at checkout, the ref is read back out of session storage.
  const affiliateId = getAffiliateRef(storage, 1_800_000_100_000);
  assert.equal(affiliateId, 'gm-4417');

  // 3. It rides along on the enrollment payload.
  const payload = buildEnrollmentPayload({
    userId: USER_ID,
    courseId: COURSE_ID,
    paymentMethod: 'internal_grant',
    promoCode: 'AXIM100',
    affiliateId,
  });

  assert.equal(payload.affiliate_id, 'gm-4417');
  assert.equal(payload.applied_promo_code, 'AXIM100');
});

test('an expired capture contributes nothing to the payload', () => {
  const storage = makeStorage();
  captureAffiliateRef('?ref=gm-4417', storage, 1);
  const affiliateId = getAffiliateRef(storage, 1 + 31 * 24 * 60 * 60 * 1000);
  assert.equal(affiliateId, null);

  const payload = buildEnrollmentPayload({
    userId: USER_ID,
    courseId: COURSE_ID,
    affiliateId,
  });
  assert.equal('affiliate_id' in payload, false);
});

test('a hostile ref cannot reach the row', () => {
  const storage = makeStorage();
  captureAffiliateRef('?ref=");DROP+TABLE+academy_enrollments;--', storage, 1);
  assert.equal(storage.getItem(AFFILIATE_STORAGE_KEY), null);
  assert.equal(getAffiliateRef(storage, 1), null);
});
