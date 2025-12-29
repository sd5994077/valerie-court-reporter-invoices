# Appeals Board & Deadline Dashboard (Planning)

This folder contains planning docs and a reference implementation for a Trello-style Appeals Board with a deadline dashboard. The live page will live at `pages/appeals.tsx` for now, and later we can extract components and a storage adapter.

## Notifications & Calendar - Next Steps

- Providers
  - Email: Resend or SendGrid. Create account, get API key, add to environment (e.g., `RESEND_API_KEY`). Replace stubs in `src/lib/notifications/providers.ts`.
  - SMS: Twilio. Create account, phone number, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`. Replace stubs in providers.
- Scheduling
  - Vercel Cron: add daily/hourly cron to hit a server route (e.g., `/api/notifications/run`). Route should load appeals from DB and call policy evaluation + providers. For now admin page has “Send Now” to simulate.
- Persistence
  - Add DB tables: NotificationPreference, AppealNotificationOverride, NotificationLog (idempotency), Contact.
- ICS Calendar
  - `/api/calendar/appeals.ics` serves deadlines. Replace local placeholder with DB fetch in production.

Until DB is ready, admin at `/admin-notifications` stores settings in localStorage and logs notifications to console.

## Goals
- Track appeals through statuses: Intake, Active, Awaiting Extension, Submitted, Completed, Archived
- Visual board with drag & drop
- Extensions (+30 days up to 3), compute effective deadline and days left
- Dashboard counters (total, buckets 0–7 / 8–15 / >15 days, by status)
- Persist locally via localStorage for MVP; swap to DB later via adapter

## MVP Scope
- Single page at `/appeals`
- LocalStorage persistence
- Keyboard/accessibility basics, responsive design

## Near-Term Enhancements
- Extract `types` and `storage` adapter interfaces
- Search/filter (by requester/style), sort by deadline
- Configurable extension length
- Inline validation, ARIA labels, focus states

## Integration Plan (Later)
- Server API: GET/POST /appeals, PATCH /appeals/:id, POST /appeals/:id/extensions
- DB models: Appeal, ExtensionEntry
- Audit log, CSV export, printable summary

See `api-plan.md` and `db-schema.md` for details.
