# Skye Dental Clinic — Clinic Monitoring System

A clinic monitoring web app for patient information, medical/dental history, an interactive
tooth chart, digital dental consent (signed on a tablet, no signature pad needed), and
treatment/payment tracking with doctor PIN verification.

> **Two backends exist side by side.** The system now runs on **Firebase** (Firestore +
> Cloud Functions + real Auth) — see **[FIREBASE.md](FIREBASE.md)** for how to run and
> deploy it; that's the one to use going forward. The original Express + SQLite backend in
> `backend/` still works standalone if needed, but isn't the active version. The rest of
> this file describes that original REST-based build for reference.

## Stack (original Express version)

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4, React Router, lucide-react icons.
- **Backend**: Node.js + Express + SQLite (better-sqlite3).
- No auth/login system yet — staff pick their name/role from a switcher in the top bar
  (see "Known limitations" below). The Firebase version replaces this with real login —
  see FIREBASE.md.

## Running it

Two servers, both need to be running:

```bash
# Backend (http://localhost:4000)
cd backend
npm install
npm run seed   # first time only — creates demo patients, doctors, treatments, payments
npm run dev

# Frontend (http://localhost:5173, proxies /api to the backend)
cd frontend
npm install
npm run dev
```

### Demo accounts

The seed script creates two dentist accounts for testing PIN verification:

| Doctor | PIN |
|---|---|
| Dr. Maria Santos | 1234 |
| Dr. Carlos Reyes | 5678 |

Four demo patients are seeded (Juan Dela Cruz, Maria Reyes, Pedro Santos, Ana Lim) with a mix
of completed/in-progress treatments, verified/pending payments, and a signed consent, so the
app is explorable immediately.

## How the payment PIN verification works

1. An assistant records a payment against a patient (amount due/paid, method). It's saved as
   **pending doctor verification** — never auto-confirmed.
2. A doctor opens "Verify" on that payment and enters *only their PIN* — there's no dropdown
   to pick a doctor's name.
3. The backend (`POST /api/payments/:id/verify`) checks the PIN against every active doctor's
   salted hash (`scrypt`, no plaintext PINs stored) and finds whichever doctor it belongs to.
   That's what gets written as `verified_by_doctor_id` — an assistant can't attribute a
   verification to the wrong doctor because nothing in the request names one.
4. 5 wrong attempts locks PIN entry for 15 minutes (applies across all doctors, since the
   attacker doesn't know which doctor they're guessing against).
5. Every verification is written to the audit log.

## How the digital consent signature works

- `SignaturePad` is a small custom component built directly on the Canvas + Pointer Events
  API (no third-party signature library) — finger, stylus, and mouse all work through the
  same `pointerdown/move/up` handlers, so a tablet doesn't need a dedicated signature pad.
- A consent starts as a **draft** (assistant/dentist prepares the procedure + consent text).
  Signing it (patient name + drawn signature + "I understand" checkbox) locks it permanently.
- Signed consents are immutable — there's no edit action on a signed record. If the wording
  needs to change, "new version" creates a fresh draft (`version + 1`) and links back to the
  original via `superseded_by`, so the original signed record is never overwritten.

## Matching the official PDA-style paper forms

The data model and forms were expanded to line up with the Philippine Dental Association
standard dental chart and the informed-consent forms clinics actually use:

- **Tooth chart legend** uses the PDA condition codes (D/M/MO/Im/Sp/RF/Un for condition,
  JC/Am/Co/Ab/P/In/Fx/Imp/S/Rm/Att for restorations & prosthetics, X/XO/Cm for surgery) instead
  of a simplified custom list — see [toothLayout.ts](frontend/src/components/toothChart/toothLayout.ts).
- **Medical history** captures the full 39-item "Do you have or have you had any of the
  following?" checklist, a specific allergy checklist (local anesthetic, penicillin,
  antibiotics, sulfa drugs, aspirin, latex), blood type/pressure/bleeding time, physician office
  details, and women's health (pregnant/nursing/birth control) — see
  [medicalHistoryOptions.ts](frontend/src/lib/medicalHistoryOptions.ts).
- **Patient Information Record** adds nickname, civil status, religion, nationality, dental
  insurance, referral source, reason for consultation, and parent/guardian fields that appear
  automatically once a patient's age is under 18.
- **Intraoral Examination** (Tooth Chart tab) adds Periodontal Screening, Occlusion, Appliances,
  TMD, and X-ray Taken — the sections on the paper chart alongside the tooth grid itself.
- **Two consent templates** instead of one generic form:
  - *General Informed Consent* — ten sections (Treatment to be Done, Drugs & Medications,
    Changes in Treatment Plan, Radiograph, Removal of Teeth, Crowns & Bridges, Endodontics,
    Periodontal Disease, Fillings, Dentures), each **initialed separately** by the patient, not
    just one blanket signature.
  - *Oral Surgery Consent* — the 14-item surgical risk list, an anesthesia/sedation type
    selector (local anesthesia / nitrous oxide / oral sedation), and witness + parent/guardian
    signature lines, matching a standalone oral-surgery consent form.
- **Treatment Record** gained a "Next Appt." date field, matching the paper log's last column.

## Responsive behavior

- **Desktop (lg, 1024px+)**: full labeled sidebar.
- **Tablet (md–lg, ~768–1023px)**: icon-only sidebar rail to save horizontal space for the
  clinical workspace (tooth chart, forms).
- **Mobile (<768px)**: sidebar becomes a slide-over drawer behind a hamburger button; cards
  stack; tables switch to a card list layout instead of horizontal columns.
- The tooth chart, PIN keypad, and signature pad all use touch-sized targets (44px+) and
  `touch-action: none` where needed to stop the page from scrolling mid-gesture.

## Assumptions / simplifications made

- **No password login.** Spec asked for role-based access (Admin/Assistant/Dentist) but not a
  login screen; staff declare their name/role via the top-bar switcher. This is stored per
  browser session and attached to records the way a logged-in user would be. A real deployment
  should add real authentication before going live — the PIN check is the one place real
  identity verification already happens server-side.
- **Global nav simplified.** "Dental Chart" and "Consent" live inside a patient's profile tabs
  rather than as separate top-level pages, since both are meaningless without a patient in
  context. Treatments, Payments, Doctors, and Audit Log do have global list pages.
- **FDI (ISO 3950) tooth numbering** was used since it covers adult (11–48) and pediatric
  (51–85) charts under one system without switching notations.

## What to improve next

- Real authentication (the role switcher is a placeholder for a login system).
- Server-side enforcement of role permissions (currently the frontend hides actions by role,
  but the API doesn't yet check who's calling).
- Appointment scheduling (mentioned in the dashboard spec as "Today's Appointments" but there's
  no appointments entity yet — today's treatments are shown instead).
- Reports/export page.
