import type { TargetMetric, TrainingCourse, TrainingExercise } from "@/interfaces/Workspace.interface";
const integerIn = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;
export function validateTarget(target: TargetMetric): string | null {
  if (!Number.isFinite(target.value) || target.value < 0 || target.value > 100000) return "Target values must be finite numbers between 0 and 100000.";
  const units: Record<TargetMetric["key"], TargetMetric["unit"][]> = { repetitions: ["count"], "external-load": ["kg", "lb"], "step-count": ["steps"], duration: ["seconds", "minutes"], distance: ["meters", "kilometers"], rpe: ["score"] };
  return units[target.key].includes(target.unit) ? null : `Choose a valid unit for ${target.key}.`;
}
export function validateExercise(exercise: TrainingExercise): string | null {
  if (!exercise.title.trim()) return "Give every exercise a name.";
  if (!integerIn(exercise.restSeconds, 0, 3600)) return "Rest must be between 0 and 3600 seconds.";
  if (exercise.durationSeconds !== undefined && !integerIn(exercise.durationSeconds, 1, 86400)) return "Choose a valid exercise duration.";
  if (!exercise.sets.length || exercise.sets.some((set) => !integerIn(set.reps, 1, 1000) || !Number.isFinite(set.weight) || set.weight < 0 || set.weight > 2000)) return "Check repetitions and weights for every exercise.";
  const keys = new Set<string>();
  for (const target of exercise.targets ?? []) { if (keys.has(target.key)) return "Each exercise target metric can appear only once."; keys.add(target.key); const error = validateTarget(target); if (error) return error; }
  if (exercise.mediaUrl) { try { const url = new URL(exercise.mediaUrl); if (!["http:", "https:"].includes(url.protocol)) return "Media must use an http or https link."; } catch { return "Enter a valid media link."; } }
  return null;
}
export function validateCourse(course: TrainingCourse): string | null {
  if (!course.title.trim() || !course.traineeId) return "Add a course title and choose a trainee.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(course.startDate) || !Number.isFinite(Date.parse(course.startDate)) || !integerIn(course.durationWeeks, 1, 104)) return "Choose a start date and a duration between 1 and 104 weeks.";
  if (course.milestones.some((milestone) => !milestone.title.trim() || !integerIn(milestone.week, 1, course.durationWeeks))) return "Give every milestone a title and a week inside this course.";
  if (!course.programs.length) return "Add at least one training day before publishing.";
  for (const program of course.programs) {
    if (!program.title.trim() || !program.sections.length) return "Each training day needs a title and a section.";
    for (const section of program.sections) {
      if (!section.title.trim() || !section.blocks.length) return "Name each section and add exercises, or remove the empty section.";
      for (const block of section.blocks) {
        if (block.kind === "superset" && (!integerIn(block.rounds, 1, 20) || block.exercises.length < 2)) return "Supersets need at least two exercises and between 1 and 20 rounds.";
        for (const exercise of block.kind === "exercise" ? [block.exercise] : block.exercises) { const error = validateExercise(exercise); if (error) return error; }
      }
    }
  }
  return null;
}
