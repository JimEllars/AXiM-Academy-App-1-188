/**
 * Quiz scoring — the number that goes into `academy_progress.quiz_score`.
 *
 * Why this module exists: `updateProgress` wrote `quiz_score: 100` for every
 * completed lesson, quiz or not. The column therefore recorded a *constant*
 * rather than a measurement: a learner who missed a question and retried, and a
 * learner who answered everything first time, produced the same row. Anything
 * downstream (gradebook, certificate claims, remediation) was reading a value
 * that had never been measured.
 *
 * The score is deliberately first-attempt based. `QuizEngine` lets a learner
 * retry until correct, so "did they eventually get it" is always yes; what is
 * worth recording is how many questions they got right the first time.
 *
 * Pure functions, no React, no DOM — `node --test` covers them.
 */

/**
 * Coerce anything the UI hands us into a score the NUMERIC(5,2) column accepts,
 * or `null` to mean "no score to report".
 *
 * The guard matters: a plain `onClick={handleComplete}` passes the click event
 * as the first argument. That used to be harmless because the value was dropped
 * on the way to the store; now that it reaches the database, an event object
 * would produce `quiz_score: [object Object]` and PostgREST would reject the
 * whole progress row.
 */
export function normalizeQuizScore(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return clamp(Math.round(value));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return null;
    return clamp(Math.round(parsed));
  }
  return null;
}

function clamp(value) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

/**
 * Score a completed quiz.
 *
 * @param {Array<object>} quizData  the questions, in order
 * @param {Record<number, boolean>|null} firstAttempts
 *        question index -> was the first submitted answer correct
 * @returns {{score: number|null, total: number, correctFirstTry: number}}
 *          `score` is null when the lesson has no questions to score, which is
 *          different from 0 (a quiz that was failed).
 */
export function scoreQuiz(quizData, firstAttempts) {
  const total = Array.isArray(quizData) ? quizData.length : 0;
  if (total === 0) return { score: null, total: 0, correctFirstTry: 0 };

  const attempts = firstAttempts && typeof firstAttempts === 'object' ? firstAttempts : {};
  let correctFirstTry = 0;
  for (let index = 0; index < total; index += 1) {
    if (attempts[index] === true) correctFirstTry += 1;
  }

  return {
    score: Math.round((correctFirstTry / total) * 100),
    total,
    correctFirstTry,
  };
}

/**
 * Record the first submission for a question without letting a retry overwrite
 * it. Returns a new map so React state updates stay immutable.
 */
export function recordFirstAttempt(firstAttempts, questionIndex, wasCorrect) {
  const attempts = firstAttempts && typeof firstAttempts === 'object' ? firstAttempts : {};
  if (Object.prototype.hasOwnProperty.call(attempts, questionIndex)) return attempts;
  return { ...attempts, [questionIndex]: wasCorrect === true };
}
