# Firebase rebuild — architecture & setup

This is the Firebase version of the Skye Dental Clinic system: Firestore instead of
SQLite, Cloud Functions instead of an Express server, and real Firebase Auth instead of
the name/role switcher. The original Express + SQLite version is still in `backend/` and
still works standalone if you ever want to fall back to it — this rebuild doesn't touch it.

## What changed, and why

| Before (Express + SQLite) | Now (Firebase) |
|---|---|
| `backend/` REST API | Firestore accessed directly from the frontend via the client SDK |
| Doctor PIN check in an Express route | `verifyDoctorPin` / `verifyPayment` Cloud Functions (Admin SDK, PIN hashes never leave the server) |
| Name/role switcher, no real login | Real Firebase Auth (email + password), role read from a `staff/{uid}` Firestore doc |
| One `logAudit()` call per route handler | Written directly by the frontend `api/*.ts` modules (see "Audit logging" below for why this isn't a Cloud Functions trigger) |
| Polling every 15s for the pending-payments badge | Same polling today - Firestore's `onSnapshot` live queries would remove this cleanly, noted under "What to improve next" |

The frontend's `src/api/*.ts` modules keep the **exact same function signatures** as the
REST version (`patientsApi.list()`, `treatmentsApi.create()`, etc.) - only their internals
changed. That's why almost no page or component file needed to change: they only ever
called through this layer, never `fetch` directly.

## Running it locally

You need three things running at once:

```bash
# 1. Firebase emulators (Firestore + Functions + Auth) - from D:\Dental
firebase emulators:start --only firestore,functions,auth

# 2. Seed demo data (first time, or after an emulator restart wipes data)
cd functions
node seed-emulator.js

# 3. Frontend - from D:\Dental\frontend
npm run dev
```

The frontend automatically points at the local emulators (`VITE_USE_FIREBASE_EMULATOR`
defaults to using them) — it never touches a real Firebase project unless you configure one
(see "Going live" below).

### Demo accounts

| Email | Password | Role |
|---|---|---|
| ana@skyedental.test | password123 | assistant |
| maria.santos@skyedental.test | password123 | dentist |
| carlos.reyes@skyedental.test | password123 | dentist |
| admin@skyedental.test | password123 | admin |

Doctor PINs for payment verification: **Dr. Maria Santos → 1234**, **Dr. Carlos Reyes → 5678**
(separate from the login above — a dentist's login gets them into the app, their PIN is
what a payment is verified against, matching the original design intent).

**The emulator suite has no persistent storage** — every restart wipes Firestore and Auth
back to empty, so you'll need to re-run `node seed-emulator.js` (and log in again) each time
you restart it.

## Cloud Functions

Five callable functions in `functions/index.js`, all requiring the caller to be signed in:

- **`verifyDoctorPin`** / **`verifyPayment`** — the security-critical PIN check. Given only a
  PIN, it checks it against every active doctor's salted hash (`scrypt`, stored in a
  separate `doctor_secrets` collection that Firestore rules block all client access to) and
  returns whichever doctor it belongs to. 5 wrong attempts locks that doctor's PIN for 15
  minutes. `verifyPayment` does this plus atomically updates the payment and writes the
  audit entry.
- **`createDoctor`** / **`updateDoctor`** — hash a PIN server-side; the client never computes
  or sees a hash.
- **`createStaffAccount`** — creates a real Firebase Auth login + `staff/{uid}` doc. Only
  callable by an existing admin (checked against the caller's own `staff` doc).

### A real gotcha we hit: firebase-functions v7 doesn't work in this local setup

`functions/package.json` pins **`firebase-functions@6.0.1`** and **`firebase-admin@12.6.0`**
deliberately — not because they're the "correct" versions, but because v7 (the latest as of
this build) crashes on *every single invocation* in the local emulator on this machine,
callable functions and Firestore triggers alike, with an opaque "function was killed because
it raised an unhandled error." v6 works perfectly. This may be specific to this
Windows/Node 22/firebase-tools combination — worth retesting with a newer firebase-tools
release before assuming it's fixed, but don't upgrade blindly; verify a real PIN
verification round-trip afterward.

## Audit logging: written by the client, not a Cloud Functions trigger

The original plan was Firestore triggers (`onDocumentCreated` on `patients`, `treatments`,
etc.) writing to `audit_logs` automatically and tamper-resistantly. That hit the same v7
crash above, and even reverting to v6 didn't fully rule out trigger-specific flakiness in
this emulator, so audit logging for routine CRUD (patient registered, treatment recorded,
tooth updated, consent prepared/signed) is now written directly by the frontend `api/*.ts`
modules right after each successful write — same trust level the original Express version
already had (an Express route handler calling `logAudit()` isn't cryptographically
tamper-proof either).

The genuinely security-critical audit entries — PIN lockouts, payment verification — **are**
written server-side, inside the `verifyDoctorPin`/`verifyPayment` Cloud Functions, since
those already run with Admin SDK privileges for the PIN check itself.

Firestore rules (`firestore.rules`) only allow `create` on `audit_logs`, never `update` or
`delete` — so even client-written entries can't be edited or erased once written.

## Data model

Firestore collections mirror the old SQL tables closely, on purpose (same snake_case field
names, same shapes) so the migration touched only the data-access layer:

`doctors` (public profile) + `doctor_secrets` (PIN hash, client access denied entirely) ·
`patients` · `medical_histories` (doc id = patient id) · `dental_exams` (doc id = patient id) ·
`tooth_records` (append-only, latest per tooth computed client-side) · `treatments` ·
`payments` (status can only move to `verified` via the Cloud Function - see
`firestore.rules`) · `consents` (immutable once `status: 'signed'`, enforced by rules) ·
`audit_logs` (create-only) · `staff` (uid-keyed, role for each login) · `counters`
(transactional patient-code sequence).

## Going live (a real Firebase project)

Everything above runs against the local emulator suite with a fake `skye-dental-demo`
project id — nothing has been deployed anywhere, and I can't create a real Firebase project
or deploy to one myself (that needs your Google account). When you're ready:

1. `firebase login` (your Google account), then `firebase projects:create` or pick an
   existing project, and update `.firebaserc`'s `"default"` to that project id.
2. In the Firebase Console, enable **Firestore**, **Authentication → Email/Password**, and
   **Functions** (Functions requires the Blaze pay-as-you-go plan — usage at this clinic's
   scale should stay within the free quota, i.e. $0, but Blaze must be enabled to deploy
   Functions at all).
3. Copy your project's web app config into `frontend/.env.local`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_USE_FIREBASE_EMULATOR=false
   ```
4. Deploy: `firebase deploy --only firestore:rules,firestore:indexes,functions` from
   `D:\Dental`, then `npm run build` in `frontend/` and `firebase deploy --only hosting`.
5. Create your first real admin account by hand (the emulator seed script's
   `addStaffAccount` pattern, run once against your real project with `firebase-admin` and a
   service account key) — `createStaffAccount` requires an *existing* admin to call it, so
   the very first one has to be created outside the app.

## What to improve next

- Replace the pending-payments badge's 15-second poll with a Firestore `onSnapshot` live
  query — this is Firestore's actual advantage over the old REST API and isn't used yet.
- Retry a firebase-functions v7 upgrade periodically; if it stops crashing, moving audit
  logging back to Firestore triggers would make it tamper-resistant again.
- Storage Security Rules / Firebase Storage if consent signatures or exam photos ever need
  to move out of inline base64 Firestore fields (fine at today's scale, would matter at a
  few hundred consents with large signatures).
