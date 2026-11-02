import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AFFILIATE_MAX_LENGTH,
  AFFILIATE_STORAGE_KEY,
  AFFILIATE_TTL_MS,
  captureAffiliateRef,
  clearAffiliateRef,
  getAffiliateRef,
  sanitizeAffiliateId,
} from '../src/lib/affiliate.js';

/** Minimal sessionStorage stand-in. */
function makeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    get size() {
      return map.size;
    },
  };
}

test('sanitizeAffiliateId accepts partner ids and rejects junk', () => {
  assert.equal(sanitizeAffiliateId('gm-4417'), 'gm-4417');
  assert.equal(sanitizeAffiliateId('  partner_12.a  '), 'partner_12.a');
  assert.equal(sanitizeAffiliateId('affiliate:tg-9'), 'affiliate:tg-9');

  assert.equal(sanitizeAffiliateId(''), null);
  assert.equal(sanitizeAffiliateId('   '), null);
  assert.equal(sanitizeAffiliateId('x'.repeat(AFFILIATE_MAX_LENGTH + 1)), null);
  assert.equal(sanitizeAffiliateId('drop table users'), null);
  assert.equal(sanitizeAffiliateId('<script>alert(1)</script>'), null);
  assert.equal(sanitizeAffiliateId('-leading-dash'), null);
  assert.equal(sanitizeAffiliateId(undefined), null);
  assert.equal(sanitizeAffiliateId(42), null);
});

test('captureAffiliateRef stores the id from ?ref=', () => {
  const storage = makeStorage();
  const id = captureAffiliateRef('?ref=gm-4417&utm_source=newsletter', storage, 1_700_000_000_000);

  assert.equal(id, 'gm-4417');
  assert.equal(storage.size, 1);
  assert.deepEqual(JSON.parse(storage.getItem(AFFILIATE_STORAGE_KEY)), {
    id: 'gm-4417',
    capturedAt: 1_700_000_000_000,
  });
  assert.equal(getAffiliateRef(storage, 1_700_000_000_000), 'gm-4417');
});

test('captureAffiliateRef honours ?aff= and ?affiliate= aliases', () => {
  const storage = makeStorage();
  assert.equal(captureAffiliateRef('?aff=alpha', storage, 1), 'alpha');
  assert.equal(captureAffiliateRef('?affiliate=beta', storage, 2), 'beta');
});

test('captureAffiliateRef leaves an existing valid capture intact when the query is empty', () => {
  const storage = makeStorage();
  captureAffiliateRef('?ref=first-touch', storage, 1_000);
  const afterEmpty = captureAffiliateRef('?utm_campaign=x', storage, 2_000);

  assert.equal(afterEmpty, null);
  assert.equal(getAffiliateRef(storage, 2_000), 'first-touch');
});

test('captureAffiliateRef refuses unsafe ids and never writes them', () => {
  const storage = makeStorage();
  assert.equal(captureAffiliateRef('?ref=<img src=x onerror=alert(1)>', storage, 1), null);
  assert.equal(storage.size, 0);
});

test('a ref expires after the attribution window', () => {
  const storage = makeStorage();
  captureAffiliateRef('?ref=gm-4417', storage, 1_000_000);

  assert.equal(getAffiliateRef(storage, 1_000_000 + AFFILIATE_TTL_MS - 1), 'gm-4417');
  assert.equal(getAffiliateRef(storage, 1_000_000 + AFFILIATE_TTL_MS + 1), null);
  assert.equal(storage.size, 0, 'expired capture is removed');
});

test('corrupt storage does not throw', () => {
  const storage = makeStorage();
  storage.setItem(AFFILIATE_STORAGE_KEY, 'not json{');
  assert.equal(getAffiliateRef(storage, 1), null);

  storage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify({ id: 'gm-1' })); // no capturedAt
  assert.equal(getAffiliateRef(storage, 1), null);
});

test('clearAffiliateRef removes the capture', () => {
  const storage = makeStorage();
  captureAffiliateRef('?ref=gm-4417', storage, 1);
  clearAffiliateRef(storage);
  assert.equal(getAffiliateRef(storage, 1), null);
});

test('missing storage is tolerated (private mode, SSR)', () => {
  assert.equal(captureAffiliateRef('?ref=gm-4417', null, 1), null);
  assert.equal(getAffiliateRef(null, 1), null);
  assert.doesNotThrow(() => clearAffiliateRef(null));
});
