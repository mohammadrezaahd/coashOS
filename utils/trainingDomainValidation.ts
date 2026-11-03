import type { ExerciseDefinition, ExercisePrescription, TrainingBlock, TrainingProgramTemplate, WorkoutExecution } from "@/interfaces/TrainingDomain.interface";

const finiteIn = (v: number | undefined, min: number, max: number): boolean => v !== undefined && Number.isFinite(v) && v >= min && v <= max;
const integerIn = (v: number | undefined, min: number, max: number): boolean => v !== undefined && Number.isInteger(v) && v >= min && v <= max;
const nonEmpty = (s: string | undefined): boolean => typeof s === "string" && s.trim().length > 0;

export function validateExerciseDefinition(exercise: ExerciseDefinition): string | null {
  if (!nonEmpty(exercise.id) || !nonEmpty(exercise.name)) return "An exercise needs a stable ID and name.";
  for (const media of exercise.media) {
    try { const url = new URL(media.url); if (!["http:", "https:"].includes(url.protocol)) return "Media URLs must use http or https."; }
    catch { return "Enter a valid exercise media URL."; }
  }
  if (!exercise.supportedPrescriptionTypes.length) return "Select at least one supported prescription type.";
  return null;
}

export function validatePrescription(p: ExercisePrescription): string | null {
  switch (p.kind) {
    case "strength":
      if (!p.sets.length) return "Strength prescriptions need at least one set.";
      for (const [i, s] of p.sets.entries()) {
        if (![s.reps, s.load?.value, s.durationSeconds, s.distance?.value, s.holdSeconds].some((v) => v !== undefined)) return `Set ${i + 1} needs at least one prescribed metric.`;
        if (s.reps !== undefined && !integerIn(s.reps, 1, 1000)) return `Set ${i + 1} has invalid repetitions.`;
        if (s.load && !finiteIn(s.load.value, 0, 2000)) return `Set ${i + 1} has invalid load.`;
        if (s.restSeconds !== undefined && !integerIn(s.restSeconds, 0, 86400)) return `Set ${i + 1} has invalid rest.`;
        if (s.rpe !== undefined && !finiteIn(s.rpe, 0, 10)) return `Set ${i + 1} RPE must be 0–10.`;
        if (s.rir !== undefined && !integerIn(s.rir, 0, 20)) return `Set ${i + 1} RIR must be 0–20.`;
      }
      return null;
    case "endurance":
      if (!p.distance && !p.durationSeconds && !p.intervals) return "Endurance needs a distance, duration or interval prescription.";
      if (p.distance && !finiteIn(p.distance.value, Number.MIN_VALUE, 1_000_000)) return "Enter a valid target distance.";
      if (p.durationSeconds !== undefined && !integerIn(p.durationSeconds, 1, 86400)) return "Enter a valid duration.";
      if (p.intervals && (!integerIn(p.intervals.workSeconds, 1, 86400) || !integerIn(p.intervals.recoverySeconds, 0, 86400) || !integerIn(p.intervals.repeatCount, 1, 1000))) return "Intervals need valid work, recovery and repeat values.";
      if (p.rpe !== undefined && !finiteIn(p.rpe, 0, 10)) return "RPE must be 0–10.";
      return null;
    case "mobility":
      if (![p.sets, p.reps, p.durationSeconds, p.holdSeconds].some((v) => v !== undefined)) return "Mobility needs reps, sets, duration or hold time.";
      if (p.sets !== undefined && !integerIn(p.sets, 1, 1000)) return "Enter valid mobility sets.";
      if (p.reps !== undefined && !integerIn(p.reps, 1, 1000)) return "Enter valid mobility repetitions.";
      if (p.durationSeconds !== undefined && !integerIn(p.durationSeconds, 1, 86400)) return "Enter a valid duration.";
      if (p.holdSeconds !== undefined && !integerIn(p.holdSeconds, 1, 86400)) return "Enter a valid hold duration.";
      if (p.restSeconds !== undefined && !integerIn(p.restSeconds, 0, 86400)) return "Enter valid rest.";
      return null;
    case "bodyweight":
      if (!p.sets?.length) return "Bodyweight prescriptions need at least one set.";
      for (const [i, s] of p.sets.entries()) {
        if (![s.reps, s.durationSeconds, s.holdSeconds].some((v) => v !== undefined)) return `Set ${i + 1} needs reps, duration or hold time.`;
        if (s.reps !== undefined && !integerIn(s.reps, 1, 1000)) return `Set ${i + 1} has invalid repetitions.`;
      }
      return null;
    case "custom":
      return nonEmpty(p.schemaId) ? null : "Custom prescriptions need a schema ID.";
  }
}

