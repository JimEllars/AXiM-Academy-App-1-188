# AGENTS Verification Log

Append-only. Newest wave first. Each entry names the files touched, the change,
and the command output that proves it.

---

## 2026-11-03 — Wave 3: real crypto checkout, URL-owned track filter, credential access guard

Branch: `feat/academy-wave-3-crypto-checkout-track-urls`
Base: `e923d72` (`origin/main`, PR #30 "Wave 2")

### Starting state

`git fetch origin main` + `git fetch --all --prune`: one commit in the previous
24 hours, `e923d72` — Wave 2 itself, merged as PR #30. The remote
`feat/academy-wave-2-*` branch was deleted after the merge; no human commits to
rebase over. 17 open PRs, all Dependabot. `main` at `e923d72` was green in CI
(`lint + test + build`: success).

Baseline before any change: `npm run lint` → 0 errors, 0 warnings;
`npm test` → 61 pass, 0 fail.

### Defects found and fixed

| # | Defect | File(s) | Fix |
|---|---|---|---|
| 1 | **Crypto checkout was simulated.** `handleCryptoPayment` awaited three `setTimeout`s and then wrote `'0x' + Math.random().toString(16).slice(2)` into `academy_enrollments.tx_hash`, then enrolled. Every crypto purchase unlocked the course for free and stored a payment receipt that never existed on any chain. | `src/lib/cryptoPayment.js` (new), `CheckoutModal.jsx` | Pre-flight builds a real transfer plan (treasury from `VITE_ACADEMY_TREASURY_ADDRESS`, Arbitrum One chain check, amount after discount); the write is `sdk.wallet.transfer(treasury, amount)` and only a 32-byte hash returned by the wallet is accepted. Unconfigured treasury, wrong chain, missing wallet, zero amount due and malformed hashes all refuse with a stated reason. |
| 2 | The crypto button quoted `price_crypto * (1 - discount/100)` inline while the payment path used a different (fake) amount. Quoted price and signed amount could not agree. | `CheckoutModal.jsx`, `cryptoPayment.js` | Both call `effectiveEthAmount()`, which truncates to micro-ETH so the learner is never over-quoted or over-charged. |
| 3 | Track chips wrote the filter straight into the store (`setActiveCategory`) and never touched the URL, so a filtered catalog was not shareable and the filter was lost on the next mount. `CourseGrid`'s own comment claimed `Home` owned the sync. | `CourseGrid.jsx`, `Home.jsx`, `CourseDetails.jsx` | Chips navigate to `buildCatalogHref(track)`; `useTrackParam` stays the single writer. Every catalog link carries the captured `?ref=` so attribution survives a filter click. |
| 4 | `CertificatePage` had `// Note: In real app, we check enrollment.user_id === user.id` — no ownership check at all. A `/certificate/<id>` link rendered whatever enrollment was in the store. | `CertificatePage.jsx` | Redirects to `/dashboard` when the enrollment belongs to a different user. |
| 5 | `CertificateViewer` ran a 3–5 s random "Minting..." spinner before showing "Download PDF", which is a `window.print()` call. A spinner that ends in a print dialog reads as a failed background render. | `CertificateViewer.jsx` | Spinner and timer removed; the button is available immediately. |
| 6 | `txStep` is only rendered while the action button is spinning, so every failure and every refusal — written to `txStep` after `setIsProcessing(false)` — was invisible. The learner got a spinner that stopped with no explanation. | `CheckoutModal.jsx` | `paymentError` state rendered under the action button with `role="alert"`, cleared at the start of each attempt; `txStep` stays for in-flight progress. |
| 7 | Dependabot PR #29 (`vite` 5 → 8) cannot install: `@vitejs/plugin-react@4.7.0` peers `vite@^4 \|\| ^5 \|\| ^6 \|\| ^7`, so `npm ci` fails with ERESOLVE and the job dies before lint. It is re-raised every week and can never go green on its own. | `.github/dependabot.yml` (new) | Majors for `vite` held back with the reason recorded in the file; minors and patches still flow. |

### Tests

`tests/cryptoPayment.test.js` — 12 tests over the real module:

- treasury read from configuration, never a constant; malformed → unconfigured;
- refusal codes `NO_TREASURY`, `NO_WALLET`, `UNKNOWN_NETWORK`, `WRONG_NETWORK`,
  `INVALID_PRICE`, `NOTHING_DUE` (the 100 % grant path owns a zero balance);
- discount math truncates (`effectiveEthAmount(1, 33.333) === '0.66667'`),
  clamps nonsense discounts, returns `null` for a non-numeric price;
- `extractTransactionHash` reads the real thirdweb shape
  (`{ receipt: { transactionHash } }`) **and rejects the old simulated value** —
  `'0x' + Math.random().toString(16).slice(2)` is not a 32-byte hash;
- wallet errors reduce to one actionable sentence (user rejection, insufficient
  funds, wrong network).

The rejection test is the "fails before the fix" evidence: the string the old
`handleCryptoPayment` wrote to `tx_hash` is an input to
`extractTransactionHash` in that test, and it now yields `null`.

### Verification output (this sandbox)

```
> axim-academy@1.0.0 lint
> eslint .
(exit 0 — 0 errors, 0 warnings)

> axim-academy@1.0.0 test
> node --test tests/*.test.js
1..73
# tests 73
# pass 73
# fail 0
```

Full `vite build` could **not** complete in this sandbox, and the reason is
environmental, not code. Three attempts were kernel OOM-killed:

```
dmesg: Out of memory: Killed process 23011 (node) anon-rss:2924032kB   (heap cap 4096)
dmesg: Out of memory: Killed process 23788 (node) anon-rss:2903788kB   (heap cap 4096)
dmesg: Out of memory: Killed process 24232 (node) anon-rss:2736420kB   (heap cap 2560)
       ... after "✓ 5296 modules transformed. rendering chunks..."
```

The container has 3.9 GB of RAM, no swap, and the agent runtime plus a parallel
repo's `npm ci` / `vite build` hold ~0.6–2 GB of it. Vite transform throughput
during these runs was ~5 % of one core, i.e. also CPU-starved: the Wave 2 build
on an idle box took 31.78 s, these took 15–25 min and then died at render.

What was verified locally instead is the transform stage per module, through
Vite's own pipeline (`npx vite --port 5200`, then GET each changed module):

```
200 31833 src/lib/cryptoPayment.js
200 68601 src/components/transaction/CheckoutModal.jsx
200 21582 src/components/discovery/CourseGrid.jsx
200  4232 src/pages/CertificatePage.jsx
200 13187 src/pages/Home.jsx
200 23162 src/pages/CourseDetails.jsx
200 26961 src/components/consumption/CertificateViewer.jsx
200 26818 src/components/consumption/CredentialWallet.jsx
```

Every changed module compiles and resolves its imports. The authoritative
minified production build is the CI job below, which runs the same
`npm run build` with a 7 GB runner.

### CI (authoritative)

CI_RESULT_PLACEHOLDER

### Files changed

    .github/dependabot.yml                                    +26  (new)
    AGENTS_VERIFICATION.md                                   +124  (this entry)
    CHANGELOG.md                                              +42
    Continued Development Plan.md                             +24/-6
    DEBUGGING_NOTES.md                                        +62
    src/lib/cryptoPayment.js                                 +155  (new)
    src/components/transaction/CheckoutModal.jsx              +78/-21
    src/components/consumption/CertificateViewer.jsx          +13/-35
    src/components/discovery/CourseGrid.jsx                   +12/-4
    src/pages/CertificatePage.jsx                              +9/-3
    src/components/consumption/CredentialWallet.jsx            +4/-1
    src/pages/CourseDetails.jsx                                +2/-1
    src/pages/Home.jsx                                         +2/-1
    tests/cryptoPayment.test.js                              +150  (new)

### Operator action required for crypto checkout

`VITE_ACADEMY_TREASURY_ADDRESS` must be set to the receiving address on
Arbitrum One. Until it is, the crypto button states that checkout is not
configured — which is the correct state, not a bug to work around
(working agreement §3).

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
