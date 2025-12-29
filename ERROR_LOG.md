## Error Log

### 2025-09-19 — Navbar focus left menu item white (hard to read)

- Issue: When hovering a desktop nav item, then moving the mouse away while the link still had focus, the item remained white with purple text or otherwise appeared visually inconsistent. On some pages the focused state made text hard to read against the background.
- Impact: Confusing focus/hover behavior, poor readability, inconsistent UX across pages.
- Root cause:
  - Active route styling used `bg-white text-purple-600`, making the item look permanently “selected.”
  - Focus state also altered background, overlapping with hover/active states.
- Affected files:
  - `src/components/MobileNavigation.tsx`
  - `pages/review-invoice.tsx` (standalone header buttons)
- Fix implemented:
  - Kept hover as white background with purple text for clear affordance.
  - Changed active route to a subtle state: `bg-white/10 font-semibold` instead of solid white background.
  - Made focus state ring-only: `focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-purple-600` (no background change).
  - Added `aria-current="page"` to the active link for accessibility.
- Verification:
  - Keyboard tabbing now shows a clear ring without changing background.
  - Hover still shows white background with purple text.
  - Active route is subtly indicated, readable, and consistent across pages.

### 2025-09-19 — Button text “jumped” on hover (size change illusion)

- Issue: On hover, some primary buttons slightly scaled up which made the label appear to change size or “jump.”
- Impact: Distracting motion; perceived font-size change on hover.
- Root cause: Hover scaling via `transform hover:scale-105` on CTA buttons.
- Affected files:
  - `pages/index.tsx` (Create Invoice, View Dashboard buttons)
- Fix implemented:
  - Removed hover scale (`transform hover:scale-105`) from those buttons.
  - Kept existing hover color transitions and hover shadow so the buttons still feel interactive.
- Verification:
  - Hover no longer changes perceived text size; labels remain steady.
  - Buttons still show hover feedback via color/shadow.

### 2025-09-19 — Line items “Empty” warning clipped after adding item

- Issue: After adding a line item on the Create Invoice page, the inline “Empty” warning under Description was clipped/cut off inside the card.
- Impact: Users could not read the full guidance or reach the Remove link reliably.
- Root cause: The warning container used absolute positioning (`absolute left-0 top-full ... z-10`) which positioned it outside normal flow and could be overlapped by surrounding content/overflow.
- Affected file:
  - `src/components/InvoiceForm.tsx`
- Fix implemented:
  - Converted the warning container to normal flow with spacing: replaced absolute positioning with `mt-1 ... w-full`.
- Verification:
  - Adding a line item shows the full “Empty” warning and Remove action; no clipping.


### 2025-09-19 — Venmo QR not loading due to wrong extension

- Issue: Venmo QR image not displayed on Review Invoice. Component referenced `.png` while actual file was `.jpg` in `public/assets`.
- Impact: Placeholder “QR not found” box shown; user could not scan to pay.
- Root cause: Hardcoded path `/assets/Venmo-Val.png` did not match `Venmo-Val.jpg`.
- Affected file:
  - `src/components/VenmoQRCode.tsx`
- Fix implemented:
  - Default to `/assets/Venmo-Val.jpg` and auto-fallback to `.png` on error.
  - Increased QR size to 150px and applied stronger purple tint to match branding.
- Verification:
  - QR renders from `.jpg` and still works if only `.png` exists.

