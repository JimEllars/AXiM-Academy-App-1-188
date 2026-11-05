# Changelog

All notable changes to AXiM Academy. Newest first.
Format: `## [wave] - YYYY-MM-DD`.

## [Wave 5] - 2026-11-05

Harden the checkout and storefront search against the real, database-backed
course shape — the paths that only run once Supabase is configured and the
catalog stops coming from the local seed.

### Fixed

- **Checkout crashed on a live catalog.** PostgREST hands `academy_courses.price_usd`
  (NUMERIC) back as a string, so the fiat selector's `course.price_usd.toFixed(0)`
  threw `price_usd.toFixed is not a function` the moment a DB-served course reached
  the payment step. The three display sites now coerce with
  `Number(course.price_usd ?? 0).toFixed(0)`.
- **A NULL course description blanked the storefront.** `academy_courses.description`
  is nullable and the search filter dereferenced `.toLowerCase()` unguarded, so a
  DB row without a description threw as soon as a learner typed in the search box.
  `CourseGrid` now falls back to an empty string.

### Changed

- Merged Dependabot `@supabase/supabase-js` 2.110.2 → 2.118.0 (PR #47) after its
  CI passed green. Queue 23 → 22; the failing runtime majors stay open on purpose.

## [Wave 4] - 2026-11-04

`quiz_score` becomes a measurement, and the enrollment ledger is read back from
the database instead of being assumed.

### Added

- `src/lib/quizScore.js` — `scoreQuiz()` counts first-attempt correctness (the
  quiz lets a learner retry until right, so "eventually correct" says nothing),
  `normalizeQuizScore()` coerces whatever the UI hands over into a value the
  `NUMERIC(5,2)` column accepts or `null`, and `recordFirstAttempt()` keeps the
  first answer for a question without letting a retry overwrite it.
- `src/lib/enrollmentState.js` — `mapEnrollmentRows()` turns
  `academy_enrollments` + `academy_progress` rows into store records (always
  with a `progress` array), `mergeEnrollments()` unions local and server state
  with the server winning, `countCompletedLessons()` counts distinct lessons.
- `src/lib/revenue.js` — `buildRevenueRecord()` returns `null` for an internal
  grant, a course with no partner share, or a non-positive price, and otherwise
  a rounded split marked `settled: false`.
- `useAcademyStore().fetchEnrollments()` — reads the learner's ledger and
  progress rows for the signed-in uuid and merges them in, additively. Wired
  into `StudentDashboard`.
- `tests/quizScore.test.js` (10 tests), `tests/enrollmentState.test.js`
  (11 tests) and `tests/revenue.test.js` (8 tests).
- `supabase/migrations/20261104000000_academy_course_category_check.sql` —
  normalises drifted `academy_courses.category` values to the canonical six
  tracks and adds a CHECK constraint plus a `(category, visibility)` index.

### Fixed

- **`quiz_score` was the constant 100.** `updateProgress` passed
  `quizScore: 100` for every completed lesson, quiz or not; `Learn` dropped the
  score `InteractiveClassroom` passed it; `QuizEngine` sent a literal `100`. The
  column could not distinguish a failed quiz from a perfect one. The score is
  now measured on first attempts, threaded through all three layers, and omitted
  entirely for a lesson that has no quiz.
- **A 100 % internal grant wrote a full-price partner earning.** Every
  enrollment built an `earnings` row from `course.price_usd`, so the enrolment
  path that exists so staff and contractors pay nothing added a completed sale
  to `partners`, `getPartnerStats()` and the admin financial panel. `internal_grant
  enrollments now record no revenue at all, and every row is marked
  `settled: false` because nothing pays out yet.
- **A click event could become a score.** Video, live and article lessons called
  `handleComplete` straight off `onClick`, so the parameter was a
  `SyntheticEvent`. Harmless only because the value was being discarded — with
  the score wired through it would have written an object into `quiz_score`.
- **The completion screen appeared before the write was confirmed.**
  `handleComplete` did not await `onProgress`, so a rejected `academy_progress`
  row still rendered "Certification Complete … logged on the AXiM Ledger". It
  now awaits and shows the failure instead.
- **Course completion could fire a lesson early.** The check compared
  `newProgress.length` to the lesson count, so a lesson re-appended to the local
  array counted twice. It now counts distinct lesson ids on both the client and
  the progress bar.
- Enrollments were never read back from the database, so the
  `check_course_completion()` trigger wrote `status` / `completed_at` that
  nothing displayed, and a learner on a second browser saw an empty Command
  Center while their enrollment sat in the ledger.
- `enrollment.progress` was dereferenced without a null guard in
  `InteractiveClassroom` and in `updateProgress`; a record that arrived from the
  database without the client-side array was a crash.
- A quiz lesson with no `quizData` crashed on `questions[0].question_text`. It
  now completes as an unscored lesson.
- `OnyxAssistant` accepted a `lessonTitle` prop that was never passed, so the
  tutor had no per-lesson context beyond the course title.
- Merged the two workflow-only Dependabot PRs (#35 `actions/checkout` 4 → 7,
  #36 `actions/setup-node` 4 → 7) after both CI runs passed. Queue: 22 → 20.

### Note

The category CHECK migration has **not** been executed against a database. See
`AGENTS_VERIFICATION.md` for what that means for the claim.

## [Wave 3] - 2026-11-03

Crypto checkout stops lying, the track filter moves into the URL, and a
certificate is only readable by its holder.

### Added

- `src/lib/cryptoPayment.js` — pre-flight for a real Arbitrum One transfer:
  treasury address from `VITE_ACADEMY_TREASURY_ADDRESS`, chain check, amount
  after discount truncated to micro-ETH, and a `tx_hash` extractor that accepts
  only a 32-byte hash. `describeWalletError()` turns provider noise into one
  sentence.
- `tests/cryptoPayment.test.js` — 12 tests, including one that feeds the old
  simulated hash into the extractor and asserts it is rejected.
- `.github/dependabot.yml` — `vite` majors held back with the peer-dependency
  reason written down; minor and patch updates still flow.

### Fixed

- **Crypto checkout never took a payment.** It awaited three timers, generated
  `'0x' + Math.random().toString(16).slice(2)`, wrote that into
  `academy_enrollments.tx_hash` and enrolled the learner. Free access with a
  fabricated on-chain receipt. The path is now a real
  `sdk.wallet.transfer()` to the treasury on Arbitrum One; a missing treasury,
  wrong chain, missing wallet or invalid hash refuses with the reason on screen.
- The ETH price quoted on the crypto button was computed inline and could
  disagree with the amount actually paid. Both now use `effectiveEthAmount()`.
- Track chips set the store filter without touching the URL: the filtered
  catalog was not shareable and the filter vanished on the next mount. Chips now
  navigate to `/?category=<slug>` and every catalog link keeps the captured
  `?ref=`.
- `CertificatePage` had no ownership check — a `/certificate/<id>` link rendered
  whichever enrollment the store held. It now redirects unless the enrollment
  belongs to the viewer.
- `CertificateViewer` showed a random 3–5 s "Minting..." spinner before the
  print button. Removed; the certificate renders immediately.

### Operator action

Set `VITE_ACADEMY_TREASURY_ADDRESS` (Arbitrum One) before enabling crypto
checkout. Without it the button refuses, by design.

## [Wave 2] - 2026-11-02

Track filtering, affiliate attribution, a credential pipeline that is real at
both ends, and CI that can actually fail.

### Added

- `src/lib/track.js` — canonical Ladder of Value tracks (`Foundation`,
  `Creative Labs`, `Professional Edge`, plus the existing `Hardware`, `AI`,
  `Protocol`). `?category=` and `?track=` normalize to the same filter, slugs and
  DB labels compare equal, and `buildCatalogHref()` produces links that survive a
  round trip.
- `src/lib/affiliate.js` + `src/hooks/useAffiliateCapture.js` — `?ref=` /
  `?aff=` / `?affiliate=` captured once at the app shell into sessionStorage
  with a 30-day attribution window and an allow-list for id characters.
- `src/lib/credentialHash.js` — SHA-256 digest over the canonical credential
  fields. Printed on the certificate, accepted by `/verify/:hash`.
- `src/lib/enrollmentPayload.js` — the only place that maps checkout intent to
  `academy_enrollments` columns.
- `src/lib/onyx.js` — Onyx summon client for
  `https://onyx-edge.axim.us.com/api/v1/onyx/summon` with
  `domain_context: "academy"`, timeouts, and typed errors.
- `src/lib/sbt.js` — Arbitrum One SBT contract config, ABI, and mint pre-flight.
- `src/lib/runtimeConfig.js` — placeholder-credential detection.
- `.github/workflows/ci.yml` — lint + test + build on every PR and push to main.
- `tests/` — 61 tests over the real modules (`npm test`, Node built-in runner).
- `supabase/migrations/20261102000000_academy_affiliate_credentials_rls.sql` —
  enrollment columns, RLS, column grants, promo validation RPC, unlisted-course
  policy. **Authored, not executed** (see AGENTS_VERIFICATION.md).

### Fixed

- Enrollment writes failed on every attempt: the code sent `payment_method` and
  `tx_hash`, which are not columns on `academy_enrollments`.
- Enrollment writes were also blocked by RLS — `academy_enrollments` had no
  INSERT policy — and by a `user_id` that was never a uuid (`'anon'`,
  `usr-<timestamp>`, or a wallet address).
- `academy_promo_codes` had RLS disabled entirely: every promo code, including
  the 100% internal grants, was readable with the public anon key.
- Fiat checkout enrolled the learner *before* Stripe: access was granted whether
  or not payment completed. Session is now created first.
- The certificate printed a hash (`AXM-VER-8821`) that the verification page
  could never resolve. Certificate and verification now share one SHA-256 digest.
- Certificate issue date used `new Date()`, making the hash change on every
  render; it now derives from `completed_at` (then `created_at`).
- `#/partner-apply`, `#/dashboard` and `#/certificate/...` were set on
  `window.location.hash` under a `BrowserRouter`, so those buttons did nothing.
- The catalog filter stuck after leaving and returning to `/`.
- SBT minting was a three-second timer behind a spinner; it is now a contract
  write that refuses loudly when it cannot run.
- Onyx AI answered from a hard-coded string with a `mockSignature` in telemetry.

### Changed

- Promotion validation goes through `academy_validate_promo()` instead of a
  direct table read (table read retained as a fallback until the migration is
  applied).
- `enrollInCourse(courseId, options)` takes an options object; the positional
  `(courseId, 'crypto', txHash)` form still works.
- `updateProgress` skips the network entirely when Supabase is not configured,
  instead of failing the learner's lesson completion.

## [Sprint 11] - 2026-10-21

- Live checkout routing and enrollment persistence (PR #26).
- Live PostgREST integration, universal promo router, category URL handling
  (PR #25).
- Admin telemetry, double-submission guards, edge API constants (PR #9).
- Storefront layout hardening and prefetch signals (PR #5).
