import type {
  ActualSet,
  TrainingProgram,
  TrainingCourse,
  WorkoutLog,
  HealthDay,
  MilestoneReport,
} from "@/interfaces/Workspace.interface";
export function plannedSets(program: TrainingProgram): ActualSet[] {
  return program.sections.flatMap((s) =>
    s.blocks.flatMap((b) =>
      (b.kind === "exercise" ? [b.exercise] : b.exercises).flatMap((e) => {
        const sets =
          b.kind === "superset"
            ? Array.from({ length: b.rounds }, (_, i) => ({
                ...e.sets[0],
                id: `round-${i}`,
              }))
            : e.sets;
        return sets.map((set, i) => ({
          key: `${e.id}:${set.id}`,
          exerciseId: e.id,
          title: e.title,
          setNumber: i + 1,
          planned: {
            reps: set.reps,
            weight: set.weight,
            unit: set.unit,
            durationSeconds: e.durationSeconds,
            restSeconds: e.restSeconds,
          },
          actual: {
            reps: null,
            weight: null,
            unit: set.unit,
            durationSeconds: null,
            restSeconds: null,
          },
          completed: false,
        }));
      }),
    ),
  );
}
export function dateInZone(timezone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function addDays(date: string, days: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function milestonePeriod(course: TrainingCourse, milestoneId: string) {
  const ordered = [...course.milestones].sort((a, b) => a.week - b.week);
  const index = ordered.findIndex((m) => m.id === milestoneId);
  if (index < 0) throw new Error("Milestone not found");
  return {
    title: ordered[index].title,
    from: index
      ? addDays(course.startDate, ordered[index - 1].week * 7)
      : course.startDate,
    to: addDays(course.startDate, ordered[index].week * 7 - 1),
  };
}
export function buildReport(
  course: TrainingCourse,
  milestoneId: string,
  logs: WorkoutLog[],
  health: HealthDay[],
  today: string,
): MilestoneReport {
  const period = milestonePeriod(course, milestoneId);
  const included = logs
    .filter(
      (l) =>
        l.courseId === course.id &&
        l.date >= period.from &&
        l.date <= period.to,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const measurements = [
    ...logs
      .filter((l) => l.traineeId === course.traineeId && l.weightKg !== null)
      .map((l) => ({
        date: l.date,
        weight: l.weightKg!,
        source: "Workout log",
      })),
    ...health
      .filter((h) => h.userId === course.traineeId && h.weightKg !== undefined)
      .map((h) => ({ date: h.date, weight: h.weightKg!, source: h.source })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const before = measurements.filter((m) => m.date <= period.from).at(-1);
  const after = measurements
    .filter((m) => m.date >= period.from && m.date <= period.to)
    .at(-1);
  return {
    id: `${course.id}:${milestoneId}`,
    courseId: course.id,
    milestoneId,
    ...period,
    status: today >= period.to ? "due" : "upcoming",
    weightBefore: before?.weight ?? null,
    weightAfter: after?.weight ?? null,
    weightBeforeSource: before
      ? `${before.source} · ${before.date}`
      : "Not recorded",
    weightAfterSource: after
      ? `${after.source} · ${after.date}`
      : "Not recorded",
    notes: "",
    logs: included,
    sessionCount: included.length,
    completedSets: included.reduce(
      (n, l) => n + l.sets.filter((s) => s.completed).length,
      0,
    ),
  };
}
/** Re-key every entity when copying a template, avoiding shared identities/references. */
export function copyProgram(
  program: TrainingProgram,
  uuid: () => string = () => crypto.randomUUID(),
): TrainingProgram {
  const copy = structuredClone(program);
  copy.id = uuid();
  copy.sections.forEach((s) => {
    s.id = uuid();
    s.blocks.forEach((b) => {
      b.id = uuid();
      (b.kind === "exercise" ? [b.exercise] : b.exercises).forEach((e) => {
        e.id = uuid();
        e.sets.forEach((set) => {
          set.id = uuid();
        });
      });
    });
  });
  return copy;
}
