/**
 * Course rows — turning `academy_courses` (plus its modules and lessons) into
 * the shape the storefront and the classroom actually render.
 *
 * Why this module exists: the catalog came from `MOCK_COURSES` for the whole
 * build, and the seed already used the *UI* names (`thumbnail`,
 * `long_description`, `price_crypto`, `lesson.type`). The database uses
 * different ones (`thumbnail_url`, no long description, no crypto price,
 * `lesson.content_type`). `fetchCourses` spread the raw row and only bolted
 * `is_approved` and `modules` on, so every DB-served course reached the UI with
 * those fields missing:
 *
 *   - `thumbnail` was undefined, so every card and hero rendered a broken image;
 *   - `long_description` was undefined, so "About this Curriculum" was blank;
 *   - `difficulty` and `duration` were undefined, so the card showed an empty
 *     badge and a dangling "•";
 *   - `price_crypto` does not exist in the schema at all, so checkout printed
 *     "≈ ETH" with no number;
 *   - lessons carry `content_type` (`video` | `article` | `interactive_quiz`)
 *     and the classroom switches on `type`. Nothing matched, so every lesson —
 *     including a plain article — fell through to the quiz renderer and showed
 *     an empty `QuizEngine`.
 *
 * Wave 5 removed two of these crash sites one at a time (`price_usd.toFixed`,
 * a null `description`). This module finishes the mapping in one place, so the
 * UI never has to know which storage shape it is looking at.
 *
 * Rules:
 *   - Pure. No network, no React, no `import.meta.env` — that is what makes it
 *     testable with `node --test` and no database.
 *   - Pass through unknown columns (a course row is also edited by admin tools)
 *     and only overwrite the fields the UI reads.
 *   - Never invent a value. A missing ETH price stays null rather than being
 *     converted at a made-up rate; the checkout pre-flight already refuses an
 *     unusable price with a sentence instead of a spinner (`cryptoPayment.js`).
 */

/**
 * Postgres `academy_lessons.content_type` → the lesson type the UI switches on.
 *
 * `quiz` is in here as well as `interactive_quiz` because an already-normalized
 * course (the seed, or a second pass over a fetched row) carries the UI name —
 * without the identity entries a re-run would demote a quiz to an article.
 */
const CONTENT_TYPE_TO_LESSON_TYPE = {
  video: 'video',
  article: 'article',
  interactive_quiz: 'quiz',
  quiz: 'quiz',
  live: 'live',
};

/** Anything we cannot classify is treated as reading material, never a quiz. */
export const DEFAULT_LESSON_TYPE = 'article';

/** Trimmed string, or `fallback` when the value is null/undefined/empty. */
function textOr(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

/** A non-negative finite number, or `fallback`. PostgREST returns NUMERIC as a string. */
export function toPriceNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return number;
}

/**
 * The ETH price as a string, or null.
 *
 * Deliberately not derived from `price_usd`: an FX rate is not in the database,
 * and a price computed from a hard-coded rate is a number the treasury did not
 * quote. `null` renders as "not offered" and blocks the crypto path with a
 * reason.
 */
export function normalizePriceCrypto(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return String(value).trim();
}

/** Lessons arrive newest-first from PostgREST when no order is pushed down. */
function sortByOrderIndex(rows) {
  if (!Array.isArray(rows)) return [];
  return [...rows].sort((a, b) => {
    const left = Number(a?.order_index);
    const right = Number(b?.order_index);
    if (!Number.isFinite(left) && !Number.isFinite(right)) return 0;
    if (!Number.isFinite(left)) return 1;
    if (!Number.isFinite(right)) return -1;
    return left - right;
  });
}

/**
 * One lesson row → the shape `InteractiveClassroom`, `CourseDetails` and
 * `CurriculumEditor` switch on.
 *
 * `content_payload` is the JSONB column Onyx-generated content lands in; the
 * video URL, the article body and the quiz questions all live inside it.
 */
