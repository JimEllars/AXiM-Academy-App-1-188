/**
 * Enrollment state — turning `academy_enrollments` rows into the shape the UI
 * renders, and merging them with whatever the browser already holds.
 *
 * Why this module exists: enrollments lived only in the zustand `persist`
 * store. `academy_progress` rows and the `check_course_completion()` trigger
 * were writing the authoritative record, and nothing ever read it back — so a
 * learner who signed in on a second browser saw an empty Command Center while
 * their completion sat in the database, and `status`/`completed_at` had two
 * sources of truth (the trigger's and the browser's).
 *
 * Pure functions only: the store does the network calls, this decides what the
 * result means, which is what makes it testable without a database.
 */

/**
 * Map PostgREST enrollment rows plus their progress rows into store records.
 *
 * Every record carries `progress: []` even when the query returned none. The
 * UI calls `enrollment.progress.some(...)` on the first render, so a missing
 * array is a white screen, not an empty list.
 */
export function mapEnrollmentRows(rows, progressRows) {
  if (!Array.isArray(rows)) return [];

  const byEnrollment = new Map();
  if (Array.isArray(progressRows)) {
    for (const row of progressRows) {
      if (!row || row.is_completed !== true) continue;
      const key = row.enrollment_id;
      if (!key) continue;
      if (!byEnrollment.has(key)) byEnrollment.set(key, []);
      byEnrollment.get(key).push(row);
    }
  }

  return rows
    .filter((row) => row && row.id)
    .map((row) => ({ ...row, progress: byEnrollment.get(row.id) ?? [] }));
}

/**
 * Union of local and server enrollments, keyed by `id`.
 *
 * The server wins for any enrollment it knows about: `status`, `completed_at`
 * and `sbt_mint_status` are written by triggers and Edge Functions, and the
 * browser's copy of them is a guess. Enrollments only the browser knows about
 * are kept, because an enrollment upsert that has not replicated yet must not
 * disappear from under the learner.
 */
export function mergeEnrollments(local, remote) {
  const localList = Array.isArray(local) ? local : [];
  const remoteList = Array.isArray(remote) ? remote : [];
  if (remoteList.length === 0) return localList;

  const merged = new Map();
  for (const enrollment of localList) {
    if (enrollment?.id) merged.set(enrollment.id, { ...enrollment, progress: enrollment.progress ?? [] });
  }
  for (const enrollment of remoteList) {
    if (!enrollment?.id) continue;
    merged.set(enrollment.id, { ...enrollment, progress: enrollment.progress ?? [] });
  }
  return [...merged.values()];
}

/**
 * Distinct completed lessons in a progress list.
 *
 * `academy_progress` has a UNIQUE(enrollment_id, lesson_id) constraint, but the
 * local list is appended optimistically and used to be compared by `.length`,
 * so a duplicate appended twice counted as two lessons and could mark a course
 * complete early.
 */
export function countCompletedLessons(progress) {
  if (!Array.isArray(progress)) return 0;
  const seen = new Set();
  for (const row of progress) {
    if (row && row.is_completed && row.lesson_id) seen.add(row.lesson_id);
  }
  return seen.size;
}
