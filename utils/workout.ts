import type { ActualSet, ActualTargetMetric, HealthDay, MilestoneReport, TargetMetric, TargetMetricKey, TrainingCourse, TrainingExercise, TrainingProgram, WorkoutLog } from "@/interfaces/Workspace.interface";
export const targetLabels: Record<TargetMetricKey, string> = {
  repetitions: "Repetitions", "external-load": "External load", "step-count": "Step count", duration: "Duration", distance: "Distance", rpe: "RPE",
};
export function exerciseTargets(exercise: TrainingExercise, set?: { reps: number; weight: number; unit: "kg" | "lb"; targets?: TargetMetric[] }): TargetMetric[] {
  const targets = [...(set?.targets?.length ? set.targets : exercise.targets ?? [])];
  if (!targets.some((target) => target.key === "repetitions")) targets.unshift({ key: "repetitions", value: set?.reps ?? 0, unit: "count" });
  if ((set?.weight ?? 0) > 0 && !targets.some((target) => target.key === "external-load")) targets.push({ key: "external-load", value: set!.weight, unit: set!.unit });
  return targets;
}
export function actualTargets(planned: TargetMetric[], actual?: ActualTargetMetric[]): ActualTargetMetric[] {
  return planned.map((target) => ({ ...target, value: actual?.find((value) => value.key === target.key)?.value ?? null }));
}
export function plannedSets(program: TrainingProgram): ActualSet[] {
  return program.sections.flatMap((section) => section.blocks.flatMap((block) =>
    (block.kind === "exercise" ? [block.exercise] : block.exercises).flatMap((exercise) => {
      const sets = block.kind === "superset" ? Array.from({ length: block.rounds }, (_, i) => ({ ...exercise.sets[0], id: `round-${i}` })) : exercise.sets;
      return sets.map((set, index) => {
        const targets = exerciseTargets(exercise, set);
        return {
          key: `${exercise.id}:${set.id}`, exerciseId: exercise.id, title: exercise.title, setNumber: index + 1,
          planned: { reps: set.reps, weight: set.weight, unit: set.unit, durationSeconds: exercise.durationSeconds, restSeconds: exercise.restSeconds, targets },
          actual: { reps: null, weight: null, unit: set.unit, durationSeconds: null, restSeconds: null, targets: actualTargets(targets) }, completed: false,
        };
      });
    }),
  ));
}
export function dateInZone(timezone: string, now = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
export function addDays(date: string, days: number) { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
export function milestonePeriod(course: TrainingCourse, milestoneId: string) {
  const ordered = [...course.milestones].sort((a, b) => a.week - b.week); const index = ordered.findIndex((milestone) => milestone.id === milestoneId); if (index < 0) throw new Error("Milestone not found");
  return { title: ordered[index].title, from: index ? addDays(course.startDate, ordered[index - 1].week * 7) : course.startDate, to: addDays(course.startDate, ordered[index].week * 7 - 1) };
}
export function buildReport(course: TrainingCourse, milestoneId: string, logs: WorkoutLog[], health: HealthDay[], today: string): MilestoneReport {
  const period = milestonePeriod(course, milestoneId);
  const included = logs.filter((log) => log.courseId === course.id && log.date >= period.from && log.date <= period.to).sort((a, b) => a.date.localeCompare(b.date));
  const measurements = [...logs.filter((log) => log.traineeId === course.traineeId && log.weightKg !== null).map((log) => ({ date: log.date, weight: log.weightKg!, source: "Workout log" })), ...health.filter((day) => day.userId === course.traineeId && day.weightKg !== undefined).map((day) => ({ date: day.date, weight: day.weightKg!, source: day.source }))].sort((a, b) => a.date.localeCompare(b.date));
  const before = measurements.filter((measurement) => measurement.date <= period.from).at(-1); const after = measurements.filter((measurement) => measurement.date >= period.from && measurement.date <= period.to).at(-1);
  return { id: `${course.id}:${milestoneId}`, courseId: course.id, milestoneId, ...period, status: today >= period.to ? "due" : "upcoming", weightBefore: before?.weight ?? null, weightAfter: after?.weight ?? null, weightBeforeSource: before ? `${before.source} · ${before.date}` : "Not recorded", weightAfterSource: after ? `${after.source} · ${after.date}` : "Not recorded", notes: "", logs: included, sessionCount: included.length, completedSets: included.reduce((count, log) => count + log.sets.filter((set) => set.completed).length, 0) };
}
export function copyProgram(program: TrainingProgram, uuid: () => string = () => crypto.randomUUID()): TrainingProgram {
  const copy = structuredClone(program); copy.id = uuid(); copy.sections.forEach((section) => { section.id = uuid(); section.blocks.forEach((block) => { block.id = uuid(); (block.kind === "exercise" ? [block.exercise] : block.exercises).forEach((exercise) => { exercise.id = uuid(); exercise.sets.forEach((set) => { set.id = uuid(); }); }); }); }); return copy;
}
export function equipmentForProgram(program: TrainingProgram): string[] {
  const values = program.sections.flatMap((section) => section.blocks.flatMap((block) => (block.kind === "exercise" ? [block.exercise] : block.exercises).flatMap((exercise) => [exercise.equipment, ...(exercise.equipmentItems ?? [])])));
  return [...new Set(values.flatMap((value) => value.split(",").map((item) => item.trim()).filter(Boolean)))].sort((a, b) => a.localeCompare(b));
}
export function equipmentForCourse(course: TrainingCourse): string[] { return [...new Set(course.programs.flatMap(equipmentForProgram))].sort((a, b) => a.localeCompare(b)); }
export function weekdayInZone(date: string, timezone: string): number { const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(new Date(`${date}T12:00:00Z`)); return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday); }
export function scheduleForDate(course: TrainingCourse, date: string, timezone = "UTC"): TrainingProgram | null {
  const override = course.scheduleOverrides?.find((item) => item.date === date); if (override) return override.programId ? course.programs.find((program) => program.id === override.programId) ?? null : null;
  const assignment = course.weeklySchedule?.find((item) => item.weekday === weekdayInZone(date, timezone)); return assignment?.programId ? course.programs.find((program) => program.id === assignment.programId) ?? null : null;
}
export function compareMetricProgress(previous: number | null, current: number | null, key: TargetMetricKey): "improved" | "unchanged" | "regressed" | "unavailable" { if (previous === null || current === null) return "unavailable"; if (previous === current) return "unchanged"; if (key === "rpe") return current < previous ? "improved" : "regressed"; return current > previous ? "improved" : "regressed"; }
