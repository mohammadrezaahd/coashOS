# coachOS

Client preview of a coach–trainee platform, built with Next.js 16, React 19, TypeScript, and MUI 9.

## Run

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The home route opens the sign-in screen. Use **Explore coach demo** or **Explore trainee demo** without entering credentials.

```bash
npm run build
npm start
```

No environment variables or database connection are needed for the client preview.

## Included flows

- Sign in, role-based registration, and password reset previews.
- Separate coach and trainee dashboards and responsive navigation.
- Coach course search/filtering, course creation/editing, trainee directory and invitation preview.
- Course editor: course details → training days → trainee preview and publish confirmation.
- Canonical workouts: `IProgram → ISection → ISet → IExercise → ITarget`.
- Count, duration, distance, weight, and RPE targets with units, set count, RPE, external load, equipment, and per-side targets.
- Reusable Section and Program Templates with preview, rename, delete confirmation, deep-copy application, and offline persistence.
- Reordering days, sections and exercise blocks; confirmation before removing content.
- Assigned trainee courses, program details, set completion, and session completion.
- Conversations and editable personal, coaching, and physical profiles.
- Light/dark themes with persisted theme preference and MUI App Router SSR integration.

## Preview behavior

Workspace courses, templates, and workout completion state persist in browser localStorage after the first client render, with bundled fake data as a safe fallback. Authentication forms do not create or authenticate accounts. Passwords are never saved. Invitation and reset flows do not send email. The preview labels make this visible in the UI.

The role in the route chooses the UI; this is **not an authorization boundary**. Before production, implement server authentication, permissions, validation, and persistence. The existing `server/` files remain an unconnected scaffold.

## Routes

- `/login`, `/register`, `/forgot-password`
- `/dashboard/coach/coach-1`
- `/dashboard/trainee/trainee-summary-1`
- `/dashboard/[role]/[id]/courses`
- `/dashboard/[role]/[id]/courses/new` (coach)
- `/dashboard/[role]/[id]/courses/[courseId]`
- `/dashboard/[role]/[id]/courses/[courseId]/edit` (coach)
- `/dashboard/[role]/[id]/courses/[courseId]/programs/[programId]`
- `/dashboard/[role]/[id]/trainees` (coach), `/messages`, `/profile`
- `/dashboard/[role]/[id]/templates` (coach)

## Client architecture

`components/workspace/` contains the current client screens and shared state. `interfaces/Workspace.interface.ts` is their common domain model. `utils/trainingValidation.ts` validates exercise prescriptions and publishable courses.

Course metadata remains separate from the canonical workout model. Each course contains multiple `IProgram` sessions; each program contains sections, exercise groups, and exercises with one target. `ISet.repeat` replaces the old superset concept. `ProgramContent` is shared by the course preview and the trainee workout.

Existing `interfaces/Program.interface.ts`, `Course.interface.ts`, and older sections are retained as legacy contracts/components for the original scaffold; active routes use the workspace model. No backend migration is implied.

Theme tokens live in `app/Theme.ts`. MUI system styling uses `sx`, compatible with MUI 9. Fonts use a system fallback to avoid a build-time Google Fonts dependency.
