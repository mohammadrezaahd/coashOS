# coachOS

A coach–trainee workspace built with Next.js 16, React 19, TypeScript, MUI 9 and MongoDB.

## Run locally

```bash
npm ci
cp .env.example .env.local
# Set your MongoDB Atlas URI and APP_URL=http://localhost:3000
npm run dev
```

Open `/register` to create a coach or trainee account. There are no seeded accounts or demo credentials. The trainee starts a conversation, sends a coaching request inside the chat, and the coach accepts before assigning a course.

## Included

- Real registration/login/logout, server sessions, password reset by email (optional Resend configuration).
- Role-aware dashboards, responsive drawer navigation, floating creation actions and light/dark themes.
- Course editor with focused steps, training days, sections, exercises/supersets and reusable template imports.
- Daily actual workout logs alongside immutable snapshots of coach targets.
- Clickable milestone timeline, automatic period reports, manual weight/notes overrides and in-app reminders.
- Conversations with coaching request/accept/decline/cancel flows.
- Coach-owned exercise/day/program templates; imports are independent editable copies.
- Authorized daily health ingestion with token expiry, rotation, revocation and source-data deletion. **An iOS/Android companion is still required to read Apple/Samsung health data.**

## Deployment and configuration

See [.env.example](.env.example), [Vercel setup](docs/DEPLOYMENT.md), and [native health sync contract](docs/HEALTH-SYNC.md). Choose **main** as Vercel's production branch. MongoDB credentials and production service connections are not bundled.

## Validation

```bash
npm run lint
npm test
npm run build
npm run test:integration
```

The integration test creates a disposable local MongoDB replica set and starts the production server on localhost:4239. It requires an environment that permits MongoDB to run and may download a MongoDB test binary. It never uses production credentials or sends real email.

## Structure

- `components/workspace`: client screens and authenticated API state.
- `server/core`: session authentication, MongoDB collections/indexes, validated API routes and reminder generation.
- `app/api/[...path]/route.ts`: Node.js API entry point.
- `utils/workout.ts`: workout snapshots, date windows, report generation and independent template copying.
- `docs`: deployment and mobile sync contract.
- `tests`: domain tests and full API workflow/authorization checks.

Earlier generic files in `server/models`, `server/configs`, and `server/database` are legacy scaffolding; the active backend uses `server/core`.
