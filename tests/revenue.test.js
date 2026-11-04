import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRevenueRecord, DEFAULT_PARTNER_SHARE } from '../src/lib/revenue.js';

const COURSE = { id: 'c1', instructor_id: 'ptr-1', price_usd: 299, revenue_share: 75 };

test('an internal grant produces no revenue record', () => {
  // Internal staff enroll through a 100% code. The local ledger used to write a
  // full-price partner earning for those, so a free enrollment looked like a
  // completed sale in every partner and admin total.
  assert.equal(buildRevenueRecord({ course: COURSE, paymentMethod: 'internal_grant' }), null);
});

test('a course with no instructor earns nobody anything', () => {
  assert.equal(buildRevenueRecord({ course: { ...COURSE, instructor_id: null } }), null);
  assert.equal(buildRevenueRecord({ course: null }), null);
});

test('a zero or unparseable price produces no revenue record', () => {
  assert.equal(buildRevenueRecord({ course: { ...COURSE, price_usd: 0 } }), null);
  assert.equal(buildRevenueRecord({ course: { ...COURSE, price_usd: 'free' } }), null);
  assert.equal(buildRevenueRecord({ course: { ...COURSE, price_usd: -5 } }), null);
});

test('the split is computed from the list price and rounds to cents', () => {
  const record = buildRevenueRecord({ course: COURSE, paymentMethod: 'fiat' });
  assert.equal(record.amount, 224.25);
  assert.equal(record.platform_amount, 74.75);
  assert.equal(record.amount + record.platform_amount, 299);
});

test('the two halves always add up to the gross', () => {
  const record = buildRevenueRecord({ course: { ...COURSE, price_usd: 99, revenue_share: 33 } });
  assert.equal(record.amount, 32.67);
  assert.equal(record.platform_amount, 66.33);
  assert.equal(Number((record.amount + record.platform_amount).toFixed(2)), 99);
});

test('a missing share falls back to the documented default', () => {
  const record = buildRevenueRecord({ course: { ...COURSE, revenue_share: undefined } });
  assert.equal(record.partner_share, DEFAULT_PARTNER_SHARE);
  assert.equal(record.amount, 224.25);
});

test('a nonsense share is clamped to 0-100', () => {
  assert.equal(buildRevenueRecord({ course: { ...COURSE, revenue_share: 150 } }).amount, 299);
  assert.equal(buildRevenueRecord({ course: { ...COURSE, revenue_share: -10 } }).amount, 0);
});

test('nothing is recorded as settled, because nothing has been paid out', () => {
  const record = buildRevenueRecord({ course: COURSE, paymentMethod: 'crypto' });
  assert.equal(record.settled, false);
  assert.equal(record.currency, 'USD');
  assert.equal(record.payment_method, 'crypto');
  assert.equal(record.partner_id, 'ptr-1');
  assert.equal(record.course_id, 'c1');
});
