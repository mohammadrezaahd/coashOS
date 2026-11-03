/** New training domain. Kept separate from Workspace.interface.ts while legacy
 * Course screens are migrated incrementally. IDs are stable application IDs.
 */
export type TrainingUnit = "kg" | "lb" | "m" | "km" | "mi" | "sec" | "min" | "bpm";
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type TrainingIntensity = { value: number; scale: "RPE" | "percent_max" | "heart_rate_zone" | "custom"; label?: string };
export type RestPrescription = { durationSeconds: number; notes?: string };
export interface ExerciseDefinition {
  id: string;
  ownerId: string | null;
  name: string;
  description: string;
  category?: string;
  modality?: string;
  equipment: string[];
  muscleGroups: string[];
  movementPatterns: string[];
  media: { kind: "image" | "video"; url: string; alt?: string }[];
  defaultRest?: RestPrescription;
  supportedPrescriptionTypes: string[];
  metadata?: Record<string, JsonValue>;
  createdAt: string;
  updatedAt: string;
}
export type SetPrescription = {
  id: string;
  reps?: number;
  load?: { value: number; unit: "kg" | "lb" };
  durationSeconds?: number;
  distance?: { value: number; unit: "m" | "km" | "mi" };
  pace?: { value: number; unit: "sec/km" | "sec/mi" };
  speed?: { value: number; unit: "m/s" | "km/h" | "mph" };
  heartRateBpm?: number;
  restSeconds?: number;
  rpe?: number;
  rir?: number;
  tempo?: string;
  rangeOfMotion?: string;
  holdSeconds?: number;
  side?: "left" | "right" | "both";
  difficulty?: string;
  intensity?: TrainingIntensity;
};
export type ExercisePrescription =
  | { kind: "strength"; sets: SetPrescription[] }
  | { kind: "endurance"; distance?: { value: number; unit: "m" | "km" | "mi" }; durationSeconds?: number; pace?: { value: number; unit: "sec/km" | "sec/mi" }; speed?: { value: number; unit: "m/s" | "km/h" | "mph" }; heartRateBpm?: number; rpe?: number; intervals?: { workSeconds: number; recoverySeconds: number; repeatCount: number; targetIntensity?: TrainingIntensity } }
  | { kind: "mobility"; sets?: number; reps?: number; durationSeconds?: number; holdSeconds?: number; side?: "left" | "right" | "both"; restSeconds?: number }
  | { kind: "bodyweight"; sets?: SetPrescription[]; difficulty?: string }
  | { kind: "custom"; schemaId: string; values: Record<string, JsonValue> };
export interface PrescribedExercise {
  exerciseId: string;
  instructions?: string;
  prescription: ExercisePrescription;
}
export type TrainingBlock =
  | { id: string; kind: "exercise"; exercise: PrescribedExercise }
  | { id: string; kind: "superset" | "compound_set"; title?: string; rounds: number; exercises: PrescribedExercise[]; restBetweenRoundsSeconds?: number }
  | { id: string; kind: "circuit"; title?: string; rounds: number; workSeconds?: number; recoverySeconds?: number; blocks: TrainingBlock[] }
  | { id: string; kind: "interval"; title?: string; workSeconds: number; recoverySeconds: number; repeatCount: number; targetIntensity?: TrainingIntensity; exerciseId?: string }
  | { id: string; kind: "timed"; title?: string; durationSeconds: number; targetIntensity?: TrainingIntensity; exerciseId?: string }
  | { id: string; kind: "distance"; title?: string; distance: { value: number; unit: "m" | "km" | "mi" }; targetPace?: { value: number; unit: "sec/km" | "sec/mi" }; recoverySeconds?: number; exerciseId?: string }
  | { id: string; kind: "recovery"; title?: string; durationSeconds?: number; notes?: string }
  | { id: string; kind: "warm_up" | "cool_down"; title?: string; blocks: TrainingBlock[]; notes?: string };
export interface TrainingSection { id: string; title: string; notes?: string; blocks: TrainingBlock[] }
export interface TrainingDay { id: string; title: string; optional?: boolean; restDay?: boolean; notes?: string; sections: TrainingSection[] }
export interface WeekOverride { week: number; targetPath: string; value: JsonValue }
export interface TrainingWeek { id: string; weekNumber: number; phaseId?: string; overrides?: WeekOverride[] }
export interface TrainingPhase { id: string; title: string; startWeek: number; endWeek: number; goal?: string }
export interface WeeklySchedule { days: ({ dayOfWeek: number; dayId?: string; rest?: boolean; optional?: boolean })[] }
export interface TrainingProgramTemplate {
  id: string; ownerId: string; title: string; description: string; goals: string[]; methodology?: string; level?: string;
  durationWeeks?: number; phases?: TrainingPhase[]; days: TrainingDay[]; weeklySchedule?: WeeklySchedule;
  weeks?: TrainingWeek[]; version: number; createdAt: string; updatedAt: string;
}
export interface AssignedProgram { id: string; templateId: string; templateVersion: number; coachId: string; traineeId: string; assignedAt: string; startDate: string; snapshot: TrainingProgramTemplate; status: "active" | "paused" | "completed" | "cancelled" }
export interface ActualEntry {
  id: string; blockId: string; exerciseId?: string; index: number;
  reps?: number; load?: { value: number; unit: "kg" | "lb" }; durationSeconds?: number;
  distance?: { value: number; unit: "m" | "km" | "mi" }; pace?: { value: number; unit: "sec/km" | "sec/mi" };
  heartRateBpm?: number; rpe?: number; completed: boolean; notes?: string;
}
export interface WorkoutExecution {
  id: string; traineeId: string; assignedProgramId: string; assignedProgramVersion: number; scheduledDayId: string;
  executedAt: string; startedAt?: string; endedAt?: string; status: "in_progress" | "completed" | "skipped";
  entries: ActualEntry[]; notes?: string; feedback?: string; createdAt: string; updatedAt: string;
}
