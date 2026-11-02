/**
 * Enrollment payload builder — the single place that maps UI intent onto real
 * `public.academy_enrollments` columns.
 *
 * Why this module exists: the checkout path was writing `payment_method` and
 * `tx_hash`, neither of which is a column on that table. PostgREST answers an
 * unknown column with 204 (PGRST204), so every live enrollment failed and the
 * learner only saw a generic "Transaction Failed" toast. The mapping now lives
 * here, next to a test that asserts every emitted key is a real column.
 *
 * See supabase/migrations/20261102000000_academy_affiliate_credentials_rls.sql
 * for the columns added in this wave (affiliate_id, certificate_hash,
 * payment_method, tx_hash).
 */

/** Columns that exist on `academy_enrollments` after the 2026-11-02 migration. */
export const ENROLLMENT_COLUMNS = [
  'user_id',
  'course_id',
  'status',
  'payment_method',
  'tx_hash',
  'stripe_payment_intent',
  'web3_wallet_address',
  'applied_promo_code',
  'affiliate_id',
];

/** Minimal RFC 4122 check. `auth.users.id` is a uuid column; 'anon' is not. */
export function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
  );
}

export const PAYMENT_METHODS = ['fiat', 'crypto', 'internal_grant'];

/**
 * Build the row we upsert at checkout.
 *
 * @param {object} input
 * @param {string} input.userId        authenticated learner id (uuid required)
 * @param {string} input.courseId      course uuid (or seeded mock id in demo mode)
 * @param {'fiat'|'crypto'|'internal_grant'} [input.paymentMethod]
 * @param {string|null} [input.txHash] on-chain transaction hash (crypto only)
 * @param {string|null} [input.stripeIntent] Stripe payment intent id (fiat only)
 * @param {string|null} [input.walletAddress] connected wallet, so the DB
 *        completion trigger knows the learner can hold an SBT
 * @param {string|null} [input.promoCode] redeemed code, for revenue split
 * @param {string|null} [input.affiliateId] captured `?ref=` id
 * @param {string} [input.status]
 * @throws {EnrollmentPayloadError} when the payload cannot be persisted
 */
export function buildEnrollmentPayload({
  userId,
  courseId,
  paymentMethod = 'fiat',
  txHash = null,
  stripeIntent = null,
  walletAddress = null,
  promoCode = null,
  affiliateId = null,
  status = 'active',
} = {}) {
  if (!courseId) {
    throw new EnrollmentPayloadError('MISSING_COURSE', 'courseId is required');
  }
  if (!isUuid(userId)) {
    throw new EnrollmentPayloadError(
      'INVALID_USER',
      'A signed-in learner (uuid user id) is required to enroll',
    );
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw new EnrollmentPayloadError(
      'INVALID_PAYMENT_METHOD',
      `Unsupported payment method: ${paymentMethod}`,
    );
  }

  const payload = {
    user_id: userId.trim().toLowerCase(),
    course_id: courseId,
    status,
    payment_method: paymentMethod,
  };

  if (txHash) {
    payload.tx_hash = String(txHash).trim();
  }
  if (stripeIntent) {
    payload.stripe_payment_intent = String(stripeIntent).trim();
  }
  // The completion trigger promotes sbt_mint_status to 'pending' only when a
  // wallet is on the row; without it the learner gets the PDF credential only.
  if (walletAddress) {
    payload.web3_wallet_address = String(walletAddress).trim();
  }
  if (promoCode) {
    payload.applied_promo_code = String(promoCode).trim().toUpperCase();
  }
  if (affiliateId) {
    payload.affiliate_id = String(affiliateId).trim();
  }

  return payload;
}

export class EnrollmentPayloadError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'EnrollmentPayloadError';
    this.code = code;
  }
}

/**
 * True when PostgREST rejected the write because a column is missing
 * (PGRST204 / 42703). Lets the store retry without the newest columns so an
 * un-migrated database still accepts enrollments instead of blocking checkout.
 */
export function isUnknownColumnError(error) {
  if (!error) return false;
  const code = String(error.code ?? '');
  const message = String(error.message ?? '').toLowerCase();
  if (code === 'PGRST204' || code === '42703') return true;
  return message.includes('could not find the') || message.includes('column') && message.includes('does not exist');
}

/**
 * Drop columns that the live database rejected, in reverse order of importance,
 * so a retry can succeed against a schema that predates the migration.
 */
export function stripOptionalColumns(payload) {
  const optional = ['affiliate_id', 'tx_hash', 'payment_method', 'stripe_payment_intent'];
  const next = { ...payload };
  for (const key of optional) {
    if (key in next) {
      delete next[key];
      break;
    }
  }
  return next;
}

/** Progress row for `academy_progress`. */
export function buildProgressPayload({ enrollmentId, lessonId, quizScore = null, completedAt = null }) {
  if (!enrollmentId || !lessonId) {
    throw new EnrollmentPayloadError('MISSING_IDS', 'enrollmentId and lessonId are required');
  }
  const payload = {
    enrollment_id: enrollmentId,
    lesson_id: lessonId,
    is_completed: true,
  };
  if (quizScore !== null && quizScore !== undefined) payload.quiz_score = quizScore;
  payload.completed_at = completedAt ?? new Date().toISOString();
  return payload;
}
