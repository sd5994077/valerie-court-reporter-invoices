# Tester Guide (Vercel Preview)

Use this document to test the Valerie Court Reporter Invoicing + Appeals app in a Vercel **Preview/Staging** deployment.

---

## Access

- **App URL**: `[PASTE VERCEL PREVIEW URL HERE]`
- **If prompted for a password** (Vercel protection):
  - **Password**: `[PASTE PASSWORD HERE]`

If you see **“Unauthorized”**, please reply with a screenshot and tell me:
- whether it happened **before** the app loaded (Vercel protection) or **inside** the app after it loaded
- your browser + device

---

## Important Notes (so testing is predictable)

- **Data is stored in your browser (localStorage)**.
  - Your test invoices/appeals will be visible **only on your device/browser**.
  - If you switch browsers/devices, you won’t see the same data.
  - If you clear site data, your test data will be erased.
- **PDF download** may be blocked by pop‑up/download settings. If a PDF doesn’t download, tell me your browser and whether downloads are blocked.

---

## What to Send Back

Please email back:
- what you tested (which sections below)
- what worked / what didn’t
- screenshots (very helpful)
- any errors shown on screen

### Bug Report Template (copy/paste)

- **Page/Feature**:
- **What you expected**:
- **What happened instead**:
- **Steps to reproduce**:
- **Device** (iPhone/Android/Desktop):
- **Browser** (Chrome/Safari/Edge + version if known):
- **Screenshot/video**:

---

## Test Checklist

### A) Navigation / General UI

- **Open the home page** and confirm it loads quickly and looks normal.
- **Use the top/mobile navigation** to visit:
  - Home
  - Create Invoice
  - Dashboard
  - Appeals
  - Admin Notifications (if present)
- **Mobile test** (if you can): open on a phone and confirm menus/buttons are usable and readable.

---

### B) Create Invoice (core workflow)

Go to **Create Invoice** and create a test invoice using fake data.

Please verify:
- **Required fields**: the form clearly indicates missing info and does not “break” layout on mobile.
- **Line items**:
  - add multiple line items
  - change quantity/rate
  - confirm totals update correctly
- **Custom fields** (if shown):
  - county
  - case name/cause number
  - date of hearing
  - service type / “Other” service type
- **Save/Continue** leads you to the next step without errors.

---

### C) Review Invoice

On the review screen:
- confirm invoice details look correct
- confirm totals match what you entered
- confirm Venmo section is visible and the QR area renders
- click **Edit** (if available) and confirm it returns you to editing with data preserved

Then:
- click **Finalize** (or equivalent)
- confirm you get a success message

---

### D) Download PDF

After finalizing:
- click **Download PDF**
- confirm a PDF downloads successfully
- open the PDF and confirm:
  - layout looks professional (no cut-off content)
  - totals match
  - signature area looks correct (if included)

If PDF fails to download, report:
- browser/device
- whether you saw any error message
- whether downloads/popups were blocked

---

### E) Dashboard

Go to **Dashboard** and verify:
- you can see the invoice you created (in “Recent Invoices”)
- revenue totals make sense based on completed/closed invoices
- filtering by year (if present) works

Optional:
- create a second invoice with a different county and confirm county breakdown changes.

---

### F) Appeals Board

Go to **Appeals** and test:
- create a new appeal
- confirm it appears in the correct column
  - drag/drop between columns (desktop) or **use the dropdown menu on the card** to move it (mobile)
  - **click anywhere on a card** to open the full details/edit modal
  - open/edit an appeal and:
    - confirm the modal scrolls if content is long (especially on mobile)
    - add an extension (try multiple, up to 3)
  - change extension requested date
  - remove an extension
- confirm the effective deadline / days left indicators behave as expected

Archived behavior:
- move an item to **Archived** (if supported) and confirm it becomes read-only / behaves differently as intended.

---

### G) Admin Notifications (if available)

Go to **Admin Notifications** and confirm:
- the page loads
- you can see whatever notifications are expected
- nothing looks broken or empty unexpectedly

---

## Final “Ready to Test” Sign‑Off

Please answer:
- **Would you feel comfortable using this for real invoices?** (Yes/No + why)
- **Top 3 improvements you’d want**
- **Any confusing steps** (what felt unclear)


