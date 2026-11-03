# Changelog

All notable changes to AXiM Academy. Newest first.
Format: `## [wave] - YYYY-MM-DD`.

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
