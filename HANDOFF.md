# ForecastFlow — Handoff Summary

Personal financial **forecasting** platform (not a budgeting app) — projects future balances from
recurring income/expenses, tracks savings goals against target dates, and reports on actual vs.
projected. Single-tenant: one Owner + invited Users, all data strictly private per-user.

- **Live app:** https://jdsi23.github.io/FinTech/
- **Repo:** https://github.com/jdsi23/FinTech (branch `main`)
- **Firebase project:** `fintech-bb12b` (Spark/free plan — **no Cloud Functions**, so `firestore.rules`
  is the only server-side enforcement in the app)
- **Deploy:** GitHub Actions (`.github/workflows/*.yml`) builds on every push to `main` and publishes
  `dist/` to GitHub Pages. Firebase config is injected at build time via GitHub Secrets
  (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
  `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`) — not
  committed to the repo. Locally these live in a `.env` (gitignored).

## Status as of 2026-08-08

All 6 planned phases are complete, built, committed, and previously pushed/deployed. One small bug fix
(goal check-in editing) is committed locally on `main` **but not yet pushed** — see "Current work" below.

## Stack

- React 19 + TypeScript + Vite 8, Tailwind CSS v4
- Firebase 12 (Auth + Firestore only — no Functions, no Storage in use)
- Zustand 5 (auth store), Day.js (dates), Recharts 3 (charts), react-router-dom 7 (`HashRouter` — required
  because GitHub Pages serves static files with no server-side routing)
- `oxlint` for linting
- No test framework is set up; verification has been manual (typecheck + build + live browser check
  against the deployed/dev Firebase project) after every phase

## Architecture

**Routing** (`src/routes/AppRoutes.tsx`): `HashRouter` with one ungated route (`/join/:inviteId`) and
everything else behind a `<Protected>` gate that resolves, in order: auth state ready → an Owner exists
(else show `OwnerSetupPage`) → signed in (else `LoginPage`) → email verified → biometric unlock (only if
this device has a registered credential **and** this page load was a silent session restore, not an
interactive sign-in) → user doc loaded → account has a role (else `AccountIncompletePage`) → not disabled
(else `AccessDisabledPage`, owner exempt).

**State**: `src/store/authStore.ts` (Zustand) holds `firebaseUser`, `userDoc`, `appMeta`, `userDocReady`,
fed by `onAuthStateChanged` + Firestore listeners on `users/{uid}` and `meta/app`. Feature-level data
(income, expenses, merchants, goals) is **not** in the global store — each page loads its own live
subcollection data via the shared `src/lib/useCollection.ts` hook (`onSnapshot` on
`users/{uid}/{collection}`).

**Data flow for finance data**: recurring templates (`IncomeDoc`/`ExpenseDoc`) live one per Firestore doc;
individual calendar occurrences are **computed**, not stored — `src/lib/recurrence.ts` expands a
template into dated occurrences, and `src/features/calendar/calendarMath.ts`
(`buildOccurrenceEntries`) resolves each occurrence's status/amount by checking the template's
`overrides` map (keyed by ISO date `YYYY-MM-DD`) for a per-occurrence exception (`completed` /
`modified` with a different `actualAmount` / `skipped`), defaulting to `scheduled` with the template
amount. This same computed-occurrence approach is reused for weekly goal check-ins (a goal is treated as
a synthetic weekly-recurring item; `checkIns` is a map keyed by ISO week-start date → amount logged that
week, so **`currentSaved(goal)` is always `initialSaved + sum(checkIns)`, never stored as its own
field** — one source of truth, same reasoning as the income/expense overrides map).

**Reports/Search** (Phase 6) are pure read-side views: `reportMath.ts`/`searchMath.ts` compute
aggregations directly from `buildOccurrenceEntries` output plus goals — no new Firestore data beyond a
`tags?: string[]` field added to income/expense docs in Phase 6.

## Firestore data model

