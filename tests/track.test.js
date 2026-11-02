import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ALL_TRACKS,
  TRACKS,
  TRACK_FILTERS,
  buildCatalogHref,
  courseMatchesTrack,
  normalizeTrack,
  readTrackParam,
  trackToSlug,
} from '../src/lib/track.js';

test('the three Ladder of Value tracks are canonical', () => {
  assert.deepEqual(TRACKS.slice(0, 3), ['Foundation', 'Creative Labs', 'Professional Edge']);
  assert.equal(TRACK_FILTERS[0], ALL_TRACKS);
  assert.equal(TRACK_FILTERS.length, TRACKS.length + 1);
});

test('slugs round-trip for every canonical track', () => {
  for (const track of TRACKS) {
    assert.equal(normalizeTrack(trackToSlug(track)), track, `slug for ${track}`);
  }
});

test('normalizeTrack accepts the spellings real links use', () => {
  assert.equal(normalizeTrack('creative labs'), 'Creative Labs');
  assert.equal(normalizeTrack('creative-labs'), 'Creative Labs');
  assert.equal(normalizeTrack('CREATIVE_LABS'), 'Creative Labs');
  assert.equal(normalizeTrack('  professional%20edge '), 'Professional Edge');
  assert.equal(normalizeTrack('professional_edge'), 'Professional Edge');
  assert.equal(normalizeTrack('all'), ALL_TRACKS);
});

test('normalizeTrack falls back for unknown or missing values', () => {
  assert.equal(normalizeTrack('quantum-basket-weaving'), ALL_TRACKS);
  assert.equal(normalizeTrack('', ALL_TRACKS), ALL_TRACKS);
  assert.equal(normalizeTrack(null), ALL_TRACKS);
  assert.equal(normalizeTrack(undefined, null), null);
});

test('readTrackParam reads ?category= and ?track=, and prefers category', () => {
  const fromCategory = new URLSearchParams('category=creative-labs');
  assert.equal(readTrackParam(fromCategory), 'Creative Labs');

  const fromTrack = new URLSearchParams('track=professional_edge');
  assert.equal(readTrackParam(fromTrack), 'Professional Edge');

  const both = new URLSearchParams('category=foundation&track=ai');
  assert.equal(readTrackParam(both), 'Foundation');

  const empty = new URLSearchParams('');
  assert.equal(readTrackParam(empty), ALL_TRACKS);
  assert.equal(readTrackParam(empty, null), null);
});

test('buildCatalogHref emits a filterable URL and keeps the affiliate ref', () => {
  assert.equal(buildCatalogHref('Creative Labs'), '/?category=creative-labs');
  assert.equal(buildCatalogHref(ALL_TRACKS), '/');
  assert.equal(buildCatalogHref('Professional Edge', { ref: 'gm-4417' }), '/?category=professional-edge&ref=gm-4417');
  assert.equal(buildCatalogHref('nonsense'), '/');
  // A link produced here must be readable back through readTrackParam.
  const url = new URL(buildCatalogHref('Foundation'), 'https://academy.axim.systems');
  assert.equal(readTrackParam(url.searchParams), 'Foundation');
});

test('courseMatchesTrack filters by track, case and slug included', () => {
  const course = { category: 'Creative Labs' };
  assert.equal(courseMatchesTrack(course, ALL_TRACKS), true);
  assert.equal(courseMatchesTrack(course, 'Creative Labs'), true);
  assert.equal(courseMatchesTrack(course, 'creative-labs'), true);
  assert.equal(courseMatchesTrack(course, 'Foundation'), false);
  assert.equal(courseMatchesTrack({ category: null }, 'Foundation'), false);
  assert.equal(courseMatchesTrack({ category: null }, ALL_TRACKS), true);
});
