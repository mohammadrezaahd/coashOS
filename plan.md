# coachOS workout scheduling and multi-target integration plan

## Architecture map

- **Client domain**: `interfaces/Workspace.interface.ts` owns the API-backed workspace contracts. `TrainingCourse -> TrainingProgram -> TrainingSection -> TrainingBlock -> TrainingExercise -> TrainingSet` is the current persisted shape consumed by the coach builder, trainee course pages, and workout logger.
- **Persistence/API**: `server/core/db.ts` owns MongoDB collections and indexes. `server/core/schemas.ts` validates request bodies. `server/core/api.ts` enforces sessions, role checks, ownership, optimistic concurrency, workout snapshot creation, reports, templates, and reminders.
- **Client data flow**: `components/workspace/WorkspaceProvider.tsx` fetches `/api/workspace` and mutates through API routes; it must remain the source of shared state, never localStorage.
- **Prescription/logging**: `utils/workout.ts` creates immutable planned snapshots for `WorkoutLog`; `WorkoutForm.tsx` edits actual values; `Reports.tsx` consumes report responses.
- **UI integration points**: `Builder.tsx` and `ExerciseEditor.tsx` author prescriptions; `Courses.tsx` presents course/program details; dashboard routes/layout provide navigation.

## Implementation approach

1. Extend exercises from a single reps/weight set shape to typed, extensible metric targets while preserving legacy reps/weight fields during the transition.
2. Snapshot target definitions into each planned log and store target-specific actual values separately; retain version checks and unique daily workout IDs.
3. Add recurring weekly assignments and date overrides as course schedule data, with server-derived occurrences and a trainee calendar/daily-log surface.
4. Separate milestone report payloads from private daily log details at the API response boundary.
5. Derive deduplicated equipment from program exercises and show it in trainee course details.
6. Preserve MongoDB-owned templates and deep-copy IDs, adding compatibility for multi-target exercises.
7. Add focused domain/API regression tests, then run lint, unit tests, build, and integration tests.

## Data and compatibility decisions

- New fields are additive and optional for legacy records. Legacy single-target sets are normalized into reps/weight/count targets when read or snapshotted; no old data is silently discarded.
- `WorkoutLog.sets[].planned` remains immutable after first save. New metric arrays are copied into the snapshot, while `actual` carries independent values per metric.
- Weekly schedule rules are stored on the course; occurrence overrides are stored separately with a unique trainee/course/program/date identity. Future schedule edits do not mutate existing logs.
- Coaches receive milestone summaries and submitted milestone fields, never detailed private daily checklist sets or notes.
- Equipment is computed from the selected course/program, not maintained as a second editable list.

## UI direction

Reuse the current MUI 9 dark-green workspace language, typography, panels, chips, and responsive spacing. New calendar and target controls will favor compact, touch-friendly cards, explicit planned-versus-actual labels, and visible save/error feedback without redesigning unrelated screens.

## Project structure

- `interfaces/`: additive domain contracts and target/schedule types.
- `utils/`: pure target normalization, schedule occurrence, equipment aggregation, progress comparison, and snapshot helpers.
- `server/core/`: Zod schemas, MongoDB collections/indexes, and authorized API routes.
- `components/workspace/`: builder/editor, daily log/calendar, report privacy-safe presentation, and course equipment display.
- `tests/`: pure domain and production-build integration coverage.
