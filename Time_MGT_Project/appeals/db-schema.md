# Appeals DB Schema (Draft)

## Tables

### appeals
- id (string, pk)
- requester_name (string)
- requester_address (string)
- court_of_appeals_number (string)
- trial_court_case_number (string)
- style (string)
- appeal_deadline (date)
- status (enum: Intake, Active, Awaiting Extension, Submitted, Completed, Archived)
- notes (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

### appeal_extensions
- id (string, pk)
- appeal_id (fk -> appeals.id)
- requested_on (date)
- days_granted (int)
- created_at (timestamp)

## Effective Deadline
`effective_deadline = appeal_deadline + sum(days_granted)`

## Indexes
- appeals(status)
- appeals(appeal_deadline)
- appeal_extensions(appeal_id)

