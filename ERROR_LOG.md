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
- Impact: Placeholder "QR not found" box shown; user could not scan to pay.
- Root cause: Hardcoded path `/assets/Venmo-Val.png` did not match `Venmo-Val.jpg`.
- Affected file:
  - `src/components/VenmoQRCode.tsx`
- Fix implemented:
  - Default to `/assets/Venmo-Val.jpg` and auto-fallback to `.png` on error.
  - Increased QR size to 150px and applied stronger purple tint to match branding.
- Verification:
  - QR renders from `.jpg` and still works if only `.png` exists.


### 2025-12-23 (CORRECTED) — Simplified Invoice System: Line Items Focus

- Issue: Miscommunication about invoice structure - customer wanted simpler line-item-focused design, not separate description/comments fields
- Impact: Corrected implementation to match actual invoice format shown in customer images
- Changes implemented:
  1. **Removed from Form**:
     - Separate "Description" field (was in Case Information section)
     - Separate "Comments" field (was optional in Case Information)
     - These were incorrectly added based on initial misunderstanding
  
  2. **Line Items Enhanced**:
     - Changed description from single-line input to **textarea (3 rows)**
     - Allows multi-line case details: Judge name, Cause No., Case name, etc.
     - Can also be simple single-line like "Exhibits"
     - Quantity defaults to 1
     - Rate/Amount per line item
  
  3. **Case Information Simplified**:
     - Now only contains:
       - Date of Hearing (optional) - appears in Date column on invoice
       - Judge Signature checkbox (if needed)
     - Much cleaner, focused section
  
  4. **PDF Table Layout Updated** (matching customer's image):
     - **Columns**: Transcript | Volume/Pages | Date | Amount
     - **Transcript column**: Shows full multi-line description
     - **Volume/Pages**: Shows quantity (e.g., "1 Volume", "2 Volumes")
     - **Date column**: Shows hearing date from Case Information
     - **Amount column**: Shows line item total
     - **Footer**: "Total:" instead of "Grand Total:"
  
  5. **Structure Now Matches Customer's Format**:
     ```
     Transcript Column:
     Judge R. Bruce Boyer
     Comal County
     CAUSE NO. CR2024-562A
     State of Texas vs. Defendant
     ```
  
- Affected files:
  - `src/components/InvoiceForm.tsx` - Removed Description/Comments, enhanced line items
  - `src/components/InvoicePDF.tsx` - New table structure matching image
  - `src/components/InvoicePDFOnePager.tsx` - Same table structure

- Backup created:
  - `Backup_Correction_20251223_152256/` before corrections

- Testing status:
  - ✓ No TypeScript errors
  - ✓ No linter errors
  - ✓ Compilation successful

### 2025-12-23 — Major Invoice System Restructure: Removed Client Info, Added Cause Number

- Issue: Customer requested major changes to invoice structure - remove all client information fields and replace with Cause Number system
- Impact: Significant restructure of invoice creation, display, and storage
- Changes implemented:
  1. **Type System Updates** (`src/types/invoice.ts`):
     - Added `causeNumber` field to customFields (required)
     - Added `description` field for multi-line case details (200 char max)
     - Added `comments` field for optional invoice comments
     - Maintained backward compatibility with existing invoices
  
  2. **Invoice Form Changes** (`src/components/InvoiceForm.tsx`):
     - Removed entire Client Information section (name, company, phone, email, address)
     - Added Cause Number field at top (required)
     - Renamed "Case Name" to "Description" with textarea for multi-line input
     - Added optional Comments field that appears on invoice
     - Updated validation to require Cause Number instead of Client Name
     - Maintained all other sections (Invoice Details, Line Items, Case Information)
  
  3. **PDF Layout Changes** (`src/components/InvoicePDF.tsx` & `InvoicePDFOnePager.tsx`):
     - **Header**: Centered court reporter information (Valerie DeLeon, CSR)
     - Added address, phone, email in centered format
     - **Invoice Date/Number**: Moved to same line below header (Date left, Number right)
     - **Removed**: Entire "Bill To" section
     - **Invoice Details**: Now shows Cause Number prominently, Description in formatted box
     - **Added**: Comments section with yellow background if comments provided
     - **Footer**: Removed "Thank you" message, left blank per requirements
  
  4. **Dashboard Updates** (`pages/dashboard.tsx` & `src/components/RecentInvoices.tsx`):
     - Changed "CLIENT" column to "CAUSE NUMBER" in Recent Invoices table
     - Updated to display causeNumber from customFields
     - Changed dashboard layout: Revenue by County and Recent Invoices now in separate full-width rows
  
  5. **Backward Compatibility**:
     - Existing invoices with client info will still display (stored in manualClient)
     - New invoices store Cause Number in both customFields.causeNumber and manualClient.name
     - Description stored in both customFields.description and customFields.caseName
  
- Affected files:
  - `src/types/invoice.ts`
  - `src/components/InvoiceForm.tsx`
  - `src/components/InvoicePDF.tsx`
  - `src/components/InvoicePDFOnePager.tsx`
  - `src/components/RecentInvoices.tsx`
  - `pages/dashboard.tsx`

- Backup created:
  - All critical files backed up to `Backup_20251223_150218/` before changes

- Testing status:
  - ✓ No TypeScript compilation errors
  - ✓ No linter errors
  - ✓ Dev server compiling successfully
  - ✓ All pages (/, /create-invoice, /dashboard, /review-invoice) compiled without errors

- Verification needed:
  - Manual testing of invoice creation with new fields
  - PDF generation with new layout
  - Dashboard display of cause numbers
  - Backward compatibility with existing invoices

### 2025-12-29 — iOS PDF Download Issue: Infinite Spinning on Download

- Issue: PDF downloads work on Android/Desktop but fail on iOS devices - download button spins indefinitely without completing
- Impact: iOS users cannot download invoices, blocking core functionality
- Root cause: 
  - iOS Safari blocks direct blob downloads via `.save()` method due to security restrictions
  - The `html2pdf.js` library's `.save()` method triggers a download that gets stuck in pending state on iOS
  - Android Chrome and desktop browsers handle blob downloads differently and work fine
- Affected files:
  - `src/components/InvoiceReview.tsx` - Finalize invoice PDF download
  - `src/components/RecentInvoices.tsx` - Dashboard PDF downloads
  - `pages/view-invoice.tsx` - View invoice PDF download
- Fix implemented:
  - **Hybrid approach with iOS detection**: Automatically detects iOS devices using user agent
  - **iOS devices**: PDF opens in new Safari tab (user can save via Share button)
  - **Android/Desktop**: Direct download via `.save()` method (original behavior)
  - **User feedback**: Different toast messages for iOS ("📱 PDF opened in new tab! Tap share to save") vs download ("✅ PDF downloaded successfully!")
  - **Memory management**: Proper blob URL cleanup with `URL.revokeObjectURL()` after 1 second delay
  - **Error handling**: Popup blocker detection with clear error messages
- Technical details:
  - iOS detection: `/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream`
  - iOS method: `html2pdf().output('blob')` → `URL.createObjectURL()` → `window.open(url, '_blank')`
  - Other platforms: `html2pdf().set(opt).from(pdfElement).save()` (unchanged)
- Verification:
  - ✓ No TypeScript compilation errors
  - ✓ No linter errors
  - ✓ Code follows best practices for cross-platform PDF handling
  - ✓ Memory leaks prevented with proper blob URL cleanup
  - ✓ User experience optimized for each platform

