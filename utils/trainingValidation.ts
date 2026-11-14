import type { IExercise, IProgram, ITarget, TrainingCourse } from "@/interfaces/Workspace.interface";
import { DistanceTypes, DurationTypes, TargetTypes, WeightTypes } from "@/interfaces/Workspace.interface";
const integerIn = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;
const positive = (n: number) => Number.isFinite(n) && n > 0;
export function validateTarget(target: ITarget): string | null {
  if (!positive(target.target)) return "Target must be a positive number.";
  if (!integerIn(target.repeat, 1, 100)) return "Use between 1 and 100 sets.";
  if (target.rpe !== undefined && (!Number.isFinite(target.rpe) || target.rpe < 1 || target.rpe > 10)) return "RPE must be between 1 and 10.";
  if (target.load !== undefined && (!Number.isFinite(target.load) || target.load < 0 || target.load > 2000)) return "External load must be between 0 and 2000.";
  if (target.load !== undefined && !Object.values(WeightTypes).includes(target.loadUnit as WeightTypes)) return "Choose a valid load unit.";
  if ([TargetTypes.DURATION, TargetTypes.DISTANCE].includes(target.targetType) && !target.targetUnit) return "Choose a unit for this target type.";
  if (target.targetType === TargetTypes.DURATION && !Object.values(DurationTypes).includes(target.targetUnit as DurationTypes)) return "Choose minutes or seconds.";
  if (target.targetType === TargetTypes.DISTANCE && !Object.values(DistanceTypes).includes(target.targetUnit as DistanceTypes)) return "Choose meters or kilometers.";
  if (target.targetType === TargetTypes.WEIGHT && !Object.values(WeightTypes).includes(target.targetUnit as WeightTypes)) return "Choose kg or lb for a weight target.";
  return null;
}
export function validateExercise(exercise: IExercise): string | null {
  if (!exercise.title.trim()) return "Give every exercise a name.";
  const targetError = validateTarget(exercise.target); if (targetError) return targetError;
  if (exercise.restSeconds !== undefined && (!integerIn(exercise.restSeconds, 0, 3600))) return "Rest must be between 0 and 3600 seconds.";
  if (exercise.mediaUrl) { try { if (!["http:", "https:"].includes(new URL(exercise.mediaUrl).protocol)) return "Media must use an http or https link."; } catch { return "Enter a valid media link."; } }
  return null;
}
export function validateProgram(program: IProgram): string | null {
  if (!program.title.trim() || !program.workouts.length) return "Each training day needs a title and a section.";
  for (const section of program.workouts) {
    if (!section.title.trim() || !section.sets.length) return "Name each section and add an exercise group.";
    for (const group of section.sets) {
      if (!group.title.trim() || !integerIn(group.repeat, 1, 20) || !group.exercises.length) return "Groups need a name, 1–20 rounds, and at least one exercise.";
      for (const exercise of group.exercises) { const error = validateExercise(exercise); if (error) return error; }
    }
  }
  return null;
}
export function validateCourse(course: TrainingCourse): string | null {
  if (!course.title.trim() || !course.traineeId) return "Add a course title and choose a trainee.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(course.startDate) || !Number.isFinite(Date.parse(course.startDate)) || !integerIn(course.durationWeeks, 1, 104)) return "Choose a start date and a duration between 1 and 104 weeks.";
  if (course.milestones.some((m) => !m.title.trim() || !integerIn(m.week, 1, course.durationWeeks))) return "Give every milestone a title and a week inside this course.";
  if (!course.programs.length) return "Add at least one training day before publishing.";
  for (const program of course.programs) { const error = validateProgram(program); if (error) return error; }
  return null;
}
