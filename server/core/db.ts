import "server-only";
import { MongoClient } from "mongodb";
import type {
  SessionUser,
  TrainingCourse,
  WorkoutLog,
  WorkspaceMessage,
  Conversation,
  CoachingRequest,
  TrainingTemplate,
  Reminder,
  HealthDay,
} from "@/interfaces/Workspace.interface";
export interface UserRecord extends SessionUser {
  _id: string;
  passwordHash: string;
}
export interface SessionRecord {
  _id: string;
  userId: string;
  expiresAt: Date;
}
export interface CourseRecord extends TrainingCourse {
  _id: string;
  coachId: string;
  revision: number;
}
export interface ReportRecord {
  _id: string;
  courseId: string;
  milestoneId: string;
  weightBefore: number | null;
  weightAfter: number | null;
  notes: string;
  updatedAt: string;
  editedBy: string;
}
export interface HealthToken {
  _id: string;
  userId: string;
  source: HealthDay["source"];
  tokenHash: string;
  expiresAt: Date;
  lastSyncAt?: string;
}
const globalDb = globalThis as typeof globalThis & {
  coachDb?: Promise<MongoClient>;
};
export async function database() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("DATABASE_NOT_CONFIGURED");
  if (!globalDb.coachDb)
    globalDb.coachDb = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    })
      .connect()
      .catch((e) => {
        globalDb.coachDb = undefined;
        throw e;
      });
  const client = await globalDb.coachDb;
  const db = client.db(process.env.MONGODB_DB || "coachos");
  return {
    client,
    users: db.collection<UserRecord>("users"),
    sessions: db.collection<SessionRecord>("sessions"),
    courses: db.collection<CourseRecord>("courses"),
    workouts: db.collection<WorkoutLog & { _id: string }>("workouts"),
    reports: db.collection<ReportRecord>("reports"),
    conversations: db.collection<Conversation & { _id: string }>(
      "conversations",
    ),
    requests: db.collection<CoachingRequest & { _id: string }>("requests"),
    messages: db.collection<
      WorkspaceMessage & {
        _id: string;
        conversationId: string;
        createdAt: string;
      }
    >("messages"),
    templates: db.collection<TrainingTemplate & { _id: string }>("templates"),
    reminders: db.collection<Reminder & { _id: string }>("reminders"),
    health: db.collection<HealthDay & { _id: string }>("healthDays"),
    healthTokens: db.collection<HealthToken>("healthTokens"),
    rates: db.collection<{ _id: string; count: number; expiresAt: Date }>(
      "rateLimits",
    ),
    resets: db.collection<{ _id: string; userId: string; expiresAt: Date }>(
      "passwordResets",
    ),
  };
}
export async function ensureIndexes() {
  const d = await database();
  await Promise.all([
    d.users.createIndex({ email: 1 }, { unique: true }),
    d.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    d.workouts.createIndex(
      { traineeId: 1, courseId: 1, programId: 1, date: 1 },
      { unique: true },
    ),
    d.courses.createIndex({ coachId: 1, traineeId: 1 }),
    d.conversations.createIndex({ coachId: 1, traineeId: 1 }, { unique: true }),
    d.messages.createIndex({ conversationId: 1, createdAt: 1 }),
    d.rates.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    d.resets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    d.healthTokens.createIndex({ tokenHash: 1 }, { unique: true }),
    d.healthTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    d.health.createIndex({ userId: 1, source: 1, date: 1 }, { unique: true }),
    d.reminders.createIndex({ userId: 1, read: 1 }),
    d.templates.createIndex({ coachId: 1 }),
  ]);
}
let indexes: Promise<void> | undefined;
export async function readyDb() {
  if (!indexes)
    indexes = ensureIndexes().catch((e) => {
      indexes = undefined;
      throw e;
    });
  await indexes;
  return database();
}
export function publicUser(user: UserRecord): SessionUser {
  const { passwordHash, _id, ...safe } = user;
  void passwordHash;
  void _id;
  return safe;
}
