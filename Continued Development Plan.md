# Continued Development Plan — AXiM Academy

Last reconciled: 2026-11-02 (end of Wave 2).

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

## P1 — Close the commerce loop (code)

1. **Checkout Edge Function** (`/api/v1/checkout/initiate`). It must be the only
   writer of enrollments. Today a signed-in client can POST an enrollment with
   `applied_promo_code = 'AXIM100'` and get in for free — the RLS insert policy
   cannot tell a validated redemption from a claim. The function should: validate
   the promo through `academy_validate_promo`, price the course, create the
   Stripe session, and only then insert the enrollment as service role.
2. **Stripe webhook** → set `stripe_payment_intent`, `revenue_split_status`, and
   release access on `checkout.session.completed`.
3. **Revenue split settlement.** `academy_enrollments.affiliate_id` and
   `academy_promo_codes.linked_affiliate_id` now carry attribution; nothing pays
   out on them yet.
4. **Credential mint Edge Function** (`/api/v1/credentials/mint`). Verifies the
   on-chain transfer, writes `sbt_mint_status = 'minted'`, and **signs** the
   credential payload. The client-side SHA-256 is tamper evidence; the signature
   is the real fix (see DEBUGGING_NOTES.md).

## P2 — LMS behaviour

1. **Progress is optimistic.** `updateProgress` marks the lesson complete in the
   store even when the network call fails (the row is skipped, the UI is not).
   Needs a queue with retry, or a rollback on failure.
2. **Completion is computed client-side** from a lesson count match; the
   `check_course_completion` trigger does the same server-side. Two sources of
   truth for "completed". Pick the trigger and make the client read it.
3. **Quiz scoring writes `quiz_score: 100` unconditionally.** The `QuizEngine`
   knows the real score; pass it through `buildProgressPayload`.
4. **Onyx history is not persisted** across reloads, and the assistant has no
   per-lesson context beyond the title.

## P3 — Catalogue & admin

1. **Dependabot backlog**: 16 open PRs. The `vite` 5 → 8 and
   `react-router-dom` 6 → 7 bumps are majors that need a build run each, not a
   batch merge. Do them one at a time with `npm run lint && npm test && npm run
   build` after each.
2. **`academy_courses` has no `category` check** — the migration seeds tracks but
   nothing stops a new row landing in `Foundaton`. Add a CHECK or a lookup table.
3. **Admin analytics read local state** (`earnings`, `partners`), not the
   database. Fine for a demo, wrong for a P&L.

## Working agreement reminders

- Branch from `origin/main`, never from a stale local main.
- Prove a test fails before the fix; a test that passes on both sides proves
  nothing.
- Run `npm run lint && npm test && npm run build`, not a subset.
- A migration that has not been executed is not verified.
- One verification file per change under this repo's `AGENTS_VERIFICATION.md`
  header block.
