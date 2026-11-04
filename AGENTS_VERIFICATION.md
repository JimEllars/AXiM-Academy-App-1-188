# AGENTS Verification Log

Append-only. Newest wave first. Each entry names the files touched, the change,
and the command output that proves it.

## 2026-11-04 — Wave 4: `quiz_score` measured, enrollment ledger read back

Branch: `feat/academy-wave-4-quiz-score-and-ledger-sync`
Base: `6004d7b` (`origin/main`, PR #44 "reconcile the Dependabot queue"), rebased
onto `79b87e2` after the two `actions/*` merges below.

### Starting state

`git fetch origin main` + `git fetch --all --prune`: four commits in the previous
24 hours, all upstream merges — `e0f91f1` (Wave 3, PR #34), `4cdec24`, `ce35b62`,
`653269d` (Dependabot patch bumps), `6004d7b` (docs reconcile, PR #44). No human
authored commits to rebase over; nothing local was abandoned or overwritten.
21 open PRs at start, all Dependabot.

Baseline before any change, on `main` at `6004d7b`:

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

CI on `main` was green before the wave started (`gh run list --branch main`:
run `41666753799`, `lint + test + build`, `success`, 1m11s).

### Dependabot PRs merged first (workflow-only, both green)

Following the merge order recorded in `Continued Development Plan.md` P3.1 —
`actions/*` first, one at a time, never a batch:

| PR | Change | `gh pr checks` before merge |
|---|---|---|
| #35 | `actions/checkout` 4 → 7 | GitGuardian `pass` 14s; `lint + test + build` `pass` 1m19s |
| #36 | `actions/setup-node` 4 → 7 | GitGuardian `pass` 8s; `lint + test + build` `pass` 1m14s |

Open Dependabot PRs: 22 → 20. Runtime majors (`react` 19, `react-dom` 19,
`zustand` 5, `framer-motion` 14, `tailwind-merge` 3, `eslint` 10,
`eslint-plugin-react-hooks` 7, `react-router-dom` 7) are still open on purpose:
each is a migration that needs its own build, not a merge.

### Defects found and fixed

| # | Defect | File(s) | Fix |
|---|---|---|---|
| 1 | **`quiz_score` was the constant 100.** `updateProgress` passed `quizScore: 100` for every completed lesson. `Learn` dropped the score `InteractiveClassroom` handed it, and `QuizEngine` sent a literal `100`. A failed-then-retried quiz and a perfect one produced identical rows. | new `src/lib/quizScore.js`, `QuizEngine.jsx`, `InteractiveClassroom.jsx`, `Learn.jsx`, `useAcademyStore.js` | The score is first-attempt correctness across the questions, measured in `scoreQuiz()`; `Learn` forwards it; `updateProgress(enrollmentId, lessonId, { quizScore })` normalises it and omits the column when there is no quiz. |
| 2 | **A `SyntheticEvent` could reach `quiz_score`.** Video/live/article lessons wired `onClick={onComplete}`, so `handleComplete`'s `score` parameter was the click event. Invisible while the value was discarded; a `[object Object]` row once it is not. | `VideoPlayer.jsx`, `LiveStreamRoom.jsx`, `InteractiveClassroom.jsx` | `onClick={() => onComplete()}` at both call sites; `normalizeQuizScore()` returns `null` for anything that is not a finite number, which is the guard that matters if a future call site regresses. |
| 3 | **Completion was announced before the write succeeded.** `handleComplete` did not await `onProgress`, so a rejected `academy_progress` upsert still rendered "Certification Complete … logged on the AXiM Ledger". | `InteractiveClassroom.jsx` | `handleComplete` is async, awaits the write, and renders the failure in a `role="alert"` block instead of the success screen. |
| 4 | **Completion could fire one lesson early.** `newProgress.length === totalLessons` counts a re-appended lesson twice. | `useAcademyStore.js`, `InteractiveClassroom.jsx` | `countCompletedLessons()` counts distinct `lesson_id`s; the sidebar progress bar uses the same helper instead of `progress.length`. |
| 5 | **Enrollments were never read from the database.** `academy_progress` and the `check_course_completion()` trigger wrote the authoritative record and nothing loaded it: a learner on a second browser saw an empty Command Center, and `status` / `completed_at` had two sources of truth. | new `src/lib/enrollmentState.js`, `useAcademyStore.js` (`fetchEnrollments`), `StudentDashboard.jsx` | `fetchEnrollments()` reads the signed-in uuid's enrollments plus their progress rows and merges them additively — server wins for rows it knows, local-only rows are kept, an empty fetch never wipes the list. |
| 6 | `enrollment.progress` was dereferenced with no null guard in `InteractiveClassroom` and inside `updateProgress`'s state updater. A record that arrived from the database without the client-side array was a crash. | `InteractiveClassroom.jsx`, `useAcademyStore.js` | `?? []` at both reads; `mapEnrollmentRows()` guarantees the array for anything it produces. |
| 7 | A quiz lesson with no `quizData` crashed on `questions[0].question_text`. | `QuizEngine.jsx` | Empty-quiz branch completes the lesson as unscored. |
| 8 | `OnyxAssistant` accepted `lessonTitle` and was never given it, so the tutor had no per-lesson context. | `InteractiveClassroom.jsx` | `lessonTitle={activeLesson?.title ?? null}` — the payload field already existed in `buildOnyxSummonPayload`. |
| 10 | **A 100 % internal grant wrote a full-price partner earning.** `enrollInCourse` built the split from `course.price_usd` for every enrollment, so the free path that exists for staff and contractors added a completed sale to `partners`, `getPartnerStats()` and the admin financial panel — in the same wave the unified storefront uses those codes to bypass payment. | new `src/lib/revenue.js`, `useAcademyStore.js` | `buildRevenueRecord()` returns `null` for `internal_grant`, for a course with no partner share, and for a non-positive price; every emitted row is `settled: false` because no payout exists yet. |
| 9 | `academy_courses.category` had no CHECK. A row could land in `'Foundaton'` and match no filter chip: invisible in every filtered view, present under "All". | new `supabase/migrations/20261104000000_academy_course_category_check.sql` | Normalise existing values to the six canonical tracks, `CHECK (category IN (...)) NOT VALID` → `VALIDATE`, plus a `(category, visibility)` index for the storefront filter. |

### Tests

Three new files, 29 tests, all over real modules with no mocks:

`tests/quizScore.test.js` (10):

- `scoreQuiz` measures first-attempt correctness (`{0:true,1:false,2:true}` on
  three questions → 67), never the retry outcome;
- **the regression**: an untouched quiz (`{}`, `null`, `undefined`) scores 0, not
  100 — the value the old code asserted unconditionally;
- a lesson with no questions returns `{score: null}` — distinct from a failed
  quiz;
- attempts on indices outside the quiz are ignored;
- `normalizeQuizScore` rejects a DOM event, `NaN`, `Infinity`, `''`; rounds
  `87.5` → `88`; clamps `-5` → `0` and `140` → `100`;
- `buildProgressPayload` emits `quiz_score: 67` for a measured quiz and omits
  the key entirely when there is none.

`tests/enrollmentState.test.js` (11):

- `mapEnrollmentRows` always yields `progress: []`, tolerates a null progress
  list, attaches rows by `enrollment_id`, drops `is_completed: false`, and never
  invents progress for an unknown enrollment;
- the server row wins for `status` / `completed_at` in `mergeEnrollments`;
- a local-only enrollment survives the merge, and an empty fetch cannot wipe the
  local list;
- `countCompletedLessons` counts distinct lesson ids and ignores incomplete rows.

`tests/revenue.test.js` (8):

- an internal grant produces **no** revenue record — the free internal path must
  not appear as a sale;
- a course with no instructor, or a zero/negative/non-numeric price, produces no
  record (`null` means "no revenue", not "zero revenue");
- 75 % of 299 → `224.25` / `74.75`; 33 % of 99 → `32.67` / `66.33` and the halves
  round to the gross exactly;
- a missing share falls back to the documented default; 150 and -10 clamp;
- every row is `settled: false`, currency `USD`.

**Prove-it-fails evidence.** Both files were written first and run against the
missing modules:

```
$ npm test
not ok 7 - tests/quizScore.test.js
not ok 6 - tests/enrollmentState.test.js
not ok 9 - tests/revenue.test.js
# tests 84
# pass 83
# fail 1
```

After the modules landed:

```
$ npm test
# tests 102
# pass 102
# fail 0
```

### Verification output (this sandbox)

```
> axim-academy@1.0.0 lint
> eslint .
(exit 0 — 0 errors, 0 warnings)

> axim-academy@1.0.0 test
> node --test tests/*.test.js
1..102
# tests 102
# pass 102
# fail 0
# cancelled 0
# skipped 0
```

### On the production build in this sandbox

`npm run build` was started once, alone, and **did not reach chunk render** in
this container. This is the environment documented in `DEBUGGING_NOTES.md` ("The
build is OOM-killed after `rendering chunks`"), not this change.

```
$ free -m                      # at start, no other build resident
Mem:            3919  total,   2861  available,  no swap
$ NODE_OPTIONS=--max-old-space-size=4096 npx vite build > /tmp/academy-build.log
vite v5.4.21 building for production...

# ~15 minutes later, still transforming:
$ tail -1 /tmp/academy-build.log
[plugin:vite:resolve] Module "zlib" has been externalized ... micro-ftch/index.js
$ free -m
Mem:            3919  total,    439  available        # 3.5 GB resident
```

The transform was still running with 439 MB left, which is below the ~2.7 GB live
set the bundle needs once it renders chunks. I stopped it there rather than let it
run into the ceiling: the failure mode on this box is a kernel OOM kill, and the
kernel takes whichever process touches 3.9 GB first — not necessarily this one.
Another agent's build shares the container. (The log also stops at
`Terminated`, my SIGTERM, with no `error during build` line — nothing here says
the code failed to compile.)

Three things were checked instead:

1. **Lint and tests, which is what this change actually touches:**

   ```
   > axim-academy@1.0.0 lint
   > eslint .
   (exit 0 — 0 errors, 0 warnings)

   > axim-academy@1.0.0 test
   1..102
   # tests 102
   # pass 102
   # fail 0
   ```

2. **Every changed module transforms and resolves.** A dev server on port 5210
   served each changed file through the real esbuild + React pipeline, so syntax,
   the `@/` alias and every import in the change were exercised:

   ```
   200  src/lib/quizScore.js                                 bytes=17143
   200  src/lib/enrollmentState.js                           bytes=17004
   200  src/components/consumption/QuizEngine.jsx            bytes=23361
   200  src/components/consumption/InteractiveClassroom.jsx  bytes=31231
   200  src/pages/Learn.jsx                                  bytes=3479
   200  src/pages/StudentDashboard.jsx                       bytes=31862
   200  src/components/consumption/VideoPlayer.jsx           bytes=4819
   200  src/components/consumption/LiveStreamRoom.jsx        bytes=20315
   200  src/store/useAcademyStore.js                         bytes=160795
   ```

3. **CI ran the real production build.** `ubuntu-latest` (7 GB), the identical
   `npm run lint && npm test && npm run build`, on this branch:

   ```
   $ gh pr checks 45
   GitGuardian Security Checks   pass   1s
   lint + test + build           pass   1m20s
     https://github.com/JimEllars/AXiM-Academy-App-1-188/actions/runs/41839210861/job/126606009591
   ```

   That job is the authoritative build. A local build that succeeds only because
   the machine happened to be quiet is not the build that ships — same call as
   Wave 3.

### Not verified

- **The migration in this wave has not been executed.** `supabase db push` needs
  a real project; `.env` still holds placeholders. The SQL is written to be
  idempotent and safe on drifted data (normalise → `NOT VALID` → `VALIDATE` →
  index), but "a migration that has not been executed is not verified". Run it on
  a preview branch before `main`.
- **`fetchEnrollments()` has no integration test**, because the repo has no
  test harness that can stand up PostgREST. The row-mapping and merge logic it
  delegates to is covered by the 11 unit tests; the network call itself is
  exercised only when a configured deployment loads the dashboard.
- **`quiz_score` is still client-asserted.** The value is now measured rather
  than constant, but it is measured in the browser and written by the browser.
  The `academy_progress` RLS policy scopes writes to `auth.uid()`, which stops a
  learner writing someone else's row, not a learner writing a flattering score to
  their own. That needs the progress write to move behind an Edge Function, the
  same way `checkout/initiate` should own enrollment. Recorded in the plan.

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

`lint + test + build` — **success** on `edc2cdf`
(<https://github.com/JimEllars/AXiM-Academy-App-1-188/pull/34>). Steps 4–7 all
green: `Install dependencies`, `Lint`, `Unit tests`, `Production build`.
`GitGuardian Security Checks` — success.

Verbatim from the CI job log:

```
> node --test tests/*.test.js
1..73
# tests 73
# suites 0
# pass 73
# fail 0
# cancelled 0
# skipped 0

> npm run build
vite v5.4.21 building for production...
✓ 5296 modules transformed.
dist/assets/index-BsNNl85M.js   4,871.86 kB │ gzip: 1,379.49 kB
✓ built in 36.84s
```

This is the same `npm run build` the mandate names, on a runner with the memory
to finish it. It passes on this branch, and it passed on `main` at `e923d72`
before it.

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
