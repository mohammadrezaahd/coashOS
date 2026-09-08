import type { IMedInfo } from "./Coach.interface";
/** Client domain. Collections use IDs; their array position is the only ordering source.
 * UI selection, expanded rows and editor state never become domain fields.
 */
export type DashboardRole = "coach" | "trainee";
export type CourseState = "Draft" | "Active" | "Upcoming" | "Completed";
export interface TrainingSet {
  id: string;
  reps: number;
  weight: number;
  unit: "kg" | "lb";
}
export interface TrainingExercise {
  id: string;
  title: string;
  equipment: string;
  notes: string;
  restSeconds: number;
  durationSeconds?: number;
  mediaUrl?: string;
  sets: TrainingSet[];
}
export type TrainingBlock =
  | { id: string; kind: "exercise"; exercise: TrainingExercise }
  | {
      id: string;
      kind: "superset";
      title: string;
      rounds: number;
      exercises: TrainingExercise[];
    };
export interface TrainingSection {
  id: string;
  title: string;
  blocks: TrainingBlock[];
}
export interface TrainingProgram {
  id: string;
  title: string;
  notes: string;
  sections: TrainingSection[];
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
  programs: TrainingProgram[];
  milestones: { id: string; title: string; week: number }[];
}
export interface WorkspacePerson {
  id: string;
  name: string;
  email: string;
  location: string;
  bio: string;
  goal: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  phoneNumber?: string;
  birthDate?: string;
  address?: string;
  specialties?: string[];
  certifications?: string[];
  medicalInfo?: IMedInfo;
  coachId: string; // Each trainee has exactly one coach.
}
export interface WorkspaceMessage {
  id: string;
  traineeId: string;
  sender: DashboardRole;
  text: string;
  time: string;
}
