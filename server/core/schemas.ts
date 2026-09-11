import { z } from "zod";
const text = z.string().trim().max(5000);
const id = z.string().min(1).max(150);
const num = z.number().finite().min(0).max(100000);
export const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(s + "T12:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Invalid date");
export const timezone = z
  .string()
  .max(100)
  .refine((s) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: s });
      return true;
    } catch {
      return false;
    }
  }, "Invalid time zone");
const set = z.object({
  id,
  reps: z.number().int().min(1).max(1000),
  weight: num.max(2000),
  unit: z.enum(["kg", "lb"]),
});
const exercise = z.object({
  id,
  title: text,
  equipment: text,
  notes: text,
  restSeconds: num.max(3600),
  durationSeconds: num.max(86400).optional(),
  mediaUrl: z
    .union([z.literal(""), z.url().refine((s) => /^https?:/.test(s))])
    .optional(),
  sets: z.array(set).min(1).max(100),
});
export const block = z.discriminatedUnion("kind", [
  z.object({ id, kind: z.literal("exercise"), exercise }),
  z.object({
    id,
    kind: z.literal("superset"),
    title: text,
    rounds: z.number().int().min(1).max(20),
    exercises: z.array(exercise).min(2).max(20),
  }),
]);
export const program = z.object({
  id,
  title: text,
  notes: text,
  sections: z
    .array(z.object({ id, title: text, blocks: z.array(block).max(100) }))
    .max(30),
});
export const course = z.object({
  id: z.string().max(150),
  title: text.min(1),
  traineeId: id,
  status: z.enum(["Draft", "Active", "Upcoming", "Completed"]),
  goal: text,
  description: text,
  startDate: z.union([day, z.literal("")]),
  durationWeeks: z.number().int().min(1).max(104),
  progress: num.max(100),
  programs: z.array(program).max(30),
  milestones: z
    .array(
      z.object({ id, title: text, week: z.number().int().min(1).max(104) }),
    )
    .max(50),
  revision: z.number().int().optional(),
});
export const actual = z.object({
  reps: num.max(1000).nullable(),
  weight: num.max(2000).nullable(),
  unit: z.enum(["kg", "lb"]),
  durationSeconds: num.max(86400).nullable(),
  restSeconds: num.max(3600).nullable(),
});
export const workout = z.object({
  courseId: id,
  programId: id,
  date: day,
  timezone,
  weightKg: z.number().min(20).max(500).nullable(),
  durationMinutes: num.max(1440).nullable(),
  notes: text,
  sets: z
    .array(z.object({ key: id, actual, completed: z.boolean() }))
    .max(1000),
  updatedAt: z.string().optional(),
});
export const report = z.object({
  courseId: id,
  milestoneId: id,
  weightBefore: z.number().min(20).max(500).nullable(),
  weightAfter: z.number().min(20).max(500).nullable(),
  notes: text,
  updatedAt: z.string().optional(),
});
export const profile = z.object({
  name: text.min(1).max(120),
  location: text,
  bio: text,
  goal: text,
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  timezone: timezone.optional(),
  phoneNumber: z.string().max(40).optional(),
  birthDate: z.union([day, z.literal("")]).optional(),
  address: text.optional(),
  specialties: z.array(text.max(100)).max(30).optional(),
  certifications: z.array(text.max(100)).max(30).optional(),
  medicalInfo: z
    .object({
      height: num.max(300),
      weight: num.max(500),
      size: z.object({
        waist: num.max(500),
        hip: num.max(500),
        chest: num.max(500),
      }),
      bloodType: z.string().max(5),
      allergies: text,
      injuries: text,
      notes: text,
    })
    .optional(),
});
export const healthBatch = z.object({
  days: z
    .array(
      z.object({
        date: day,
        timezone,
        steps: num.int().max(200000).optional(),
        activeCalories: num.max(20000).optional(),
        sleepMinutes: num.max(1440).optional(),
        weightKg: z.number().min(20).max(500).optional(),
      }),
    )
    .min(1)
    .max(31),
});
