# Continued Development Plan — AXiM Academy

Last reconciled: 2026-11-04 (end of Wave 4).

## Where the platform actually is

The storefront, LMS shell, dashboards and credential UI are built and type-clean.
What is not real yet is everything that needs a server: the database is
unreachable (placeholder `.env`), the credential ledger is un-migrated, and there
is no Stripe or minting backend. Wave 2 made those gaps *visible* instead of
silent — the app now refuses rather than pretending.

Four things must be true before a learner can actually pay and earn a credential.

## P0 — Operator actions (no code)

1. **Set real credentials in the host environment.** Replace the placeholders in
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_THIRDWEB_CLIENT_ID`,
   `VITE_STRIPE_PUBLIC_KEY`. Then `git rm --cached .env` (it is tracked; see
   AGENTS_VERIFICATION.md).
2. **Apply the migration** `20261102000000_academy_affiliate_credentials_rls.sql`
   with `supabase db push`, on a preview branch first.
3. **Enable anonymous sign-ins** in Supabase Auth, or the wallet-only path has no
   uuid to enroll with.
4. **Deploy the SBT contract** on Arbitrum One and set
   `VITE_SBT_CONTRACT_ADDRESS`. Until it exists, minting correctly refuses.
5. **Set `VITE_ACADEMY_TREASURY_ADDRESS`** to the Arbitrum One address that
   should receive tuition. Crypto checkout is a real wallet transfer as of
   Wave 3 and refuses while this is unset — the previous "working" crypto path
   moved no funds at all.

## P1 — Close the commerce loop (code)

1. **Checkout Edge Function** (`/api/v1/checkout/initiate`). It must be the only
   writer of enrollments. Today a signed-in client can POST an enrollment with
   `applied_promo_code = 'AXIM100'` and get in for free — the RLS insert policy
   cannot tell a validated redemption from a claim. The function should: validate
   the promo through `academy_validate_promo`, price the course, create the
   Stripe session, and only then insert the enrollment as service role.
2. **Stripe webhook** → set `stripe_payment_intent`, `revenue_split_status`, and
   release access on `checkout.session.completed`. The fiat path still enrolls
   the learner as soon as the Stripe session exists, which is one step earlier
   than the money; the webhook is what makes "paid" and "enrolled" the same
   event.
3. **Revenue split settlement.** `academy_enrollments.affiliate_id` and
   `academy_promo_codes.linked_affiliate_id` now carry attribution; nothing pays
   out on them yet.
4. **Credential mint Edge Function** (`/api/v1/credentials/mint`). Verifies the
   on-chain transfer, writes `sbt_mint_status = 'minted'`, and **signs** the
   credential payload. The client-side SHA-256 is tamper evidence; the signature
   is the real fix (see DEBUGGING_NOTES.md).

## P2 — LMS behaviour

1. ~~**Progress is optimistic.**~~ **Done in Wave 4**, then re-read: with Supabase
   configured, `updateProgress` already threw on a rejected upsert and the store
   never took the write. What was actually wrong sat one layer up —
   `InteractiveClassroom.handleComplete` did not await it, so the "Certification
   Complete … logged on the AXiM Ledger" screen rendered regardless. Fixed: the
   call is awaited and the failure is shown. The unconfigured-demo branch still
   marks lessons complete locally; that is the demo, and it is now a deliberate
   one rather than an accident.
2. **Completion had two sources of truth.** Half done in Wave 4.
   `countCompletedLessons()` replaced the `.length` comparison on the client, and
   `fetchEnrollments()` now reads `academy_enrollments` + `academy_progress` back
   from the database on dashboard mount, with the server winning in
   `mergeEnrollments()`. What is left: the client still derives `status:
   'completed'` locally for immediate UI. It should read the trigger's result
   after the last upsert instead of guessing, either by selecting the row back or
   by letting the next `fetchEnrollments()` reconciliation be the only writer of
   `status`. Until then the optimistic value is correct, not authoritative.
3. ~~**Quiz scoring writes `quiz_score: 100` unconditionally.**~~ **Done in Wave
   4.** `scoreQuiz()` measures first-attempt correctness, the score is threaded
   through `QuizEngine` → `InteractiveClassroom` → `Learn` → `updateProgress`,
   and a lesson with no quiz now omits the column instead of asserting a perfect
   score. **Still open:** the value is measured in the browser and written by the
   browser. Moving the progress write behind an Edge Function is what makes it a
   record rather than a claim (see P1.1 for the same argument about enrollment).
4. **Onyx history and per-lesson context.** Context half done in Wave 4:
   `lessonTitle` is now passed, so the tutor sees the lesson it is tutoring.
   Remaining: the transcript lives in the persisted zustand store, which is
   per-browser localStorage, not per-learner history — it does not follow a
   learner to another device and is never sent to the edge for continuity.
5. **Crypto purchases are not reconciled against the treasury.** Open. Wave 3
   stores the hash the wallet returned; nothing verifies the amount arrived, and
   nothing writes `revenue_split_status`. `credentials/mint` and
   `checkout/initiate` should own on-chain verification the same way the Stripe
   webhook owns fiat.

## P3 — Catalogue & admin

1. **Dependabot backlog**: 20 open PRs (was 22). `vite` 5 → 8 (PR #29) cannot
   install at all — `@vitejs/plugin-react@4.7.0` peers `vite@^4 || ^5 || ^6 ||
   ^7` — so `npm ci` fails before lint and the PR can never go green on its own.
   `.github/dependabot.yml` holds `vite` majors back; the migration itself is a
   scheduled task (plugin + `vite.config.js` + a full build), not a merge.
   **Merged 2026-11-04:** the two workflow-only bumps — `actions/checkout`
   4 → 7 (PR #35) and `actions/setup-node` 4 → 7 (PR #36), both green before
   merging, one at a time, which is the order this section prescribes.
   Still open and each needing its own build, never a batch:
   `react-router-dom` 7 (PR #16), `react`/`react-dom` 19 (PR #40 is
   `react-dom` alone — it cannot be merged without `react` 19 in the same
   change), `zustand` 5 (#39), `framer-motion` 14 (#38), `tailwind-merge` 3
   (#37), `eslint` 10 (#42), `eslint-plugin-react-hooks` 7 (#43),
   `autoprefixer` 10.6.2 (#41). The rest are patch bumps inside transitive
   trees and can go in ones and twos.
2. ~~**`academy_courses` has no `category` check**~~ **Addressed in Wave 4** by
   `20261104000000_academy_course_category_check.sql` (normalise → CHECK →
   index), **but not executed**. It is a written migration, not a verified one.
   Run it on a preview branch; if a legacy row cannot be normalised the `ELSE
   'Foundation'` branch will file it under Foundation, so read the affected rows
   before the `UPDATE` runs on anything real.
3. **Admin analytics read local state** (`earnings`, `partners`), not the
   database. Fine for a demo, wrong for a P&L. **Half fixed in Wave 4:** the
   local `earnings` row was computed from `course.price_usd` at enrollment time
   whether or not money moved, so a 100 % internal grant wrote a full-price
   partner earning. `buildRevenueRecord()` now records nothing for a grant and
   marks every row `settled: false`. Still open: the panels read the local
   store, and a crypto enrollment is valued at its USD list price rather than
   the ETH that arrived. Do not report revenue from this before it reads the
   ledger.

## Working agreement reminders

- Branch from `origin/main`, never from a stale local main.
- Prove a test fails before the fix; a test that passes on both sides proves
  nothing.
- Run `npm run lint && npm test && npm run build`, not a subset.
- A migration that has not been executed is not verified.
- One verification file per change under this repo's `AGENTS_VERIFICATION.md`
  header block.
