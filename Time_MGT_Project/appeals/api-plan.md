# Appeals API Plan (Future Integration)

## Endpoints
- GET `/api/appeals` — list appeals (filters: status, daysLeft bucket)
- POST `/api/appeals` — create appeal
- PATCH `/api/appeals/:id` — update appeal (status, notes, fields)
- DELETE `/api/appeals/:id` — delete appeal
- POST `/api/appeals/:id/extensions` — add extension entry

## Models
- Appeal
- ExtensionEntry

## Payloads
- Appeal: `{ id, requesterName, requesterAddress, courtOfAppealsNumber, trialCourtCaseNumber, style, appealDeadline, status, extensions[], notes, createdAt, updatedAt }`
- ExtensionEntry: `{ id, requestedOn, daysGranted }`

## Notes
- Replace localStorage with DB via adapter
- Consider soft delete (archived) vs hard delete
- Add audit log events for create/update/extension

