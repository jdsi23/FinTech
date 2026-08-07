# ForecastFlow

ForecastFlow is a personal financial **forecasting** platform — not a budgeting app, not
accounting software. It answers questions like "what will my balance look like next week?"
and "am I on track for my savings goals?" It's built with React, TypeScript, and Firebase,
hosted for free on GitHub Pages.

This README documents **every manual step** needed to get the project running, from a
completely empty machine to a live, deployed app. Follow it in order the first time.

> **Project status: Phase 3 of many.** Phase 1 built the toolchain, hosting pipeline, and the
> invite-only account system. Phase 2 added optional biometric device unlock. Phase 3 (this
> one) fills out the rest of the Control Center: User Management, Database & System Info,
> Backup Management, and App & Security Settings. The Dashboard, Calendar, and Goals screens
> are still blank placeholders — that's the next phase.

---

## 1. Install the required programs

You only need to do this once per machine.

1. **Node.js** (JavaScript runtime + package manager). Download the **LTS** version from
   [nodejs.org](https://nodejs.org) and run the installer, accepting the defaults. This also
   installs `npm`.
   - Verify it worked by opening a terminal and running:
     ```bash
     node -v
     npm -v
     ```
2. **Git** (version control). Download from [git-scm.com](https://git-scm.com) and install
   with default options. Verify with:
   ```bash
   git --version
   ```
3. A **GitHub account** — [github.com/signup](https://github.com/signup) if you don't have one.
4. A **Google account** — used to create your free Firebase project.
5. (Recommended) **VS Code** as your code editor — [code.visualstudio.com](https://code.visualstudio.com).

---

## 2. Get the project running locally

Open a terminal in the project folder, then run:

```bash
npm install
```

This downloads all the libraries the project depends on (React, Firebase, etc.) into a
`node_modules` folder. You'll see this step again any time `package.json` changes.

At this point `npm run dev` will start, but the app will show a "Firebase configuration
missing" screen — that's expected. You need your own Firebase project first (next section).

---

## 3. Create your Firebase project (free "Spark" plan)

Firebase is the backend: it stores your login and your financial data. Everything here stays
on the **free Spark plan** — no credit card, no paid tier required.

1. Go to the [Firebase Console](https://console.firebase.google.com) and sign in with your
   Google account.
2. Click **Add project**. Name it anything (e.g. "ForecastFlow"). You can disable Google
   Analytics for this project — it isn't needed.
3. Once the project is created, click the **Web** icon (`</>`) to register a web app. Give it
   a nickname (e.g. "ForecastFlow Web"). You do **not** need Firebase Hosting — we use
   GitHub Pages instead.
4. Firebase will show you a `firebaseConfig` object with values like `apiKey`, `authDomain`,
   etc. **Keep this tab open** — you'll copy these values in step 4 below.

### 3a. Enable Authentication providers

1. In the left sidebar, go to **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable:
   - **Email/Password** — toggle it on and save.
   - **Google** — toggle it on, choose a support email, and save.

### 3b. Create the Firestore database

1. In the left sidebar, go to **Build → Firestore Database → Create database**.
2. Choose **Start in production mode** (the app ships its own security rules — see step 5).
3. Pick a region close to you (any region works; you can't change it later).

### 3c. Copy your config into `.env.local`

1. In the project folder, copy `.env.example` to a new file named `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in each value from the `firebaseConfig` object you saw in
   Firebase Console (Project settings → General → Your apps, if you closed the tab):
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
3. `.env.local` is already excluded from git (via `.gitignore`) — never commit it, and never
   remove it from `.gitignore`. (These values aren't secret in the sense of a password — they
   end up in the public JS bundle — but Firestore Security Rules, not these values, are what
   actually protects your data. Still, keep them out of git as good hygiene.)
4. Restart `npm run dev` if it's running. You should now see the **"Welcome to
   ForecastFlow / Create Owner account"** screen instead of the config-missing screen.

---

## 4. Deploy the Firestore security rules

The app ships with `firestore.rules`, which is the **only** thing enforcing that users can't
read each other's data (there's no backend server — see "Why no backend?" below). You must
deploy these rules to your Firebase project before using the app for real.

1. Install the Firebase CLI globally (one-time, per machine):
   ```bash
   npm install -g firebase-tools
   ```
2. Log in:
   ```bash
   firebase login
   ```
   This opens a browser window to authorize the CLI with your Google account.
3. From the project folder, connect the CLI to your Firebase project:
   ```bash
   firebase use --add
   ```
   Select the project you created in step 3, and give it the alias `default` when prompted.
   This creates a `.firebaserc` file recording your project ID — it's fine to commit, since
   your project ID isn't sensitive (it's already visible in `authDomain`/`storageBucket`).
4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   Re-run this command any time `firestore.rules` changes.

### Why no backend?

Firebase's free "Spark" plan does not include Cloud Functions (server-side code) — that
requires the paid "Blaze" plan, even if your usage stays at $0. To keep this project
completely free, all logic (like "an invite can only be used once") is enforced directly by
Firestore's security rules instead of server code. This is why `firestore.rules` looks more
involved than a typical "just check if the user is logged in" rules file.

---

## 5. Create the GitHub repository

1. On [github.com](https://github.com), click **New repository**. Name it whatever you like
   (this README assumes `FinTech` to match the current folder — see the callout below if you
   pick a different name). Leave it empty (no README/gitignore from GitHub — this project
   already has them).
2. Back in your terminal, in the project folder:
   ```bash
   git init
   git add .
   git commit -m "Phase 1: scaffold, auth, owner bootstrap, invites"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

> **⚠️ If you name your repo anything other than `FinTech`:** open
> [`vite.config.ts`](vite.config.ts) and change the `base: '/FinTech/'` line to
> `base: '/<your-repo-name>/'`, exactly matching the repo name's capitalization. GitHub Pages
> serves this project from a sub-path (`your-username.github.io/<repo-name>/`), and this
> setting has to match exactly or the deployed site will load a blank page.

---

## 6. Turn on GitHub Pages

1. In your new GitHub repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions** (not "Deploy from a
   branch").

That's it — no branch to create manually. The workflow in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) handles building and deploying.

---

## 7. Add your Firebase config as GitHub Actions secrets

The deploy workflow needs the same six `VITE_FIREBASE_*` values from your `.env.local` so it
can build the production site. GitHub Actions secrets keep them out of your repo's source
code (though again, these are not sensitive credentials — Firestore Rules are the real
protection).

1. In your GitHub repo, go to **Settings → Secrets and variables → Actions**.
2. Click **New repository secret** and add each of these six, with the same values as your
   `.env.local`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

---

## 8. First deploy

Push to `main` (if you haven't already from step 5) — this triggers the workflow
automatically. Watch it run under the **Actions** tab of your repo. Once it finishes (green
checkmark), your site is live at:

```
https://<your-username>.github.io/<your-repo-name>/
```

### Authorize the domain in Firebase

The first time you open the deployed site and try to sign in, Firebase will block it with an
`auth/unauthorized-domain` error — this is expected. Fix it once:

1. Firebase Console → **Authentication → Settings → Authorized domains**.
2. Click **Add domain** and add `<your-username>.github.io`.

---

## 9. First-run: create the Owner account

Open your deployed site (or `http://localhost:5173` locally). Since no Owner exists yet,
you'll see **"Welcome to ForecastFlow — Create Owner account."** The account you create here
becomes the permanent Owner, and this screen will never appear again for anyone (a single
`meta/app` document in Firestore permanently locks this).

1. Fill in your name, email, and password (or use "Continue with Google").
2. Check your email and click the verification link (email/password only — Google accounts
   are considered verified automatically).
3. You're now signed in as the Owner. You'll see the Dashboard/Calendar/Goals shell and a
   **Control Center** link in the top nav.

## 10. Inviting other users

There is no public sign-up — the spec calls for invite-only registration.

1. As the Owner, click **Control Center** in the top nav (this takes you to Invite
   Management — the only Control Center screen built so far).
2. Set an expiration (in days) and click **Create invite**.
3. Click **Copy link** next to the new invite and send it to the person you're inviting.
4. They open the link, fill in their name/email/password (or use Google), verify their email,
   and land in the app as a regular user. The link stops working the instant it's used.

---

## 11. Enabling biometric unlock (optional)

Once you're signed in, click **Account** in the top nav to reach **Account & Security**. If your
browser/device supports it, you can click **Enable on this device** to set up Face ID, Windows Hello,
or a fingerprint as a shortcut for reopening the app on that specific device.

**What this actually does — read this before relying on it.** This is a convenience *unlock gate* for
a browser session that's already signed in, not a new way to authenticate with Firebase. You will
always still be able to sign in with your email and password (or Google) — biometrics never replace
that, per the original spec. Concretely:

- It's per-device and per-browser. Setting it up on your laptop's Chrome doesn't enable it on your
  phone, or even in a different browser on the same laptop — you'd enable it separately on each.
- The only thing it changes is what happens when you *reopen* the app with an already-remembered
  session (i.e. you checked "Remember me" previously): instead of dropping you straight into the app,
  it asks for Face ID/Windows Hello/fingerprint first. A fresh sign-in with your password or Google
  always skips this prompt, since you just proved who you are.
- If the prompt fails, is cancelled, or times out, you get **Try again** or **Use password instead** —
  the latter signs out and returns you to the normal sign-in screen, exactly as the spec describes.
- There's no server involved in checking this (see "Why no backend?" above — same constraint). Your
  browser's own WebAuthn implementation enforces the actual biometric/PIN check; we just trust that a
  successful result means it passed. This protects your account if someone picks up your unlocked
  laptop or phone. It does **not** add protection against someone with direct access to your browser's
  local storage extracting the underlying Firebase session — that's a ceiling inherent to a project
  with no backend server, the same trade-off the invite system makes.

You can disable it on a given device any time from the same Account & Security page.

---

## 12. The rest of Control Center

Clicking **Control Center** now opens a landing page linking to five screens instead of going straight
to Invite Management.

- **User Management** — lists everyone with an account (name, email, role, join date, status), and
  lets you **Disable**/**Enable** any non-Owner user. Disabling blocks their access to the app itself,
  but it does **not** delete their sign-in credentials — there's no way to delete another person's
  Firebase Auth account from the client without a backend, so a disabled person can still reach the
  sign-in screen, they just can't get past it. There's also no way to promote a regular user to Owner
  from this screen — the single-Owner model set up in Phase 1 is intentional and stays that way.
- **Database & System Info** — live counts of users (by role) and invites (active/used/expired), your
  Firebase project ID, and direct links into the Firebase Console.
- **Backup Management** — a **Download backup** button that exports every `users` and `invites`
  document into a JSON file. There's no restore button: writing that data back would mean bulk-writing
  other people's account records past the security rules that exist specifically to prevent that, so
  treat the download as a point-in-time export to keep somewhere safe, not a live backup/restore system.
- **App & Security Settings** — set a custom app name (replaces "ForecastFlow" in the header for
  everyone) and the default expiration used when creating new invites. Also includes a read-only
  summary of the app's actual security model — Firestore Rules as the only enforcement, email
  verification, invite-only registration, and where biometric unlock is managed — rather than toggles
  for things this app doesn't actually have a backend to enforce.

**Before any of this works against your real project, redeploy the updated rules** (same command as
step 4):

```bash
firebase deploy --only firestore:rules
```

Phase 3 added two rules changes: an owner-only update path on `meta/app` (for App Settings) and an
owner-only update path on `users/{uid}` limited to the `disabled` field (for User Management, and
never usable on the Owner's own document).

---

## Folder structure

```
├── .github/workflows/deploy.yml   # builds + deploys to GitHub Pages on push to main
├── firestore.rules                # the ONLY server-side security enforcement (no backend)
├── firebase.json                  # tells the Firebase CLI where to find firestore.rules
├── .env.example                   # template for .env.local (never commit .env.local itself)
├── src/
│   ├── lib/firebase.ts            # Firebase SDK initialization (auth, db)
│   ├── types/firestore.ts         # TypeScript types mirroring the Firestore schema
│   ├── store/authStore.ts         # Zustand store: current user, role, app setup state
│   ├── features/
│   │   ├── auth/                  # Login, email verification, shared auth actions
│   │   ├── setup/                 # First-run Owner creation screen
│   │   ├── invites/               # Invite redemption (/join/:id) + Owner's invite manager
│   │   ├── biometrics/            # WebAuthn wrapper, unlock gate, Account & Security page
│   │   └── control-center/        # User Management, System Info, Backup, Settings (owner-only)
│   ├── routes/AppRoutes.tsx       # All routing + the auth/owner/verification guard logic
│   ├── pages/                     # Dashboard, Calendar, Goals — placeholders for now
│   └── components/                # Shared UI: AuthLayout, form fields, buttons, AppShell
```

---

## Testing this phase

### Local checklist (run `npm run dev`)

1. With a fresh Firestore database, loading the app shows **Create Owner account**, not a
   login screen.
2. After creating the Owner account and verifying your email, you land in the app shell with
   a **Control Center** link.
3. Open the app in an incognito window — you should now see the normal **Sign in** screen
   (not Owner setup), since `meta/app` now exists.
4. Signing out and trying to visit the app while logged out redirects to **Sign in**.
5. As the Owner, create an invite in Control Center and copy its link.
6. Open the invite link in an incognito window, sign up, verify the email — you should land
   in the app as a regular user (no Control Center link visible).
7. Reload the same invite link again (or have a second person try it) — it should now say the
   invite has already been used.
8. In the Firebase Console → Firestore, confirm there are two documents under `users/`, with
   `role: "owner"` and `role: "user"` respectively.

### Biometric unlock checklist (needs a device with Face ID / Windows Hello / a fingerprint reader)

1. Sign in normally — no biometric prompt appears (a fresh sign-in never triggers it).
2. Go to **Account** → **Account & Security** → **Enable on this device**. Complete the OS
   prompt. Status should flip to "Enabled."
3. Reload the page. You should now see **Unlock ForecastFlow** instead of the app.
4. Complete the biometric prompt successfully — you land back on the Dashboard.
5. Reload again and this time cancel the prompt — you should see **Try again** and **Use
   password instead**. Clicking the latter signs you out and shows the normal Sign in screen.
6. Sign back in, return to Account & Security, click **Disable on this device**, reload once
   more — you should go straight to the app with no prompt, same as before you enabled it.

### Control Center checklist (deploy the updated rules first — see step 12)

1. As the Owner, **Control Center** opens a landing page with five links.
2. **User Management** lists the Owner and any invited user(s); the Owner's row has no
   Disable control, but other rows do.
3. Disable a non-owner user, then in an incognito window signed in as that user, confirm you
   see **Access disabled** instead of the app. Re-enable them and reload — access returns.
4. **Database & System Info** counts match what you see in User/Invite Management.
5. **Backup Management** → **Download backup** produces a `.json` file containing the users
   and invites you expect.
6. **App & Security Settings**: change the app name, save, confirm the header updates
   immediately; change the default invite expiration, save, then open **Invite Management**
   fresh and confirm the "Expires in" field is pre-filled with your new value instead of `7`.

### Verify the deployed site

Repeat steps 1–2 against your live GitHub Pages URL. If you already created the Owner
account while testing locally (against the same Firebase project), the deployed site will
correctly show the normal Sign in screen instead — that's expected, since both point at the
same Firestore database.

---

## Troubleshooting

| Problem | Likely cause / fix |
|---|---|
| "Firebase configuration missing" screen | `.env.local` doesn't exist or is missing a value — see step 3c. |
| Blank white page on the deployed site | `base` in `vite.config.ts` doesn't match your repo name exactly (case-sensitive). See the callout in step 5. |
| `auth/unauthorized-domain` error when signing in | Add your domain under Firebase Console → Authentication → Settings → Authorized domains (step 8). `localhost` is authorized by default; your GitHub Pages domain is not, until you add it. |
| `permission-denied` errors in the browser console | Either the security rules haven't been deployed yet (`firebase deploy --only firestore:rules`), or the rules are correctly blocking something they should block — check what operation was attempted against `firestore.rules`. |
| GitHub Actions build fails on the "Build" step | Usually a missing/misnamed repository secret — double check all six `VITE_FIREBASE_*` secrets exist and match your `.env.local` exactly (step 7). |
| Invite link shows "invite is not valid" immediately | The invite ID in the URL doesn't match a document in Firestore — check you copied the whole link, and that the rules have been deployed. |
| Google sign-in popup closes immediately / does nothing | Common on some browsers/ad-blockers with popups. Try disabling popup blockers for the site, or use email/password instead. |
| "Enable on this device" is missing / shows "not supported" | Your browser or device doesn't support WebAuthn platform authenticators, or you're not on HTTPS/localhost (WebAuthn requires a secure context — both `localhost` dev and the deployed GitHub Pages site qualify). |
| Biometric unlock prompt never appears after reload, even though it's enabled | It only triggers on a *silently restored* session — if you just signed in interactively this page-load, it's intentionally skipped. Also check "Remember me" was checked at sign-in; without it there's no persisted session to restore in the first place. |
| `permission-denied` when disabling a user or saving Settings | The Phase 3 rules haven't been deployed yet — run `firebase deploy --only firestore:rules` (step 12). |
| Disabling a user doesn't seem to do anything | It blocks *app* access, not their ability to reach the sign-in screen — there's no way to delete another person's Firebase Auth account from the client. Confirm you're checking whether they can get *past* sign-in, not whether sign-in itself is unreachable. |

---

## Future maintenance

- **Updating dependencies:** `npm outdated` to see what's behind, `npm update` for
  non-breaking updates. Test locally with `npm run dev` before pushing.
- **Redeploying:** just push to `main` — GitHub Actions handles the rest.
- **Changing security rules:** edit `firestore.rules`, then run
  `firebase deploy --only firestore:rules`. Rule changes are **not** deployed automatically by
  GitHub Actions — they're a separate, deliberate step since they control data access.
- **Rotating a Firebase config value:** if you ever suspect it's been misused, you can
  regenerate it in Firebase Console → Project settings, then update it in both `.env.local`
  and your GitHub Actions repository secrets.
- **Backups:** Control Center → Backup Management gives a one-click JSON export of `users`/
  `invites`. For a full database export (including anything future phases add), use the
  Firebase Console (Firestore → Import/Export) instead.

---

## What's next

Phase 1 covered the scaffold, hosting pipeline, and invite-only auth system. Phase 2 added optional
biometric device unlock. Phase 3 (this one) completed the Control Center. Later phases (not yet built)
add: the Dashboard's financial summary, the forecasting Calendar, Income/Expenses, Goals with savings
strategies, and Reports.
