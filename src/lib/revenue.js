/**
 * Revenue records — the local ledger row written when a learner enrolls.
 *
 * Why this module exists: `enrollInCourse` built the partner/platform split
 * inline from `course.price_usd` for *every* enrollment, including the 100 %
 * internal grant that exists precisely so staff and contractors do not pay. A
 * free enrollment therefore added a full-price "partner earning" to
 * `partners`, `getPartnerStats()` and the admin financial panel. With the
 * unified storefront (one catalogue, one checkout, promo codes for internal
 * staff) that is the difference between a P&L and a wish.
 *
 * It is also explicit that nothing here is *settled*: no payout exists yet, so
 * every row says so rather than leaving a consumer to assume otherwise.
 *
 * Pure functions only.
 */

export const DEFAULT_PARTNER_SHARE = 75;
export const REVENUE_CURRENCY = 'USD';

function round2(value) {
  return Math.round(value * 100) / 100;
}

function clampShare(value) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

/**
 * Build the ledger row for one enrollment, or `null` when there is no sale to
 * record.
 *
 * No record is produced for:
 *   - an internal grant (`paymentMethod === 'internal_grant'`) — nothing was paid;
 *   - a course with no instructor share;
 *   - a zero, negative or non-numeric price;
 * so a lookup that finds `null` means "no revenue", not "revenue of zero".
 *
 * Caveat worth keeping in view: `price_usd` is the *list* price. A crypto
 * enrollment is recorded at its USD list value, not at the ETH that actually
 * arrived, and nothing has verified either against the treasury yet. That
 * reconciliation is still P2.5 in the plan.
 */
export function buildRevenueRecord({
  course,
  paymentMethod = 'fiat',
  id = null,
  now = new Date(),
} = {}) {
  if (!course?.instructor_id) return null;
  if (paymentMethod === 'internal_grant') return null;

  const gross = Number(course.price_usd);
  if (!Number.isFinite(gross) || gross <= 0) return null;

  const rawShare = Number(course.revenue_share);
  const partnerShare = clampShare(
    Number.isFinite(rawShare) ? rawShare : DEFAULT_PARTNER_SHARE,
  );

  return {
    id: id ?? `earn-${now.getTime()}`,
    course_id: course.id ?? null,
    partner_id: course.instructor_id,
    payment_method: paymentMethod,
    gross_amount: round2(gross),
    partner_share: partnerShare,
    amount: round2(gross * (partnerShare / 100)),
    platform_amount: round2(gross * (1 - partnerShare / 100)),
    currency: REVENUE_CURRENCY,
    settled: false,
    timestamp: now.toISOString(),
  };
}
