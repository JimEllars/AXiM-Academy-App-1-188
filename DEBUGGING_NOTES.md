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
