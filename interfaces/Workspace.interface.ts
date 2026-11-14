import type { IMedInfo } from "./Coach.interface";

export type DashboardRole = "coach" | "trainee";
export type CourseState = "Draft" | "Active" | "Upcoming" | "Completed";

export enum TargetTypes {
  DURATION = "Duration",
  RPE = "RPE",
  COUNT = "Count",
  DISTANCE = "Distance",
  WEIGHT = "Weight",
}
export enum DurationTypes { M = "minutes", S = "seconds" }
export enum DistanceTypes { M = "meters", KM = "kilometers" }
export enum WeightTypes { KG = "kg", LB = "lb" }
export enum Equipments {
  DB = "Dumbbell", BAR = "Bar", PLT = "Plate", ROPE = "Rope", STEP = "Step",
  MBALL = "Medicine ball", MACHINE = "Machine",
}

export interface ITarget {
  target: number;
  targetType: TargetTypes;
  targetUnit?: string;
  repeat: number;
  each?: boolean;
  rpe?: number;
  load?: number;
  loadUnit?: WeightTypes;
}
export interface IExercise {
  id?: string;
  title: string;
  desc?: string;
  equipment?: Equipments;
  target: ITarget;
  restSeconds?: number;
  mediaUrl?: string;
}
export interface ISet {
  id?: string;
  title: string;
  desc?: string;
  repeat: number;
  exercises: IExercise[];
}
export interface ISection {
  id?: string;
  title: string;
  sets: ISet[];
  desc?: string;
}
export interface IProgram {
  id?: string;
  title: string;
  workouts: ISection[];
  notes?: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  traineeId: string;
  status: CourseState;
  goal: string;
  description: string;
  startDate: string;
  durationWeeks: number;
  progress: number;
  programs: IProgram[];
  milestones: { id: string; title: string; week: number }[];
}
export interface SectionTemplate { id: string; name: string; section: ISection; createdAt: string; }
export interface ProgramTemplate { id: string; name: string; program: IProgram; createdAt: string; }
export type WorkoutTemplate = SectionTemplate | ProgramTemplate;

export interface WorkspacePerson {
  id: string; name: string; email: string; location: string; bio: string; goal: string;
  level: "Beginner" | "Intermediate" | "Advanced"; phoneNumber?: string; birthDate?: string;
  address?: string; specialties?: string[]; certifications?: string[]; medicalInfo?: IMedInfo; coachId: string;
}
export interface WorkspaceMessage { id: string; traineeId: string; sender: DashboardRole; text: string; time: string; }
