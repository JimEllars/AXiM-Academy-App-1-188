import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeQuizScore, scoreQuiz } from '../src/lib/quizScore.js';
import { buildProgressPayload } from '../src/lib/enrollmentPayload.js';

const QUIZ = [
  { question_text: 'q1', correct_answer: 'A' },
  { question_text: 'q2', correct_answer: 'B' },
  { question_text: 'q3', correct_answer: 'C' },
];

test('scoreQuiz measures first-attempt correctness', () => {
  const result = scoreQuiz(QUIZ, { 0: true, 1: false, 2: true });
  assert.equal(result.total, 3);
  assert.equal(result.correctFirstTry, 2);
  assert.equal(result.score, 67);
});

test('scoreQuiz reports 100 only when every question was right first time', () => {
  assert.equal(scoreQuiz(QUIZ, { 0: true, 1: true, 2: true }).score, 100);
  assert.equal(scoreQuiz(QUIZ, { 0: true, 1: true }).score, 67);
});

test('scoreQuiz reports 0 for a quiz answered wrongly throughout', () => {
  assert.equal(scoreQuiz(QUIZ, { 0: false, 1: false, 2: false }).score, 0);
});

test('scoreQuiz reports 0, not 100, when nothing was attempted', () => {
  // The regression: `updateProgress` wrote quiz_score: 100 for every lesson,
  // so an untouched quiz and a perfect quiz were indistinguishable in the row.
  assert.equal(scoreQuiz(QUIZ, {}).score, 0);
  assert.equal(scoreQuiz(QUIZ, null).score, 0);
  assert.equal(scoreQuiz(QUIZ, undefined).score, 0);
});

test('scoreQuiz returns no score for a lesson that has no questions', () => {
  const empty = scoreQuiz([], {});
  assert.equal(empty.score, null);
  assert.equal(empty.total, 0);
  assert.equal(scoreQuiz(null, null).score, null);
});

test('scoreQuiz ignores attempts for questions that are not in the quiz', () => {
  const result = scoreQuiz(QUIZ, { 0: true, 1: true, 2: true, 9: true });
  assert.equal(result.total, 3);
  assert.equal(result.score, 100);
});

test('normalizeQuizScore rejects a DOM event', () => {
  // `onClick={onComplete}` handed the click event to the score parameter. It
  // used to be dropped silently; once the score reaches the database it has to
  // be a number or nothing.
  const fakeEvent = { type: 'click', target: {}, preventDefault() {} };
  assert.equal(normalizeQuizScore(fakeEvent), null);
  assert.equal(normalizeQuizScore(undefined), null);
  assert.equal(normalizeQuizScore(null), null);
  assert.equal(normalizeQuizScore(NaN), null);
  assert.equal(normalizeQuizScore(Infinity), null);
  assert.equal(normalizeQuizScore(''), null);
});

test('normalizeQuizScore rounds and clamps to the 0-100 column range', () => {
  assert.equal(normalizeQuizScore(87.5), 88);
  assert.equal(normalizeQuizScore('67'), 67);
  assert.equal(normalizeQuizScore(-5), 0);
  assert.equal(normalizeQuizScore(140), 100);
  assert.equal(normalizeQuizScore(0), 0);
});

test('a lesson with no quiz sends no quiz_score at all', () => {
  const payload = buildProgressPayload({
    enrollmentId: 'e1',
    lessonId: 'l1',
    quizScore: normalizeQuizScore(undefined),
  });
  assert.equal('quiz_score' in payload, false);
  assert.equal(payload.is_completed, true);
});

test('a quiz lesson sends the measured score, not a constant', () => {
  const payload = buildProgressPayload({
    enrollmentId: 'e1',
    lessonId: 'l1',
    quizScore: normalizeQuizScore(scoreQuiz(QUIZ, { 0: true, 1: false, 2: true }).score),
  });
  assert.equal(payload.quiz_score, 67);
});
