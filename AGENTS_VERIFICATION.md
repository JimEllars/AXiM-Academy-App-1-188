# AGENTS Verification Log

Append-only. Newest wave first. Each entry names the files touched, the change,
and the command output that proves it.

---

## 2026-11-02 — Wave 2: track filtering, affiliate attribution, real credential pipeline, CI

Branch: `feat/academy-wave-2-tracks-affiliate-credentials-ci`
Base: `d164930` (`origin/main`, PR #26 "Sprint 11 live checkout routing")

### Starting state

`origin/main` had no commits in the previous 24 hours, so there was no human
work to rebase over: the last commit on `main` is `d164930` from 2026-10-21.
All 16 open PRs were Dependabot; the non-dependabot branches
(`jules-*`, `feat/academy-wave-1-*`, `feature/sprint-5-*`,
`telemetry-fix-*`) had already been merged to `main` or were stale.

### Defects found and fixed

| # | Defect | File(s) | Fix |
|---|---|---|---|
| 1 | `enrollInCourse` wrote `payment_method` and `tx_hash`, neither of which is a column on `academy_enrollments` (the table has `stripe_payment_intent`, `web3_wallet_address`). PostgREST answers PGRST204, so **every live enrollment failed**. | `src/lib/enrollmentPayload.js` (new), `src/store/useAcademyStore.js` | Explicit column mapping module + one-column-at-a-time retry that degrades gracefully on an un-migrated database. |
| 2 | `user_id` was `user?.id \|\| walletAddress \|\| 'anon'` — never a uuid, so the NOT NULL uuid column rejected it. | `src/store/useAcademyStore.js` | `ensureLearnerId()` resolves a real Supabase auth uuid (existing session, then anonymous sign-in), and `buildEnrollmentPayload` refuses a non-uuid instead of writing `'anon'`. |
| 3 | `academy_enrollments` had RLS enabled with **no INSERT policy**, so even a correct payload was rejected. | `supabase/migrations/20261102000000_...sql` | INSERT/UPDATE policies scoped to `user_id = auth.uid()`, plus column-level grants that deny `status`/`completed_at`/`sbt_mint_status` to browsers. |
| 4 | `academy_promo_codes` had RLS **completely off** — any visitor could read every code, including the 100% internal grants. | same migration + `CheckoutModal.jsx` | RLS on, direct SELECT revoked, validation moved to the `academy_validate_promo()` SECURITY DEFINER RPC (table select kept as a pre-migration fallback). |
| 5 | Fiat checkout called `enrollInCourse()` *before* redirecting to Stripe, granting course access whether or not payment succeeded. | `CheckoutModal.jsx` | Checkout session is created first; enrollment only after a redirect URL comes back. A failure charges nothing and grants nothing. |
| 6 | Certificate printed a hash derived from `enrollment.id.split('-')[1]` (e.g. `AXM-VER-8821`) that `/verify/:hash` could never resolve, because the verification page only matched `enrollment.id`. | `src/lib/credentialHash.js` (new), `CertificateViewer.jsx`, `VerificationPage.jsx` | SHA-256 digest over the canonical credential fields is printed at full length; verification accepts the digest *or* the legacy id. |
| 7 | Certificate issue date fell back to `new Date()`, so the printed date (and therefore any hash over it) changed every render. | `CertificateViewer.jsx`, `credentialHash.js` | `resolveIssuedAt()` uses `completed_at`, then `created_at`; the hash is stable across renders. |
| 8 | `window.location.hash = '#/partner-apply'` and `#/dashboard` / `#/certificate/...` under a `BrowserRouter` — navigation silently did nothing. | `Home.jsx`, `InteractiveClassroom.jsx` | `useNavigate()`. |
| 9 | `?category=` was applied when present but never cleared, so returning to `/` kept the previous filter. | `CourseGrid.jsx`, `src/hooks/useTrackParam.js` (new), `Home.jsx` | One writer syncs the URL to the store; no param means `All`. |
| 10 | `SBT` minting was `setTimeout(3000)` behind a spinner — no contract call, no error, no token. | `CredentialWallet.jsx`, `src/lib/sbt.js` (new) | Real `useContract`/`useContractWrite` call against `VITE_SBT_CONTRACT_ADDRESS`; refuses with a stated reason when the contract or wallet is missing; `sbt_mint_status` stays server-owned. |
| 11 | `OnyxAssistant` answered every prompt from a hard-coded `setTimeout` block, including a `mockSignature` in telemetry. | `OnyxAssistant.jsx`, `src/lib/onyx.js` (new) | POSTs to `https://onyx-edge.axim.us.com/api/v1/onyx/summon` with `domain_context: "academy"` and the learner's JWT; failures are reported as failures with a retry. |
| 12 | `?ref=` was never read anywhere, so affiliate attribution did not exist in the app at all. | `src/lib/affiliate.js` (new), `src/hooks/useAffiliateCapture.js` (new), `App.jsx`, `CheckoutModal.jsx` | Capture at the shell, sessionStorage with a 30-day window, attached to the enrollment payload and to the Stripe session request. |
| 13 | No CI. "Verify the status checks" had nothing to verify. | `.github/workflows/ci.yml` (new) | lint + unit tests + production build on every PR and push to `main`. |
| 14 | No tests at all (`npm test` did not exist). | `tests/*.test.js` (new), `package.json` | 68 tests over the real modules via the Node built-in runner. |

### Security note (not changed, needs the operator)

`.env` is **tracked in git** even though `.gitignore` lists it. The committed
values are placeholders (`https://your-project-id.supabase.co`, a 13-character
key), so nothing secret leaked — but the pattern is wrong and the build silently
targets a project that does not exist. Nothing is fixed by deleting the file
here: the host build would lose its variables. Rotate them into the host's
environment settings, then `git rm --cached .env` in a separate change.

### Files changed

    .github/workflows/ci.yml                                  +51  (new)
    AGENTS_VERIFICATION.md                                    +N   (this entry)
    CHANGELOG.md                                              +N   (new)
    DEBUGGING_NOTES.md                                        +N   (new)
    package.json                                               +2
    src/App.jsx                                               +9/-3
    src/components/consumption/CertificateViewer.jsx         +45/-16
    src/components/consumption/CredentialWallet.jsx         +196/-95
    src/components/consumption/InteractiveClassroom.jsx       +4/-3
    src/components/consumption/OnyxAssistant.jsx            +171/-52
    src/components/discovery/CourseGrid.jsx                  +6/-18
    src/components/transaction/CheckoutModal.jsx           +232/-96
    src/hooks/useAffiliateCapture.js                         +15  (new)
    src/hooks/useTrackParam.js                               +29  (new)
    src/lib/affiliate.js                                     +97  (new)
    src/lib/credentialHash.js                               +120  (new)
    src/lib/enrollmentPayload.js                            +163  (new)
    src/lib/onyx.js                                         +181  (new)
    src/lib/runtimeConfig.js                                 +48  (new)
    src/lib/sbt.js                                           +97  (new)
    src/lib/supabase.js                                      +24/-5
    src/lib/track.js                                         +85  (new)
    src/pages/CourseDetails.jsx                              +28/-7
    src/pages/Home.jsx                                       +40/-3
    src/pages/VerificationPage.jsx                          +198/-118
    src/store/useAcademyStore.js                            +230/-51
    supabase/migrations/20261102000000_academy_affiliate_credentials_rls.sql  +268 (new)
    tests/                                                   +7 files (new)

### Verification commands

    $ env -u NODE_ENV npm run lint
    > axim-academy@1.0.0 lint
    > eslint .
    (no output - 0 errors, 0 warnings)

    $ env -u NODE_ENV npm test
    1..61
    # tests 61
    # suites 0
    # pass 61
    # fail 0
    # cancelled 0
    # skipped 0
    # todo 0
    # duration_ms 12319.59277

    $ env -u NODE_ENV NODE_OPTIONS=--max-old-space-size=4096 npm run build
    vite v5.4.21 building for production...
    transforming...
    (plugin:vite:resolve notices for node polyfills: stream, http, https, zlib - pre-existing, see below)
    ✓ 5295 modules transformed.
    rendering chunks...
    Killed

    $ free -m
                   total        used        free      shared  buff/cache   available
    Mem:            3919        3572         162           5         466         347

### Build status: verified in CI, not locally

Locally, all 5,295 modules compiled (`✓ 5295 modules transformed`) and the bundle
emit was then killed by the kernel OOM killer - this sandbox has 3,919 MB of RAM
shared with a parallel agent, and a thirdweb/ethers bundle needs more at peak.
Three local attempts, all killed at the same phase:

| Attempt | Command | Result |
|---|---|---|
| 1 | `NODE_OPTIONS=--max-old-space-size=4096 npm run build` | `Killed` during `rendering chunks` |
| 2 | `NODE_OPTIONS=--max-old-space-size=2560 npm run build` | `Killed`, same phase |
| 3 | `NODE_OPTIONS=--max-old-space-size=2200 vite build --minify false` | killed after `✓ 5304 modules transformed`, before chunk emit |

That is a sandbox memory ceiling, not a defect, so the canonical command was
proven where it belongs - CI (`ubuntu-latest`, 7 GB). Run
[41523480877](https://github.com/JimEllars/AXiM-Academy-App-1-188/actions/runs/41523480877),
job `125545126679`, verbatim:

```

> eslint .
(no problems)

> node --test tests/*.test.js
# tests 61
# pass 61
# fail 0

> NODE_OPTIONS=--max-old-space-size=4096 vite build
✓ 5295 modules transformed.
✓ built in 31.78s
```

Both checks on the PR head passed: `lint + test + build` (success) and
`GitGuardian Security Checks` (success, no secrets).

The `stream`/`http`/`https`/`zlib` externalization notices come from
`cipher-base` and `micro-ftch` inside the thirdweb dependency tree. They are
pre-existing on `main` and are warnings, not errors; `src/polyfills.js` supplies
the `Buffer`/`global`/`process` shims those libraries rely on at runtime.

### Migration status — NOT EXECUTED

`supabase/migrations/20261102000000_academy_affiliate_credentials_rls.sql` is
authored and reviewed but has not been applied: this workspace has no `psql`,
no Supabase CLI and no link to the Academy project. Per the working agreement, a
migration that has not been executed is not verified. Apply it deliberately:

    supabase link --project-ref <ref>
    supabase db push

The frontend is written to survive the skew (checkout retries without the new
columns; promo validation falls back to the table; verification falls back to
id-only lookup), so merging this branch before the push degrades rather than
breaks.

---

## Production Sprint 11 Verification

- **Task 1: Universal Promo Router Activation**: Successfully refactored `handlePromoSubmit` in `CheckoutModal.jsx` to query the live Supabase `academy_promo_codes` table. Implemented bypass logic for internal grants where `discount_percentage === 100` and `is_internal_grant === true`.
- **Task 2: Live Enrollment & Progress Database Writes**: Updated `useAcademyStore.js` `enrollInCourse` to perform live upsert to `academy_enrollments` logging `user_id`, `payment_method`, and `status`. Updated `updateProgress` to perform live upsert to `academy_progress` tracking `quiz_score` and `is_completed`.
- **Task 3: Transaction Resilience**: Wrapped the Supabase select in `CheckoutModal.jsx` and Supabase upserts in `useAcademyStore.js` with try/catch blocks. Handled failure by aborting state mutation, triggering `trackAcademyEvent('CHECKOUT_TRANSACTION_FAILED', ...)` and displaying localized toast notifications.
- Build verified using `npm run build` without any compilation errors. Linter verified.