export function validateTrainingBlock(block: TrainingBlock, exerciseIds?: ReadonlySet<string>): string | null {
  const validExercise = (exerciseId: string, prescription?: ExercisePrescription): string | null => {
    if (!nonEmpty(exerciseId)) return "Every exercise block must reference an exercise.";
    if (exerciseIds && !exerciseIds.has(exerciseId)) return `Exercise ${exerciseId} was not found in the library.`;
    return prescription ? validatePrescription(prescription) : null;
  };
  switch (block.kind) {
    case "exercise": return validExercise(block.exercise.exerciseId, block.exercise.prescription);
    case "superset": case "compound_set":
      if (!integerIn(block.rounds, 1, 100)) return "A superset or compound set needs 1–100 rounds.";
      if (block.exercises.length < 2) return "Supersets and compound sets need at least two exercises.";
      for (const item of block.exercises) { const error = validExercise(item.exerciseId, item.prescription); if (error) return error; }
      if (block.restBetweenRoundsSeconds !== undefined && !integerIn(block.restBetweenRoundsSeconds, 0, 86400)) return "Enter valid rest between rounds.";
      return null;
    case "circuit":
      if (!integerIn(block.rounds, 1, 100) || !block.blocks.length) return "Circuits need 1–100 rounds and at least one block.";
      if (block.workSeconds !== undefined && !integerIn(block.workSeconds, 1, 86400)) return "Enter valid circuit work time.";
      if (block.recoverySeconds !== undefined && !integerIn(block.recoverySeconds, 0, 86400)) return "Enter valid circuit recovery time.";
      for (const child of block.blocks) { const error = validateTrainingBlock(child, exerciseIds); if (error) return error; }
      return null;
    case "interval":
      return integerIn(block.workSeconds, 1, 86400) && integerIn(block.recoverySeconds, 0, 86400) && integerIn(block.repeatCount, 1, 1000) ? (block.exerciseId ? validExercise(block.exerciseId) : null) : "Intervals need valid work, recovery and repeat values.";
    case "timed": return integerIn(block.durationSeconds, 1, 604800) ? (block.exerciseId ? validExercise(block.exerciseId) : null) : "Timed blocks need a positive duration.";
    case "distance": return finiteIn(block.distance.value, Number.MIN_VALUE, 1_000_000) ? (block.exerciseId ? validExercise(block.exerciseId) : null) : "Distance blocks need a positive distance.";
    case "recovery": return block.durationSeconds === undefined || integerIn(block.durationSeconds, 1, 604800) ? null : "Recovery duration must be positive.";
    case "warm_up": case "cool_down":
      for (const child of block.blocks) { const error = validateTrainingBlock(child, exerciseIds); if (error) return error; }
      return null;
  }
}

export function validateProgramTemplate(template: TrainingProgramTemplate): string | null {
  if (!nonEmpty(template.id) || !nonEmpty(template.ownerId) || !nonEmpty(template.title)) return "A program needs an ID, owner and title.";
  if (!Number.isInteger(template.version) || template.version < 1) return "Program version must be a positive integer.";
  if (template.durationWeeks !== undefined && !integerIn(template.durationWeeks, 1, 520)) return "Program duration must be 1–520 weeks.";
  const days = new Set(template.days.map((d) => d.id));
  if (days.size !== template.days.length) return "Training day IDs must be unique.";
  for (const day of template.days) {
    if (!nonEmpty(day.id) || !nonEmpty(day.title)) return "Every training day needs an ID and title.";
    if (day.restDay && day.sections.length) return "Rest days cannot contain training sections.";
    for (const section of day.sections) {
      if (!nonEmpty(section.title)) return "Every section needs a title.";
      for (const block of section.blocks) { const error = validateTrainingBlock(block); if (error) return error; }
    }
  }
  for (const item of template.weeklySchedule?.days ?? []) {
    if (!integerIn(item.dayOfWeek, 0, 6)) return "Schedule days must use weekday values 0–6.";
    if (item.dayId && !days.has(item.dayId)) return `Scheduled day ${item.dayId} does not exist.`;
    if (item.rest && item.dayId) return "A schedule entry cannot be both a rest day and a training day.";
  }
  for (const week of template.weeks ?? []) {
    if (!integerIn(week.weekNumber, 1, template.durationWeeks ?? 520)) return "Week numbers must be within the program duration.";
    for (const override of week.overrides ?? []) if (!nonEmpty(override.targetPath)) return "Week overrides need a target path.";
  }
  return null;
}

export function validateWorkoutExecution(log: WorkoutExecution): string | null {
  if (!nonEmpty(log.id) || !nonEmpty(log.traineeId) || !nonEmpty(log.assignedProgramId) || !nonEmpty(log.scheduledDayId)) return "Workout log is missing a required reference.";
  if (!Number.isInteger(log.assignedProgramVersion) || log.assignedProgramVersion < 1) return "Workout log must reference a valid program version.";
  if (Number.isNaN(Date.parse(log.executedAt))) return "Enter a valid execution date.";
  if (log.startedAt && log.endedAt && Date.parse(log.endedAt) < Date.parse(log.startedAt)) return "Workout end time cannot precede its start time.";
  const ids = new Set<string>();
  for (const entry of log.entries) {
    if (!nonEmpty(entry.id) || ids.has(entry.id)) return "Workout entry IDs must be present and unique.";
    ids.add(entry.id);
    if (!nonEmpty(entry.blockId) || !integerIn(entry.index, 0, 10000)) return "Workout entries need a block reference and valid sequence index.";
    if (entry.reps !== undefined && !integerIn(entry.reps, 0, 1000)) return "Actual reps must be between 0 and 1000.";
    if (entry.load && !finiteIn(entry.load.value, 0, 2000)) return "Actual load must be between 0 and 2000.";
    if (entry.durationSeconds !== undefined && !integerIn(entry.durationSeconds, 0, 604800)) return "Actual duration is invalid.";
    if (entry.distance && !finiteIn(entry.distance.value, 0, 1_000_000)) return "Actual distance is invalid.";
    if (entry.rpe !== undefined && !finiteIn(entry.rpe, 0, 10)) return "Actual RPE must be 0–10.";
  }
  return null;
}
