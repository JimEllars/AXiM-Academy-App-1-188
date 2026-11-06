import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_LESSON_TYPE,
  flattenLessons,
  normalizeCourseRow,
  normalizeCourseRows,
  normalizeLessonRow,
  normalizeModuleRow,
  normalizePriceCrypto,
  toPriceNumber,
} from '../src/lib/courseRow.js';

/** A row exactly as PostgREST returns it: NUMERIC as a string, no UI aliases. */
const DB_COURSE = {
  id: '2f1c4f0e-9b1a-4a6e-8a3d-0f9c1b7e5d21',
  title: 'Relay Synchronisation',
  description: 'Short blurb.',
  visibility: 'public',
  price_usd: '299.00',
  thumbnail_url: 'https://cdn.example.com/relay.jpg',
  category: 'Hardware',
  created_at: '2026-10-01T00:00:00.000Z',
  academy_modules: [
    {
      id: 'mod-b',
      title: 'Synchronisation',
      order_index: 2,
      academy_lessons: [
        { id: 'les-3', title: 'Final Check', content_type: 'interactive_quiz', order_index: 1, content_payload: null },
      ],
    },
    {
      id: 'mod-a',
      title: 'Physical Layer',
      order_index: 1,
      academy_lessons: [
        {
          id: 'les-1',
          title: 'Mounting',
          content_type: 'video',
          order_index: 1,
          content_payload: { video_url: 'https://video.example.com/mounting' },
        },
        {
          id: 'les-2',
          title: 'Grounding',
          content_type: 'article',
          order_index: 2,
          content_payload: { content: '<p>Bond the chassis.</p>' },
        },
      ],
    },
  ],
};

/** The seeded catalog entry: already in UI shape, kept as the no-op reference. */
const MOCK_COURSE = {
  id: 'course-1',
  title: 'Hardware Link Installation Protocol',
  category: 'Hardware',
  difficulty: 'Advanced',
  duration: '4.5 Hours',
  is_approved: true,
  price_usd: 299,
  price_crypto: '0.08',
  description: 'Master the deployment of AXiM Core relay hardware.',
  long_description: 'Covers the physical and logical layers.',
  thumbnail: 'https://images.example.com/hw.jpg',
  badge: { id: 'badge-1', name: 'Relay Architect' },
  resources: [{ id: 'r1', title: 'Schematic', type: 'pdf' }],
  modules: [
    {
      id: 'm1',
      title: 'Physical Layer Integration',
      lessons: [{ id: 'l1', title: 'Relay Chassis Mounting', type: 'video', videoUrl: 'https://youtu.be/x' }],
    },
  ],
};

test('a database course row is mapped to the fields the UI reads', () => {
  const course = normalizeCourseRow(DB_COURSE);

  // thumbnail_url -> thumbnail, or every card renders a broken image
  assert.equal(course.thumbnail, 'https://cdn.example.com/relay.jpg');
  // NUMERIC arrives as a string; the catalog prints it and checkout does maths on it
  assert.equal(course.price_usd, 299);
  assert.equal(typeof course.price_usd, 'number');
  // no crypto price column exists in the schema
  assert.equal(course.price_crypto, null);
  // not stored: null, never a fabricated label
  assert.equal(course.difficulty, null);
  assert.equal(course.duration, null);
  // visibility public -> listed
  assert.equal(course.is_approved, true);
  assert.equal(course.category, 'Hardware');
  // unknown column survives the map
  assert.equal(course.created_at, '2026-10-01T00:00:00.000Z');
});

test('a course with no long description falls back to its description', () => {
  const course = normalizeCourseRow(DB_COURSE);
  assert.equal(course.long_description, 'Short blurb.');
});

test('a null description does not throw and does not print undefined', () => {
  const course = normalizeCourseRow({ ...DB_COURSE, description: null });
  assert.equal(course.description, '');
  assert.equal(course.long_description, '');
});

test('an unlisted course is still listed, an archived one is not', () => {
  assert.equal(normalizeCourseRow({ ...DB_COURSE, visibility: 'unlisted' }).is_approved, true);
  assert.equal(normalizeCourseRow({ ...DB_COURSE, visibility: 'archived' }).is_approved, false);
  // an explicit flag wins (admin tools and the seed set it)
  assert.equal(normalizeCourseRow({ ...DB_COURSE, visibility: 'archived', is_approved: true }).is_approved, true);
});

test('modules and lessons come out ordered, with the nested relation removed', () => {
  const course = normalizeCourseRow(DB_COURSE);

  assert.deepEqual(course.modules.map((m) => m.id), ['mod-a', 'mod-b']);
  assert.deepEqual(course.modules[0].lessons.map((l) => l.id), ['les-1', 'les-2']);
  assert.equal(course.academy_modules, undefined);
  assert.equal(course.modules[0].academy_lessons, undefined);
});