```
meta/app                          — singleton, gates first-run "create the Owner" flow
  { ownerUid, setupComplete: true, appName?, defaultInviteExpirationDays? }

users/{uid}
  { email, displayName, role: 'owner'|'user', invitedBy, createdAt, disabled?, startingBalance? }

  users/{uid}/incomeSources/{id}   — private, path-isolated
    { name, amount, date, depositAccount, notes, createdAt,
      recurring, recurringEnabled?, frequency?, customIntervalDays?,
      overrides?: { [isoDate]: { status, actualAmount?, notes? } }, tags?: string[] }

  users/{uid}/expenses/{id}        — private, path-isolated
    { merchant, category, amount, date, paymentMethod, notes, createdAt,
      recurring, recurringEnabled?, frequency?, customIntervalDays?,
      overrides?: {...same shape...}, tags?: string[] }

  users/{uid}/merchants/{id}       — private, path-isolated (autocomplete history)
    { name, createdAt }

  users/{uid}/goals/{id}           — private, path-isolated
    { name, goalType: 'short_term'|'long_term', category, icon, color,
      initialSaved, targetAmount, targetDate, notes,
      strategy: 'on_time'|'slightly_early'|'asap', evenSoonerEnabled?,
      startDate, checkIns: { [isoWeekStart]: amount }, createdAt }

invites/{inviteId}                — Owner-managed, pre-auth readable by id for /join links
  { role, singleUse, used, usedBy, usedAt, expiresAt, createdBy, createdAt }
```

**Security model** (`firestore.rules`, full file at repo root): no Cloud Functions exist, so this file is
the *entire* server-side enforcement layer.
- `meta/app`: publicly `get`-able (pre-auth clients need to know if an Owner exists); `create` only
  allowed once, by the creator, with exactly `{ownerUid, setupComplete}`; `update` restricted to Owner,
  and only to `appName`/`defaultInviteExpirationDays` (the two permanent fields can never change).
- `users/{uid}`: two disjoint `create` paths — **Path A** (become Owner) only works while `meta/app`
  doesn't exist yet, closed forever the instant the first Owner doc + meta/app are created in the same
  transaction; **Path B** (redeem invite) validates the invite is unused/unexpired and the role matches
  what the invite grants, in the same transaction that flips the invite to `used`. Firestore's
  before-transaction-state semantics for `get()`/`exists()` make both paths race-safe. Self `update` is
  limited to `displayName`/`startingBalance` (no self-promotion). Owner-only `update` can toggle
  `disabled` on any non-Owner user. No `delete` on users ever.
- `users/{uid}/{incomeSources,expenses,merchants,goals}/{id}`: `allow read, write: if request.auth.uid ==
  uid` — full read/write for the owner, **not even the Owner role** can read another user's finance
  subcollections (deliberately stricter than the `users`/`invites` top-level collections, which the Owner
  legitimately needs to administer).
- `invites/{id}`: pre-auth `get` (so unauthenticated visitors can validate a `/join/{id}` link before
  creating an account); `list` Owner-only; `create` Owner-only with required initial shape; `update`
  (redemption) allowed to any signed-in user but only flips `used`/`usedBy`/`usedAt` on a currently
  unused, unexpired invite; `delete` (revoke) Owner-only.

## Completed phases (all live)

1. **Auth/Invites** — Firebase Auth (email/password + Google), first-run Owner bootstrap, invite-only
   registration via `/join/{inviteId}` links, email verification gate.
2. **Biometric device unlock** — WebAuthn (`src/features/biometrics/webauthn.ts`) wrapper for
   Face ID/Windows Hello/fingerprint as an *additional* local unlock on top of Firebase Auth, only
   triggered on silent session restore (not on interactive sign-in, since you just proved identity).
3. **Control Center** (Owner-only) — user management (enable/disable, view), invite management, system
   info, backup (manual export), app settings (name, default invite expiration).
4. **Income, Expenses & Calendar** — recurring income/expense templates with per-occurrence
   status/amount overrides, month-grid calendar, `DailyView` modal for marking occurrences
   Complete/Skip/Edit-amount/Undo, `ManageItemsList` for editing/deleting templates directly.
5. **Dashboard + Goals** — projected balance dashboard (`SegmentedBar` visualization), savings goals with
   three pacing strategies (On Time / Slightly Early [-3wk] / ASAP [-6wk]) plus an optional "Even Sooner"
   progressive stretch target (+5% week 1, +1%/week, capped at +20%) for Slightly Early goals, adaptive
   weekly-suggested-amount recalculated fresh from actual progress each render, weekly check-ins
   integrated into the Calendar's `DailyView`.
6. **Reports + Search** — 6 report views (Income vs Expenses, Cash Flow, Merchant Spending, Category
   Spending, Forecast Accuracy, Goal Progress) over a date-range selector, all computed from the same
   occurrence engine rather than separate aggregation logic; cross-entity Search (income + expenses +
   goals in one result list) across 7 dimensions (merchant, category, goal name, date range, payment
   type, status, tags). Net Worth report was deliberately excluded — the spec marked it "(Future)"
   explicitly, unlike the other six.

