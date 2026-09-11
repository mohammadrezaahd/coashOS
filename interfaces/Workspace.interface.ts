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
  revision?: number;
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
  conversationId?: string;
  createdAt?: string;
  id: string;
  traineeId: string;
  sender: DashboardRole;
  text: string;
  time: string;
}

export interface SessionUser extends WorkspacePerson {
  role: DashboardRole;
  timezone: string;
}
export interface ActualSet {
  key: string;
  exerciseId: string;
  title: string;
  setNumber: number;
  planned: {
    reps: number;
    weight: number;
    unit: "kg" | "lb";
    durationSeconds?: number;
    restSeconds: number;
  };
  actual: {
    reps: number | null;
    weight: number | null;
    unit: "kg" | "lb";
    durationSeconds: number | null;
    restSeconds: number | null;
  };
  completed: boolean;
}
export interface WorkoutLog {
  id: string;
  courseId: string;
  programId: string;
  traineeId: string;
  coachId: string;
  date: string;
  timezone: string;
  programTitle: string;
  weightKg: number | null;
  durationMinutes: number | null;
  notes: string;
  sets: ActualSet[];
  updatedAt: string;
}
export interface MilestoneReport {
  id: string;
  courseId: string;
  milestoneId: string;
  title: string;
  from: string;
  to: string;
  status: "upcoming" | "due" | "submitted";
  weightBefore: number | null;
  weightAfter: number | null;
  weightBeforeSource: string;
  weightAfterSource: string;
  notes: string;
  logs: WorkoutLog[];
  sessionCount: number;
  completedSets: number;
  updatedAt?: string;
}
export interface Conversation {
  id: string;
  coachId: string;
  traineeId: string;
  coachName: string;
  traineeName: string;
}
export interface CoachingRequest {
  id: string;
  conversationId: string;
  coachId: string;
  traineeId: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
}
export interface TrainingTemplate {
  id: string;
  coachId: string;
  title: string;
  kind: "exercise" | "day" | "program";
  program: TrainingProgram;
  updatedAt: string;
}
export interface Reminder {
  id: string;
  userId: string;
  courseId: string;
  milestoneId: string;
  title: string;
  dueDate: string;
  read: boolean;
}
export interface HealthDay {
  id: string;
  userId: string;
  source: "apple-health" | "samsung-health";
  date: string;
  timezone: string;
  steps?: number;
  activeCalories?: number;
  sleepMinutes?: number;
  weightKg?: number;
  updatedAt: string;
}
export interface HealthConnection {
  id: string;
  source: HealthDay["source"];
  lastSyncAt?: string;
  expiresAt: string;
}