export function normalizeLessonRow(row, index = 0) {
  if (!row) return null;
  const payload = row.content_payload && typeof row.content_payload === 'object'
    ? row.content_payload
    : {};

  const rawType = row.type ?? row.content_type ?? null;
  const type = CONTENT_TYPE_TO_LESSON_TYPE[textOr(rawType).toLowerCase()] ?? DEFAULT_LESSON_TYPE;

  return {
    ...row,
    id: row.id ?? `lesson-${index}`,
    title: textOr(row.title, 'Untitled lesson'),
    type,
    content_type: textOr(row.content_type, type === 'quiz' ? 'interactive_quiz' : type),
    order_index: Number.isFinite(Number(row.order_index)) ? Number(row.order_index) : index,
    duration: row.duration ? textOr(row.duration) : null,
    videoUrl: row.videoUrl ?? payload.video_url ?? payload.videoUrl ?? null,
    content: row.content ?? payload.content ?? payload.html ?? '',
    // An article with no body must not render `undefined` inside the prose
    // wrapper; an empty string is honest, the heading still shows the title.
    quizData: Array.isArray(row.quizData)
      ? row.quizData
      : Array.isArray(payload.quiz)
        ? payload.quiz
        : Array.isArray(payload.quiz_data)
          ? payload.quiz_data
          : [],
  };
}

/** One module row → `{ id, title, order_index, lessons: [] }`. */
export function normalizeModuleRow(row, index = 0) {
  if (!row) return null;
  const lessons = sortByOrderIndex(row.lessons ?? row.academy_lessons ?? [])
    .map((lesson, lessonIndex) => normalizeLessonRow(lesson, lessonIndex))
    .filter(Boolean);

  return {
    ...row,
    id: row.id ?? `module-${index}`,
    title: textOr(row.title, `Module ${index + 1}`),
    order_index: Number.isFinite(Number(row.order_index)) ? Number(row.order_index) : index,
    lessons,
    // The nested relation is consumed above. Leaving it on the object gives the
    // UI a second, un-normalized source of the same lessons.
    academy_lessons: undefined,
  };
}

/**
 * One `academy_courses` row (optionally with `academy_modules` embedded) → the
 * course object the UI renders.
 *
 * Idempotent: running a `MOCK_COURSES` entry through it is a no-op apart from
 * the numeric coercion, so the seeded catalog and the database catalog take the
 * same path and a bug cannot hide in one of them.
 */
export function normalizeCourseRow(row) {
  if (!row) return null;

  const description = textOr(row.description);
  const modules = sortByOrderIndex(row.modules ?? row.academy_modules ?? [])
    .map((module, index) => normalizeModuleRow(module, index))
    .filter(Boolean);

  // `is_approved` is a storefront concept: only approved courses are listed.
  // The database expresses the same thing as `visibility`.
  const visibility = textOr(row.visibility, 'public').toLowerCase();
  const isApproved = typeof row.is_approved === 'boolean'
    ? row.is_approved
    : visibility === 'public' || visibility === 'unlisted';

  return {
    ...row,
    id: row.id,
    title: textOr(row.title, 'Untitled Curriculum'),
    description,
    long_description: textOr(row.long_description, description),
    thumbnail: textOr(row.thumbnail ?? row.thumbnail_url, ''),
    price_usd: toPriceNumber(row.price_usd, 0),
    price_crypto: normalizePriceCrypto(row.price_crypto),
    category: row.category ? textOr(row.category) : null,
    difficulty: row.difficulty ? textOr(row.difficulty) : null,
    duration: row.duration ? textOr(row.duration) : null,
    is_approved: isApproved,
    visibility,
    badge: row.badge ?? null,
    resources: Array.isArray(row.resources) ? row.resources : [],
    modules,
    // Same reasoning as `academy_lessons`: `modules` is now the single shape.
    academy_modules: undefined,
  };
}

/** Filter helper: the API can return `null` rows, and one must not blank the grid. */
export function normalizeCourseRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => normalizeCourseRow(row)).filter(Boolean);
}

/** Every lesson in a course, flattened. Safe on a course with no modules. */
export function flattenLessons(course) {
  if (!Array.isArray(course?.modules)) return [];
  return course.modules.flatMap((module) => (Array.isArray(module?.lessons) ? module.lessons : []));
}
