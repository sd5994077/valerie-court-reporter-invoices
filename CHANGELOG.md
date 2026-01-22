# Changelog

All notable changes to the Court Reporter Invoice System will be documented in this file.

## [2.2.0] - 2025-12-23

### Added
- **Archived Appeals Read-Only Mode**: Archived appeals are now read-only and cannot be edited or deleted
- **Archive Display Limit**: Shows most recent 50 archived appeals by default with "View All" toggle
- **Extension Date Editing**: Extension grant dates are now editable (not automatically set to current date)
- **Auto-Close Modal**: Edit modal automatically closes after saving changes

### Changed
- **Extension Workflow**: Extension button on appeal cards now opens edit modal instead of directly adding extension
- **Archived Appeals UI**: 
  - Edit button changed to "View" icon for archived items
  - Delete button hidden for archived appeals
  - "Add to calendar" button removed for archived appeals
- **Drag & Drop Restrictions**: Archived appeals cannot be dragged or dropped into other columns
- **Modal Z-Index**: Fixed modal display issue where forms appeared behind navigation bar

### Technical
- Added `isReadOnly` prop to `AppealEditModal` component
- Implemented archive display pagination (50 items default)
- Prevented drag/drop operations for archived status
- All form fields disabled when viewing archived appeals
- No breaking changes - fully backward compatible

### Files Modified
- `pages/appeals.tsx` - Complete appeals board implementation with archive management

---

## [2.1.0] - 2025-12-23

### Added
- **Year Filter on Dashboard**: Added year dropdown filter in dashboard header to view revenue and invoices by specific year
- **Automatic Year Detection**: Dashboard automatically discovers all years present in invoice history
- **Multi-Year Support Documentation**: Comprehensive documentation for handling past, current, and future years

### Changed
- **Dashboard Data Loading**: Refactored to support year-based filtering while maintaining all-time view option
- **Dashboard Stats Calculation**: Stats now update dynamically based on selected year filter

### Technical
- Dashboard now filters invoices by year when a specific year is selected
- Maintains "All Time" view as default option
- No breaking changes - fully backward compatible

---

## [2.0.0] - 2025-12-23

### 🚨 BREAKING CHANGES
Major restructure of invoice system - removed client information, replaced with cause number system.

### Added
- **Cause Number Field**: New required field at top of invoice form for case identification
- **Description Field**: Multi-line textarea (200 char max) for judge name, cause number, and case details
- **Comments Field**: Optional comments section that appears on generated invoices
- **Centered Header Layout**: Professional centered header on PDF invoices with complete contact information

### Changed
- **Invoice Form**: Removed entire Client Information section (name, company, phone, email, address)
- **PDF Header**: Changed from side-by-side layout to centered court reporter information
- **PDF Layout**: Invoice Date and Invoice Number now on same line below header
- **Invoice Details**: Now prominently displays Cause Number and Description
- **Dashboard**: "CLIENT" column renamed to "CAUSE NUMBER" in Recent Invoices table
- **Dashboard Layout**: Revenue by County and Recent Invoices now in separate full-width rows
- **Footer**: Removed "Thank you for your business" message per customer request

### Removed
- Client Information section from invoice creation form
- "Bill To" section from PDF invoices
- Thank you message from invoice footer

### Technical
- Updated TypeScript types to include `causeNumber`, `description`, and `comments` in `customFields`
- Maintained backward compatibility with existing invoices
- All files backed up to `Backup_20251223_150218/` before changes
- Zero compilation errors, all linter checks passed

### Files Modified
- `src/types/invoice.ts` - Added new field types
- `src/components/InvoiceForm.tsx` - Removed client section, added new fields
- `src/components/InvoicePDF.tsx` - New header layout, removed Bill To section
- `src/components/InvoicePDFOnePager.tsx` - Same changes as InvoicePDF
- `src/components/RecentInvoices.tsx` - Client to Cause Number
- `pages/dashboard.tsx` - Layout changes for better organization

---

## [1.0.0] - 2025-09-19

### Initial Release
- Professional invoice creation system for court reporters
- Mobile-first responsive design
- PDF generation with custom branding
- Dashboard with revenue analytics
- Invoice status management (Pending, Completed, Overdue, Closed)
- County-based revenue tracking
- Sequential invoice numbering (INV-YYYY-####)
- Judge signature option
- Venmo QR code integration
- LocalStorage-based data persistence