test('content_type decides what the classroom renders', () => {
  const lesson = (content_type) => normalizeLessonRow({ id: 'l', title: 't', content_type });

  assert.equal(lesson('video').type, 'video');
  assert.equal(lesson('article').type, 'article');
  assert.equal(lesson('interactive_quiz').type, 'quiz');
  // an unrecognised type must not fall through to the quiz renderer
  assert.equal(lesson('podcast').type, DEFAULT_LESSON_TYPE);
  assert.equal(lesson(null).type, DEFAULT_LESSON_TYPE);
});

test('content_payload fills the lesson body, video URL and quiz', () => {
  const video = normalizeLessonRow({
    id: 'l1',
    content_type: 'video',
    content_payload: { video_url: 'https://video.example.com/mounting' },
  });
  assert.equal(video.videoUrl, 'https://video.example.com/mounting');

  const article = normalizeLessonRow({
    id: 'l2',
    content_type: 'article',
    content_payload: { content: '<p>Bond the chassis.</p>' },
  });
  assert.equal(article.content, '<p>Bond the chassis.</p>');

  const quiz = normalizeLessonRow({
    id: 'l3',
    content_type: 'interactive_quiz',
    content_payload: { quiz: [{ question_text: 'Q1', correct_answer: 'A' }] },
  });
  assert.equal(quiz.quizData.length, 1);
  assert.equal(quiz.quizData[0].question_text, 'Q1');
});

test('a lesson with no payload gets empty defaults, not undefined', () => {
  const lesson = normalizeLessonRow({ id: 'l4', title: 'Nothing here', content_type: 'article' });
  assert.equal(lesson.content, '');
  assert.equal(lesson.videoUrl, null);
  assert.deepEqual(lesson.quizData, []);
  assert.equal(lesson.title, 'Nothing here');
});

test('normalizing the seeded catalog is a no-op', () => {
  const course = normalizeCourseRow(MOCK_COURSE);

  assert.equal(course.thumbnail, MOCK_COURSE.thumbnail);
  assert.equal(course.price_crypto, '0.08');
  assert.equal(course.long_description, MOCK_COURSE.long_description);
  assert.equal(course.difficulty, 'Advanced');
  assert.equal(course.duration, '4.5 Hours');
  assert.equal(course.is_approved, true);
  assert.deepEqual(course.badge, MOCK_COURSE.badge);
  assert.deepEqual(course.resources, MOCK_COURSE.resources);
  assert.deepEqual(course.modules.map((m) => m.id), ['m1']);
  // lessons already in UI shape keep their type
  assert.equal(course.modules[0].lessons[0].type, 'video');
  assert.equal(course.modules[0].lessons[0].videoUrl, 'https://youtu.be/x');
});

test('normalizing twice gives the same object', () => {
  const once = normalizeCourseRow(DB_COURSE);
  const twice = normalizeCourseRow(once);
  assert.deepEqual(twice, once);
});

test('a course with no modules yields an empty array, not undefined', () => {
  const course = normalizeCourseRow({ id: 'c', title: 'Bare', price_usd: 0 });
  assert.deepEqual(course.modules, []);
  assert.deepEqual(flattenLessons(course), []);
});

test('normalizeCourseRows survives null input and null rows', () => {
  assert.deepEqual(normalizeCourseRows(null), []);
  assert.deepEqual(normalizeCourseRows(undefined), []);
  assert.equal(normalizeCourseRows([DB_COURSE, null, undefined]).length, 1);
  assert.equal(normalizeCourseRow(null), null);
  assert.equal(normalizeModuleRow(null), null);
  assert.equal(normalizeLessonRow(null), null);
});

test('toPriceNumber coerces PostgREST strings and refuses nonsense', () => {
  assert.equal(toPriceNumber('299.00'), 299);
  assert.equal(toPriceNumber('0.00'), 0);
  assert.equal(toPriceNumber(0), 0);
  assert.equal(toPriceNumber(null), 0);
  assert.equal(toPriceNumber(undefined), 0);
  assert.equal(toPriceNumber(''), 0);
  assert.equal(toPriceNumber('free'), 0);
  assert.equal(toPriceNumber(-5), 0);
  assert.equal(toPriceNumber(Infinity), 0);
});

test('normalizePriceCrypto keeps a real quote and rejects everything else', () => {
  assert.equal(normalizePriceCrypto('0.08'), '0.08');
  assert.equal(normalizePriceCrypto(0.08), '0.08');
  assert.equal(normalizePriceCrypto('0'), '0');
  assert.equal(normalizePriceCrypto(null), null);
  assert.equal(normalizePriceCrypto(undefined), null);
  assert.equal(normalizePriceCrypto(''), null);
  assert.equal(normalizePriceCrypto('cheap'), null);
  assert.equal(normalizePriceCrypto(-1), null);
});

test('a module falls back to a positional title and coerces order_index', () => {
  const module = normalizeModuleRow({ id: 'm', academy_lessons: [] }, 2);
  assert.equal(module.title, 'Module 3');
  assert.equal(module.order_index, 2);
  assert.deepEqual(module.lessons, []);
});
