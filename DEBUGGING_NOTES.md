# Debugging Notes

Symptoms observed in this app, what actually caused them, and how to tell the
difference next time. Append, don't rewrite.

---

## "Transaction Failed" on every enrollment (2026-11-02)

**Symptom.** Checkout walks through payment, then shows the generic
`Transaction Failed` toast. Nothing appears in `academy_enrollments`.

**What it was.** Three independent failures stacked on the same code path:

1. The upsert sent `payment_method` and `tx_hash`. `academy_enrollments` has
   `stripe_payment_intent` and `web3_wallet_address`; those two names do not
   exist. PostgREST returns `PGRST204` ("Could not find the 'payment_method'
   column") and the browser logged it as a generic failure.
2. `user_id` was `user?.id || walletAddress || 'anon'`. The column is `uuid NOT
   NULL`, and the email login mints `usr-<timestamp>` while the wallet login has
   only a `0x…` string, so the insert could never satisfy the type.
3. `academy_enrollments` had RLS enabled with policies for SELECT only. An
   INSERT without a policy is denied, even with a valid payload.

**Fix.** `src/lib/enrollmentPayload.js` owns the column mapping and validates the
uuid; `ensureLearnerId()` resolves a real Supabase auth uuid; the migration adds
INSERT/UPDATE policies scoped to `auth.uid()`.

**How to spot it again.** `PGRST204` means *your column names are wrong* — not a
network problem, not RLS. RLS denials come back as `42501` with "new row
violates row-level security policy". A uuid type error is `22P02`. All three used
to surface as the same toast.

---

## "It says live PostgREST integration but nothing is live" (2026-11-02)

**Symptom.** Course data looks fine, but every write fails.

**What it was.** The committed `.env` contains placeholders:
`VITE_SUPABASE_URL=https://your-project-id.supabase.co` and a 13-character anon
key. `fetchCourses()` catches the failure and falls back to `MOCK_COURSES`, which
is why the catalog looks populated and the failure looks like a runtime bug
rather than a configuration one.

**Fix.** `src/lib/runtimeConfig.js` detects placeholder values; `fetchCourses`
logs one warning instead of pretending to fetch and checkout refuses with
"Commerce backend not configured".

**Follow-up for the operator.** `.env` is tracked in git (it is also in
`.gitignore`, which does nothing once a file is tracked). Set the real values in
the host environment, then `git rm --cached .env` in a separate change. Do not
delete the file before the host has the variables, or the build loses them.

---

## "The certificate hash does not verify" (2026-11-02)

**Symptom.** `/verify/AXM-VER-8821` returns nothing; the certificate displays a
value the verification page rejects.

**What it was.** The certificate derived its hash from
`enrollment.id.split('-')[1]` — a slice of the uuid, formatted to look like a
credential id. `VerificationPage` only ever matched `academy_enrollments.id`.

**Fix.** One SHA-256 digest over `(version, enrollment, user, course, issued_at)`,
computed in `src/lib/credentialHash.js`, printed in full and accepted by
`/verify/:hash` alongside the legacy id form. The issue date is now
`completed_at` (falling back to `created_at`) because `new Date()` made the
printed date — and therefore the digest — change on every render.

**Note on strength.** The digest is tamper *evidence*, not a signature: it is
computed in the browser from fields the browser can read. Real non-repudiation
needs `/api/v1/credentials/mint` to sign the payload server-side and the verify
page to check that signature. Until then the enrollment row is the authority.

---

## "Onyx answers everything, even when the network is down" (2026-11-02)

**Symptom.** The tutor always replies in ~1.5s, including with the laptop's wifi
off.

**What it was.** `OnyxAssistant` had a `setTimeout(1500)` with three
keyword-matched canned strings and emitted a `mockSignature` field in telemetry.

**Fix.** Real POST to the edge summon endpoint, failures rendered as failures with
a retry, `AI_ASSISTANT_RESPONSE_FAILED` telemetry on error.

**Do not** add `AXIM_INTERNAL_KEY` or an HMAC signer to this client. Every byte
in a Vite bundle is public; a signature the client can compute protects nothing.
The satellite relays to Core are signed at the edge.

---

## "Mint SBT spins for three seconds and nothing happens" (2026-11-02)

**Symptom.** The credential card's mint button animates, then returns to normal.
No token, no error.

**What it was.** `handleMint` was `await new Promise(r => setTimeout(r, 3000))`.
Never a contract call.

**Fix.** `useContract` + `useContractWrite` against
`VITE_SBT_CONTRACT_ADDRESS` (ABI `safeMint(address,string)` in `src/lib/sbt.js`).
Without the address or a wallet, the card states the reason and does nothing.
`sbt_mint_status` is written by the ledger, not the browser — the migration
revokes that column from `authenticated` on purpose.

---

## "Buttons that set window.location.hash do nothing" (2026-11-02)

`App.jsx` uses `BrowserRouter`, which reads `location.pathname`, not the hash.
`window.location.hash = '#/dashboard'` therefore set an anchor on the current
route and rendered nothing. Three call sites did this
(`Home`, `InteractiveClassroom` x2). Use `useNavigate()`.

---

## Catalogue came back pre-filtered (2026-11-02)

`CourseGrid` applied `?category=` when the param was present and never cleared
it, so the filter survived navigation. `useTrackParam()` now sets the filter from
the URL on every mount, including back to `All` when there is no param.

---

## "Crypto checkout works!" — no money moved (2026-11-03)

**Symptom.** Paying with crypto completes in about three seconds, the learner is
enrolled, and `academy_enrollments.tx_hash` holds something that looks like a
transaction hash. On Arbiscan there is no such transaction.

**What it was.** `handleCryptoPayment` was three `setTimeout`s in a trench coat:

```js
await new Promise(r => setTimeout(r, 1000)); // "finding the contract"
await new Promise(r => setTimeout(r, 2000)); // "wallet sign request"
const mockHash = '0x' + Math.random().toString(16).slice(2);
await completeEnrollment('crypto', { txHash: mockHash });
```

No contract, no wallet prompt, no chain. `tx_hash` is the payment proof for an
on-chain enrollment, so every crypto purchase wrote a receipt that never
existed — and the course unlocked for free. This is the same class of defect as
the `setTimeout(3000)` SBT mint fixed in Wave 2 (see above); the mint was fixed
and its sibling on the checkout path was missed.

**Fix.** `src/lib/cryptoPayment.js` decides whether a transfer is legal
(treasury configured, wallet connected, chain is 42161 — Arbitrum One,
amount after discount > 0), then `CheckoutModal` calls
`sdk.wallet.transfer(treasury, amount)` and stores only a hash the wallet
returned. `extractTransactionHash()` rejects anything that is not 32 bytes, so
the old simulated value could not be written even by accident.

**How to spot it again.** Any `Math.random()` or bare `setTimeout` on a path
that writes `tx_hash`, `stripe_payment_intent`, `sbt_mint_status` or
`certificate_hash`. Those four columns are claims about the outside world; a
timer can only produce a lie.

---

## "The build is OOM-killed after `rendering chunks`" (2026-11-03)

**Symptom.** `NODE_OPTIONS=--max-old-space-size=4096 npm run build` runs for
15–25 minutes, prints `✓ 5296 modules transformed.` and `rendering chunks...`,
then the process disappears. The log ends with `Killed`.

**What it was.** Not the code and not a leak: the sandbox has 3.9 GB of RAM and
no swap, and V8 was told it may use 4 GB. `dmesg` shows the kernel taking the
process at `anon-rss` 2.7–2.9 GB while the agent runtime and a parallel repo's
`npm ci` held the rest. Lowering the cap to 2560 MB moved the kill later but did
not remove it — the build's live set at render is ~2.7 GB. Transform throughput
was ~5 % of one core throughout, so the box was CPU-starved as well; the same
bundle builds in ~32 s on an idle machine (see the Wave 2 entry).

**What to do.** Do not chase this in `vite.config.js`. Check `free -m` and
`ps aux | grep vite` first: if another build is resident, wait for it. The
authoritative production build is the CI job (`ubuntu-latest`, 7 GB, the same
`npm run build`). Locally, the per-module transform check
(`npx vite --port 5200` then GET each changed module) catches syntax and
resolution errors for a few hundred MB, which is what this box can afford.

**Do not** "fix" it by dropping `--max-old-space-size` in `package.json`. CI
needs the headroom, and a build that succeeds only because it skipped the
minifier is not the build that ships.

---

## "Every quiz scored 100, including the one that wasn't taken" (2026-11-04)

**Symptom.** `academy_progress.quiz_score` was `100.00` on every row. A learner
who missed a question, a learner who aced it, and a lesson with no quiz at all
were indistinguishable.

**What it was.** Not one bug, three, each hiding the next:

```js
// QuizEngine
trackAcademyEvent('QUIZ_COMPLETED', { score: 100, hasFailed });
await onComplete(100);                    // literal

// InteractiveClassroom
const handleComplete = (score) => { onProgress(activeLessonId, score); }
// ...but VideoPlayer/LiveStreamRoom are wired `onClick={onComplete}`, so
// `score` is a SyntheticEvent on those lessons.

// Learn
onProgress={(lessonId) => updateProgress(enrollment.id, lessonId)}  // dropped

// store
buildProgressPayload({ enrollmentId, lessonId, quizScore: 100 })   // constant
```

Each layer independently made the value meaningless, so fixing any one of them
proved nothing. The event-object one is the one to watch: it was harmless
*because* the value was being dropped, and would have become
`quiz_score: [object Object]` the moment the plumbing was connected.

**Fix.** `src/lib/quizScore.js` owns the measurement — first-attempt
correctness, because the quiz retries until correct so "eventually right" is
always true and carries no information. `normalizeQuizScore()` returns `null` for
anything that is not a finite number, so a future `onClick={onComplete}` regresses
to "no score" rather than a broken row. A lesson with no questions returns
`{score: null}`, which is different from `0` and omits the column.

**How to spot it again.** A column whose value is identical across every row is
not being measured. Grep for the literal on the write path before trusting any
metric derived from it.

---

## "Certification Complete" on a write that never landed (2026-11-04)

**Symptom.** The learner finishes the last lesson, sees "Your performance has
been logged on the AXiM Ledger", and the progress row is not in the database.

**What it was.** `handleComplete` called `onProgress(...)` without awaiting it
and then rendered the success screen unconditionally. `updateProgress` did throw
on a rejected upsert — the throw went into an unhandled promise rejection that
nothing displayed.

**Fix.** `handleComplete` is async and awaits; a failure renders in a
`role="alert"` block above the lesson and the success screen does not appear.
This is the same class as the Wave 3 `txStep` bug: feedback about an async write
was rendered on a path that did not depend on the write.

**A note on `Progress Sync Failed`.** `updateProgress` reports that string in a
toast for every failure, including RLS denials and type errors. It is as
uninformative as `Transaction Failed` was before Wave 2. Read `error.code`
(`42501` RLS, `22P02` uuid, `PGRST204` column) before believing the message.

---

## The enrollment ledger was write-only (2026-11-04)

**Symptom.** A learner enrolls, completes a course, signs in on another browser:
empty Command Center, no enrollments, no progress. On the original browser the
course shows complete — because that browser remembered it.

**What it was.** Enrollments lived only in the zustand `persist` store
(localStorage). `academy_progress` rows were written, and the
`check_course_completion()` trigger wrote `academy_enrollments.status` and
`completed_at`, and nothing ever selected them back. So the authoritative record
existed and was never read, which is why the client's own derivation of
"completed" could drift from the trigger's without anyone noticing.

**Fix.** `fetchEnrollments()` on the store, called from `StudentDashboard`, reads
the signed-in uuid's enrollments and their progress rows and merges them with
`mergeEnrollments()` — server wins for rows it knows, local-only rows are kept,
and an empty result never wipes the list. `mapEnrollmentRows()` guarantees
`progress: []`, because `enrollment.progress.some(...)` on the first render was a
white screen, not an empty list.

**How to spot it again.** Any table with triggers or Edge Functions writing it
and no `select` anywhere in `src/`. The write-only table is the one whose truth
nobody is reading.

---

## Two agents cannot share `/tmp/build.log` (2026-11-04)

**Symptom.** A `vite build` started with `nohup ... > /tmp/build.log`, then the
log showed only `vite v5.4.21 building for production... transforming...` for
ten minutes and then content from a *different repository*.

**What it was.** The sandbox is shared. Another agent's workflow was running
`npx vite build > /tmp/build.log` from `/workspace/review/coding-lab` on the same
path. Both processes were alive; the log was a race. `ps aux | grep "[v]ite
build"` showed four processes and two working directories, which is how it was
identified.

**What to do.** Give build logs a repo-scoped path (`/tmp/academy-build.log`) and
check `ps aux` for a build from another directory before deciding the machine is
slow. Two builds plus the agent runtime on 3.9 GB with no swap is an OOM the
kernel resolves by killing whichever process touches the ceiling first — usually
not the one that asked for it.

## Checkout threw `price_usd.toFixed is not a function` on a live catalog (2026-11-05)

**Symptom.** With Supabase configured and the catalog served from
`academy_courses`, the fiat payment selector crashed instead of rendering the
discounted price.

**What it was.** PostgREST serializes `NUMERIC` columns as JSON strings (to
preserve precision), so `academy_courses.price_usd` arrives as `"299.00"`, not
`299`. `course.price_usd.toFixed(0)` is then a TypeError — `.toFixed` exists on
`Number`, not `String`. The mock seed stores a real number, which is why the demo
never hit it.

**Fix.** `Number(course.price_usd ?? 0).toFixed(0)` at every display site in
`CheckoutModal.jsx`.

**How to spot it again.** A `price_usd` / `*_amount` value that starts as a JS
number in the seed but arrives as a string from the database is a PostgREST
`NUMERIC` coercion, not a typo. Coerce at the render boundary (`Number(x ?? 0)`),
or normalise the row when it is mapped in `fetchCourses`.

## Search blanked the storefront on a NULL description (2026-11-05)

**Symptom.** Typing in the storefront search box made the whole catalog
disappear, but only for courses that came from the database.

**What it was.** `academy_courses.description` is nullable. The search filter
dereferenced `course.description.toLowerCase()` unguarded, so a row with a NULL
description threw inside `Array.filter` and React bailed out of the render. The
mock seed always carries a description, so the demo never hit it.

**Fix.** `(course.description ?? '').toLowerCase()` in `CourseGrid.jsx`; `title`
is NOT NULL but is guarded the same way for symmetry.

**How to spot it again.** A crash that only fires for database-served rows and
never for the mock seed is a schema-shape difference — check the migration's
nullability for every field the component dereferences.

## Every lesson in a live catalog rendered as an empty quiz (2026-11-06)

**Symptom.** With Supabase configured, clicking into any lesson showed the
`QuizEngine` panel with no questions and no way to complete it — including
lessons the instructor had written as text.

**What it was.** The classroom chooses its renderer by lesson `type`
(`video` → `VideoPlayer`, `live` → `LiveStreamRoom`, `article` → prose,
anything else → `QuizEngine`). `academy_lessons` does not have a `type` column;
it has `content_type` with a CHECK constraint of
`video | article | interactive_quiz`. Nothing renamed it, so `type` was
`undefined` on every database row and `undefined` fell through to the quiz
renderer. The mock seed used `type` directly, so the demo was correct and the
live catalog was not.

The same mapping gap hid the lesson *body*: article HTML, video URLs and quiz
questions all live in `content_payload` (JSONB), and the classroom reads
`content`, `videoUrl`, `quizData`. All three were `undefined` too.

**Fix.** `src/lib/courseRow.js` maps `content_type` → `type`, pulls the body out
of `content_payload`, and defaults an unrecognised type to `article`. The
default matters: a mis-typed lesson should show its title and an empty body, not
a quiz the learner can never pass.

**How to spot it again.** A renderer selected by a field that is never populated
fails *silently* into its last branch. When a component switches on
`row.someField`, check that the column exists in the migration, not just in the
seed — and make the fallback branch the harmless one, not the interactive one.

## `npm ci` installs nothing and says it succeeded (2026-11-06)

**Symptom.** After a fresh `npm ci` in this sandbox, `npm run lint` could not
find `eslint`, `npm run build` could not find `vite`, and PostCSS failed to load
`autoprefixer`. `npm ci` had printed `added 1226 packages in 26m` and exited 0.

**What it was.** The shell exports `NODE_ENV=production`. npm omits
`devDependencies` when `NODE_ENV=production` regardless of the lockfile, and this
repo keeps `vite`, `eslint`, `tailwindcss` and `autoprefixer` in
`devDependencies`. Nothing warns: the install is "successful", it just installed
the wrong half of the tree. CI does not set `NODE_ENV`, which is why the same
commands work on `ubuntu-latest`.

**Fix.** `npm install --include=dev` (or `NODE_ENV=development npm ci`) in this
sandbox. Check with `npm ls autoprefixer` — `(empty)` means the dev tree is
missing.

**Related, and worth not repeating.** Interrupting `npm install` midway leaves
`node_modules` in a half-renamed state; the next run dies with
`ENOTEMPTY: directory not empty, rename '.../autoprefixer'`. While that state
held, `vite build` failed with
`Rollup failed to resolve import "@supabase/phoenix"` — a *missing node_modules
directory*, not a broken import in the code (the package is in the lockfile at
0.4.5 and CI resolves it). Delete `node_modules` and reinstall once, cleanly,
before concluding a build error is real.
