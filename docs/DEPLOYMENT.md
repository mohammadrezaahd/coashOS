# coachOS deployment

The Next.js client now uses authenticated MongoDB APIs. It starts with empty accounts, not sample data. No credentials or production database are included.

## Vercel

1. Import `mohammadrezaahd/coashOS`, select **main** as Production Branch (the GitHub repository may still default to master). Use the Next.js preset and repository root; install `npm ci`, build `npm run build`. Use Node 22 or newer.
2. Create a MongoDB Atlas database user with read/write access to the `coachos` database. Configure Atlas Network Access for your deployment's outbound connectivity. Copy the driver URI, URL-encode special characters in its password. Atlas/replica-set MongoDB is required for atomic request acceptance and password reset transactions.
3. Add the values from `.env.example` as server environment variables. `APP_URL` must exactly match the origin you use to open the app, without a path. Use a separate database and matching APP_URL for preview deployments.
4. Generate your own random `CRON_SECRET`. Do not use the example value. `vercel.json` schedules an authenticated, idempotent reminder scan daily at 05:00 UTC. Reminders also refresh when a user opens the workspace; due dates follow the trainee's time zone.
5. Password reset requires a Resend key and verified `EMAIL_FROM`. Other account features work without email configuration. No email is claimed as sent when that service is unconfigured.
6. Deploy. Indexes are created on the first database-backed request. Create one coach and one trainee account. As the trainee: Messages → Find a coach → Start conversation → Request coaching. As coach: accept in chat, create/publish a course, add milestones. As trainee: open a training day, complete the daily log. Open Reports from either account and select a milestone.

Sessions use httpOnly, secure (production), same-site cookies; password hashes use salted scrypt. Sessions, reset links and mobile tokens are hashed in MongoDB with expiration indexes. Mutations validate the exact request origin and authenticated ownership; coach assignment is accepted transactionally. Server credentials must never have a NEXT_PUBLIC_ prefix.

## Behavior

- One editable log per trainee/course/program/local date. Actual reps, weight, duration and rest are nullable. Coach targets are snapshotted when the log is first saved and cannot be overwritten by a trainee.
- Each milestone covers the days after the previous milestone through its own due date (inclusive). The first period starts on the course start date. Reports automatically show daily logs in that period, the last known weight at/before the beginning, and the latest recorded weight in the period. Sources are displayed. Missing values remain empty for manual entry; measurements are never fabricated.
- A saved report overrides its manual weight fields/notes; daily exercise logs continue to update underneath. Course and log saves detect conflicting revisions. Report saves detect concurrent edits.
- Reminders are in-app, not push/SMS/email. They appear two days before a milestone and remain until marked read or its report is saved.
- Templates are coach-owned. Importing re-keys and deeply copies every day, section, block, exercise and set, allowing independent edits.
- Messages/requests refresh every minute while the tab is visible, and immediately after actions. This is polling, not a WebSocket service.
- Workspace responses currently load up to 300 courses/conversations/trainees/templates/reminders, 1,000 recent logs/messages and 90 source-days of health readings. Full milestone reports query their recorded history. Paginated large-team views are a future scaling step.

## Health integrations

See [HEALTH-SYNC.md](HEALTH-SYNC.md). The ingestion API is implemented. An iOS/Android companion is **not included**; adding a token does not itself connect to HealthKit or Samsung Health. There is no generic website-only Apple/Samsung health OAuth connection.

## References

- https://vercel.com/docs/cron-jobs/manage-cron-jobs
- https://vercel.com/docs/cron-jobs/quickstart
- https://www.mongodb.com/docs/atlas/connect-to-database-deployment/
- https://resend.com/docs/api-reference/emails/send-email