## Key design decisions worth knowing

- **No stored aggregates** — `currentSaved`, occurrence status/amount, everything derivable is derived at
  render time from templates + override/check-in maps. Avoids dual-source-of-truth bugs.
- **Path-based Firestore isolation** for finance data instead of an `ownerId` field + rule check — makes
  "even the Owner can't read your data" trivial to express and impossible to get wrong via a query.
  Contrast with `users`/`invites`, which are intentionally Owner-readable admin collections.
- **HashRouter, not BrowserRouter** — GitHub Pages has no server-side rewrite rules for client-side
  routing, so path-based routing would 404 on refresh/deep-link.
- **Recharts over Chart.js/etc.** — was the spec's explicit choice; `src/lib/chartColors.ts` exists solely
  because Recharts needs real hex values, not Tailwind classes, so it mirrors
  `src/lib/paymentMethods.ts`'s palette in hex.
- **Tags added in Phase 6**, not earlier — Search's spec'd 7 dimensions included Tags, which didn't exist
  in the schema until then; added as `tags?: string[]` on the shared `RecurringFields` interface so both
  Income and Expense got it for free.

## Known issues / gaps

- **None currently open.** The only outstanding bug report (goal check-in editing, see below) was fixed
  this session.
- No automated tests exist — all verification has been manual (typecheck, build, live browser check).
  If continuing this project long-term, consider adding at least unit tests for `recurrence.ts` and
  `goalMath.ts`, since those are the two files where a silent math error would be hardest to notice.
- The main JS bundle is ~1.08 MB (~311 KB gzipped) and Vite warns about chunk size on every build. Not
  addressed — would need route-level `dynamic import()` code-splitting if it becomes a real problem
  (currently just a build-time warning, not a reported user issue).

## Current work (uncommitted context for the next session)

**Bug reported by user:** *"only bug im seeing is with the savings goal check ins options not having a
edit amount and or toggle for the even sooner feature"* — in the Calendar's `DailyView`, the Weekly Goal
Check-ins card showed a static "Logged: $X" with no way to correct a mistaken entry, and Even Sooner could
only be toggled by navigating away to Goals → edit goal → GoalForm's checkbox (`GoalForm.tsx`, only
rendered when `strategy === 'slightly_early'`).

**Fix applied this session** (commit `81abc3d`, **on `main` locally, not yet pushed**):
- `src/features/calendar/DailyView.tsx` — the goal check-in card's amount `<input>` is now always
  editable (pre-filled with the logged amount if one exists), with the button label switching
  Log → Update; an "Undo" button appears alongside once a check-in exists; a Slightly Early goal now
  shows an inline "Even Sooner" checkbox next to the goal name, wired directly to `updateGoal()`.
- `src/features/goals/actions.ts` — added `clearCheckIn(uid, goalId, weekKey)` (uses Firestore
  `deleteField()`) to back the new Undo button. `logCheckIn()` was already overwrite-safe (Firestore
  dot-path `updateDoc` just sets the value), so editing an amount needed no data-layer change — only the
  UI needed to stop hiding the input once a value existed.
- Verified: `npx tsc -b` clean, `npm run build` clean. **Not yet verified live in the browser** — this
  session's browser tooling had no cached login session and entering the user's password is outside what
  I'll do autonomously, so a live click-through against the deployed/dev app is still worth doing before
  or shortly after pushing.

## Exact next steps

1. **User should do a quick live sanity check** of the fix (or ask the assistant to, once logged into a
   browser tab): open Calendar → a day with a Slightly Early goal's weekly check-in due → log an amount →
   confirm it now shows editable rather than locked, re-log a different amount and confirm it updates,
   click Undo and confirm it clears back to the empty-input state, toggle the Even Sooner checkbox and
   confirm it persists (check the Goals page reflects the same toggle state).
2. **Push when the user says "push it"** — this repo's established pattern all session: commit locally
   always, but only push (which triggers the GitHub Actions deploy) after an explicit go-ahead each time.
   `git log` currently shows `81abc3d` as the tip, one commit ahead of `origin/main`.
3. After pushing, watch the Actions run (`gh run list` / `gh run watch`) and spot-check
   https://jdsi23.github.io/FinTech/ once deployed.
4. No other open feature work is queued — all 6 phases are done. Next steps depend on what the user asks
   for next (e.g. Net Worth report, if they revisit the "(Future)" item; automated tests; bundle
   size/code-splitting if it becomes a real concern).
