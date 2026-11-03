import mongoose from "mongoose";

const { Schema } = mongoose;
const jsonObject = { type: Schema.Types.Mixed, default: {} };

export const exerciseDefinitionSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, default: null, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: "", maxlength: 10000 },
  category: { type: String, trim: true }, modality: { type: String, trim: true },
  equipment: { type: [String], default: [] }, muscleGroups: { type: [String], default: [] },
  movementPatterns: { type: [String], default: [] }, media: { type: [Schema.Types.Mixed], default: [] },
  defaultRest: { type: Schema.Types.Mixed }, supportedPrescriptionTypes: { type: [String], required: true },
  metadata: jsonObject,
}, { timestamps: true, strict: true });
exerciseDefinitionSchema.index({ ownerId: 1, name: 1 });

export const programTemplateSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: "", maxlength: 20000 }, goals: { type: [String], default: [] },
  methodology: String, level: String, durationWeeks: { type: Number, min: 1, max: 520 },
  phases: { type: [Schema.Types.Mixed], default: [] }, days: { type: [Schema.Types.Mixed], default: [] },
  weeklySchedule: Schema.Types.Mixed, weeks: { type: [Schema.Types.Mixed], default: [] },
  version: { type: Number, required: true, min: 1 },
}, { timestamps: true, strict: true });
programTemplateSchema.index({ ownerId: 1, updatedAt: -1 });

export const assignedProgramSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  templateId: { type: String, required: true, index: true },
  templateVersion: { type: Number, required: true, min: 1 },
  coachId: { type: String, required: true, index: true }, traineeId: { type: String, required: true, index: true },
  assignedAt: { type: Date, required: true }, startDate: { type: Date, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true, immutable: true },
  status: { type: String, enum: ["active", "paused", "completed", "cancelled"], default: "active", index: true },
}, { timestamps: true, strict: true });
assignedProgramSchema.index({ traineeId: 1, status: 1, startDate: 1 });

export const workoutExecutionSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  traineeId: { type: String, required: true, index: true }, assignedProgramId: { type: String, required: true, index: true },
  assignedProgramVersion: { type: Number, required: true, min: 1 }, scheduledDayId: { type: String, required: true },
  executedAt: { type: Date, required: true, index: true }, startedAt: Date, endedAt: Date,
  status: { type: String, enum: ["in_progress", "completed", "skipped"], required: true, index: true },
  entries: { type: [Schema.Types.Mixed], default: [] }, notes: { type: String, maxlength: 10000 }, feedback: { type: String, maxlength: 10000 },
}, { timestamps: true, strict: true, versionKey: "revision" });
workoutExecutionSchema.index({ traineeId: 1, executedAt: -1 });
workoutExecutionSchema.index({ traineeId: 1, assignedProgramId: 1, scheduledDayId: 1, executedAt: -1 });

export const ExerciseDefinitionModel = mongoose.models.TrainingExercise ?? mongoose.model("TrainingExercise", exerciseDefinitionSchema);
export const ProgramTemplateModel = mongoose.models.TrainingProgramTemplate ?? mongoose.model("TrainingProgramTemplate", programTemplateSchema);
export const AssignedProgramModel = mongoose.models.TrainingAssignedProgram ?? mongoose.model("TrainingAssignedProgram", assignedProgramSchema);
export const WorkoutExecutionModel = mongoose.models.TrainingWorkoutExecution ?? mongoose.model("TrainingWorkoutExecution", workoutExecutionSchema);
