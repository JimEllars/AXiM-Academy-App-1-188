import test from 'node:test';
import assert from 'node:assert/strict';

import { mapEnrollmentRows, mergeEnrollments, countCompletedLessons } from '../src/lib/enrollmentState.js';

const ENR_A = {
  id: 'enr-a',
  user_id: 'u-1',
  course_id: 'course-1',
  status: 'active',
  completed_at: null,
  created_at: '2026-11-01T10:00:00.000Z',
};

const ENR_B = {
  id: 'enr-b',
  user_id: 'u-1',
  course_id: 'course-2',
  status: 'completed',
  completed_at: '2026-11-02T10:00:00.000Z',
  created_at: '2026-11-01T10:00:00.000Z',
};

test('mapEnrollmentRows always yields an array progress, even with no rows', () => {
  const [mapped] = mapEnrollmentRows([ENR_A], []);
  assert.deepEqual(mapped.progress, []);
});

test('mapEnrollmentRows tolerates a null progress list', () => {
  const [mapped] = mapEnrollmentRows([ENR_A], null);
  assert.deepEqual(mapped.progress, []);
});

test('mapEnrollmentRows attaches progress rows to their enrollment', () => {
  const progress = [
    { enrollment_id: 'enr-a', lesson_id: 'l1', is_completed: true, completed_at: '2026-11-01T11:00:00.000Z', quiz_score: 67 },
    { enrollment_id: 'enr-b', lesson_id: 'l9', is_completed: true },
  ];
  const mapped = mapEnrollmentRows([ENR_A, ENR_B], progress);
  assert.equal(mapped[0].progress.length, 1);
  assert.equal(mapped[0].progress[0].lesson_id, 'l1');
  assert.equal(mapped[0].progress[0].quiz_score, 67);
  assert.equal(mapped[1].progress[0].lesson_id, 'l9');
});

test('mapEnrollmentRows drops incomplete progress rows', () => {
  const progress = [{ enrollment_id: 'enr-a', lesson_id: 'l1', is_completed: false }];
  const [mapped] = mapEnrollmentRows([ENR_A], progress);
  assert.deepEqual(mapped.progress, []);
});

test('mapEnrollmentRows never invents progress for an unknown enrollment', () => {
  const progress = [{ enrollment_id: 'nope', lesson_id: 'l1', is_completed: true }];
  const [mapped] = mapEnrollmentRows([ENR_A], progress);
  assert.deepEqual(mapped.progress, []);
});

test('mapEnrollmentRows keeps the server status and completion date', () => {
  const mapped = mapEnrollmentRows([ENR_B], []);
  assert.equal(mapped[0].status, 'completed');
  assert.equal(mapped[0].completed_at, '2026-11-02T10:00:00.000Z');
});

test('mapEnrollmentRows returns an empty list for junk input', () => {
  assert.deepEqual(mapEnrollmentRows(null, null), []);
  assert.deepEqual(mapEnrollmentRows(undefined, []), []);
});

test('mergeEnrollments lets the server row win for a known enrollment', () => {
  const local = [{ ...ENR_A, status: 'active', progress: [{ lesson_id: 'l1', is_completed: true }] }];
  const remote = mapEnrollmentRows(
    [{ ...ENR_A, status: 'completed', completed_at: '2026-11-03T00:00:00.000Z' }],
    [{ enrollment_id: 'enr-a', lesson_id: 'l1', is_completed: true }],
  );
  const merged = mergeEnrollments(local, remote);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].status, 'completed');
  assert.equal(merged[0].completed_at, '2026-11-03T00:00:00.000Z');
});

test('mergeEnrollments keeps a local enrollment the database has not seen yet', () => {
  const local = [{ id: 'enr-local', course_id: 'course-9', status: 'active', progress: [] }];
  const remote = mapEnrollmentRows([ENR_A], []);
  const merged = mergeEnrollments(local, remote);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged.map((e) => e.id).sort(), ['enr-a', 'enr-local']);
});

test('mergeEnrollments is additive: an empty fetch cannot wipe the local list', () => {
  const local = [{ id: 'enr-local', course_id: 'course-9', status: 'active', progress: [] }];
  assert.deepEqual(mergeEnrollments(local, []), local);
  assert.deepEqual(mergeEnrollments(null, null), []);
});

test('countCompletedLessons counts distinct completed lessons only', () => {
  const progress = [
    { lesson_id: 'l1', is_completed: true },
    { lesson_id: 'l1', is_completed: true },
    { lesson_id: 'l2', is_completed: false },
  ];
  assert.equal(countCompletedLessons(progress), 1);
  assert.equal(countCompletedLessons([]), 0);
  assert.equal(countCompletedLessons(null), 0);
});
