import "server-only";
import { z } from "zod";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { readyDb, publicUser, type CourseRecord } from "./db";
import {
  requireUser,
  HttpError,
  sameOrigin,
  limit,
  passwordHash,
  passwordMatches,
  startSession,
  endSession,
  token,
  hash,
} from "./auth";
import * as schema from "./schemas";
import { validateCourse } from "@/utils/trainingValidation";
import { plannedSets, buildReport, dateInZone } from "@/utils/workout";
import { createReminders } from "./reminders";
import type {
  SessionUser,
  WorkspacePerson,
} from "@/interfaces/Workspace.interface";
const ok = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
const requireCoach = (u: SessionUser) => {
  if (u.role !== "coach") throw new HttpError(403, "Only coaches can do this.");
};
async function ownCourse(id: string, u: SessionUser) {
  const c = await (
    await readyDb()
  ).courses.findOne({
    _id: id,
    ...(u.role === "coach"
      ? { coachId: u.id }
      : { traineeId: u.id, status: { $ne: "Draft" } }),
  });
  if (!c) throw new HttpError(404, "Course not found.");
  return c;
}
async function body(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > 1000000)
    throw new HttpError(413, "Request is too large.");
  const text = await req.text();
  if (text.length > 1000000) throw new HttpError(413, "Request is too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}
const publicCoach = (u: SessionUser): WorkspacePerson => ({
  id: u.id,
  name: u.name,
  email: "",
  location: u.location,
  bio: u.bio,
  goal: u.goal,
  level: u.level,
  specialties: u.specialties,
  certifications: u.certifications,
  coachId: u.id,
});
export async function handle(req: Request, path: string[]) {
  try {
    return await dispatch(req, path);
  } catch (error) {
    if (error instanceof HttpError)
      return ok({ error: error.message }, error.status);
    if (error instanceof z.ZodError)
      return ok(
        {
          error: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        400,
      );
    if ((error as { code?: number }).code === 11000)
      return ok(
        { error: "This record already exists. Refresh and try again." },
        409,
      );
    console.error(
      "API failure",
      error instanceof Error ? error.name : "Unknown",
    );
    return ok(
      {
        error:
          "Service unavailable. Check the database configuration and try again.",
      },
      503,
    );
  }
}
async function dispatch(req: Request, path: string[]) {
  const route = path.join("/");
  const method = req.method;
  const url = new URL(req.url);
  if (route === "health/ingest" && method === "POST") {
    const bearer = req.headers
      .get("authorization")
      ?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!bearer) throw new HttpError(401, "A valid sync token is required.");
    const d = await readyDb();
    const connection = await d.healthTokens.findOne({
      tokenHash: hash(bearer),
      expiresAt: { $gt: new Date() },
    });
    if (!connection)
      throw new HttpError(401, "Sync connection expired or revoked.");
    await limit("health:" + connection._id, 120);
    const { days } = schema.healthBatch.parse(await body(req));
    const now = new Date().toISOString();
    for (const day of days) {
      if (day.date > dateInZone(day.timezone))
        throw new HttpError(400, "Future health dates are not accepted.");
      const id = `${connection.userId}:${connection.source}:${day.date}`;
      await d.health.replaceOne(
        { _id: id },
        {
          id,
          userId: connection.userId,
          source: connection.source,
          ...day,
          updatedAt: now,
        },
        { upsert: true },
      );
    }
    await d.healthTokens.updateOne(
      { _id: connection._id },
      { $set: { lastSyncAt: now } },
    );
    return ok({ accepted: days.length });
  }
  if (route === "cron/reminders" && method === "GET") {
    const secret = process.env.CRON_SECRET;
    const supplied = req.headers.get("authorization") || "";
    const wanted = `Bearer ${secret}`;
    if (
      !secret ||
      supplied.length !== wanted.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(wanted))
    )
      throw new HttpError(401, "Unauthorized");
    return ok({ reminders: await createReminders() });
  }
  if (method !== "GET") sameOrigin(req);
  if (route === "auth/logout" && method === "POST") {
    await endSession();
    return ok({ ok: true });
  }
  if (
    (route === "auth/register" || route === "auth/login") &&
    method === "POST"
  ) {
    const input = z
      .object({
        email: z
          .email()
          .max(254)
          .transform((v) => v.toLowerCase()),
        password: z.string().min(8).max(128),
        name: z.string().trim().min(2).max(120).optional(),
        role: z.enum(["coach", "trainee"]).optional(),
        timezone: schema.timezone.optional(),
      })
      .parse(await body(req));
    await limit("auth:" + input.email, 10);
    await limit(
      "auth-ip:" +
        (req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"),
      40,
    );
    const d = await readyDb();
    if (route === "auth/register") {
      if (!input.name || !input.role)
        throw new HttpError(400, "Name and role are required.");
      const id = randomUUID();
      const user = {
        _id: id,
        id,
        email: input.email,
        name: input.name,
        role: input.role,
        timezone: input.timezone || "UTC",
        passwordHash: await passwordHash(input.password),
        coachId: input.role === "coach" ? id : "",
        location: "",
        bio: "",
        goal: "",
        level: "Beginner" as const,
      };
      await d.users.insertOne(user);
      await startSession(id);
      return ok({ user: publicUser(user) }, 201);
    }
    const user = await d.users.findOne({ email: input.email });
    if (!user || !(await passwordMatches(input.password, user.passwordHash)))
      throw new HttpError(401, "Email or password is incorrect.");
    await startSession(user.id);
    return ok({ user: publicUser(user) });
  }
  if (route === "auth/forgot" && method === "POST") {
    const { email } = z
      .object({ email: z.email().transform((v) => v.toLowerCase()) })
      .parse(await body(req));
    await limit("reset:" + email, 3);
    if (
      !process.env.RESEND_API_KEY ||
      !process.env.EMAIL_FROM ||
      !process.env.APP_URL
    )
      throw new HttpError(503, "Password reset email is not configured.");
    const d = await readyDb();
    const user = await d.users.findOne({ email });
    if (user) {
      const value = token();
      await d.resets.insertOne({
        _id: hash(value),
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000),
      });
      const resetUrl = `${process.env.APP_URL}/reset-password?token=${value}`;
      const result = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: "Reset your coachOS password",
          text: `Reset your password within one hour: ${resetUrl}`,
        }),
      });
      if (!result.ok) throw new HttpError(503, "Email service unavailable.");
    }
    return ok({ ok: true });
  }
  if (route === "auth/reset" && method === "POST") {
    const input = z
      .object({
        token: z.string().regex(/^[a-f0-9]{64}$/),
        password: z.string().min(8).max(128),
      })
      .parse(await body(req));
    await limit("reset-token:" + input.token, 5);
    const d = await readyDb();
    const updatedHash = await passwordHash(input.password);
    await d.client.withSession(async (s) =>
      s.withTransaction(async () => {
        const record = await d.resets.findOneAndDelete(
          { _id: hash(input.token), expiresAt: { $gt: new Date() } },
          { session: s },
        );
        if (!record)
          throw new HttpError(400, "Reset link expired or already used.");
        await d.users.updateOne(
          { _id: record.userId },
          { $set: { passwordHash: updatedHash } },
          { session: s },
        );
        await d.sessions.deleteMany({ userId: record.userId }, { session: s });
      }),
    );
    return ok({ ok: true });
  }
  const u = await requireUser();
  const d = await readyDb();
  if (method !== "GET") await limit("write:" + u.id, 150);
  if (route === "workspace" && method === "GET") {
    const conversations = await d.conversations
      .find(u.role === "coach" ? { coachId: u.id } : { traineeId: u.id })
      .limit(300)
      .toArray();
    const ids = conversations.map((c) => c.id);
    const [
      courses,
      trainees,
      coach,
      logs,
      templates,
      messages,
      requests,
      health,
      connections,
    ] = await Promise.all([
      d.courses
        .find(
          u.role === "coach"
            ? { coachId: u.id }
            : { traineeId: u.id, status: { $ne: "Draft" } },
        )
        .limit(300)
        .toArray(),
      d.users
        .find(
          u.role === "coach"
            ? { coachId: u.id, role: "trainee" }
            : { _id: u.id },
        )
        .limit(300)
        .toArray(),
      u.role === "coach"
        ? Promise.resolve(u)
        : d.users.findOne({ _id: u.coachId }),
      d.workouts
        .find(u.role === "coach" ? { coachId: u.id } : { traineeId: u.id })
        .sort({ date: -1 })
        .limit(1000)
        .toArray(),
      d.templates.find({ coachId: u.id }).limit(300).toArray(),
      d.messages
        .find({ conversationId: { $in: ids } })
        .sort({ createdAt: -1 })
        .limit(1000)
        .toArray(),
      d.requests
        .find(u.role === "coach" ? { coachId: u.id } : { traineeId: u.id })
        .limit(300)
        .toArray(),
      d.health.find({ userId: u.id }).sort({ date: -1 }).limit(90).toArray(),
      d.healthTokens
        .find(
          { userId: u.id, expiresAt: { $gt: new Date() } },
          { projection: { tokenHash: 0 } },
        )
        .toArray(),
    ]);
    await createReminders(
      u.role === "coach" ? u.id : undefined,
      u.role === "trainee" ? u.id : undefined,
    );
    const reminders = await d.reminders
      .find({ userId: u.id })
      .limit(300)
      .toArray();
    return ok({
      user: u,
      courses,
      trainees: trainees.map(publicUser),
      coachProfile: coach
        ? publicCoach("passwordHash" in coach ? publicUser(coach) : coach)
        : null,
      logs,
      templates,
      messages: messages.reverse(),
      conversations,
      requests,
      health,
      connections: connections.map((c) => ({
        id: c._id,
        source: c.source,
        expiresAt: c.expiresAt,
        lastSyncAt: c.lastSyncAt,
      })),
      reminders,
    });
  }
  if (route === "profile" && method === "PUT") {
    const input = schema.profile.parse(await body(req));
    await d.users.updateOne({ _id: u.id }, { $set: input });
    return ok({ ok: true });
  }
  if (route === "courses" && method === "PUT") {
    requireCoach(u);
    const input = schema.course.parse(await body(req));
    const trainee = await d.users.findOne({
      _id: input.traineeId,
      coachId: u.id,
      role: "trainee",
    });
    if (!trainee)
      throw new HttpError(
        403,
        "The trainee must accept a coaching relationship first.",
      );
    if (input.status !== "Draft") {
      const error = validateCourse(input);
      if (error) throw new HttpError(400, error);
    }
    const entityIds = input.programs.flatMap((p) => [
      p.id,
      ...p.sections.flatMap((s) => [
        s.id,
        ...s.blocks.flatMap((b) => [
          b.id,
          ...(b.kind === "exercise" ? [b.exercise] : b.exercises).flatMap(
            (e) => [e.id, ...e.sets.map((s) => s.id)],
          ),
        ]),
      ]),
    ]);
    if (new Set(entityIds).size !== entityIds.length)
      throw new HttpError(400, "Duplicate program or exercise IDs.");
    if (
      new Set(input.milestones.map((m) => m.week)).size !==
      input.milestones.length
    )
      throw new HttpError(400, "Milestones must have distinct weeks.");
    const id = input.id || randomUUID();
    const existing = await d.courses.findOne({ _id: id });
    if (existing && existing.coachId !== u.id)
      throw new HttpError(403, "Not your course.");
    if (existing && existing.traineeId !== input.traineeId)
      throw new HttpError(
        400,
        "A saved course cannot be reassigned. Copy it instead.",
      );
    if (
      new Set(input.milestones.map((m) => m.id)).size !==
      input.milestones.length
    )
      throw new HttpError(400, "Each milestone needs a unique ID.");
    if (input.programs.some((p) => plannedSets(p).length > 1000))
      throw new HttpError(400, "A training day can contain at most 1000 sets.");
    const revision = (existing?.revision ?? 0) + 1;
    const next: CourseRecord = {
      ...input,
      id,
      _id: id,
      coachId: u.id,
      revision,
      progress: existing?.progress ?? 0,
    };
    if (existing) {
      if (input.revision !== existing.revision)
        throw new HttpError(409, "This course changed. Reload before saving.");
      const result = await d.courses.replaceOne(
        { _id: id, coachId: u.id, revision: existing.revision },
        next,
      );
      if (!result.matchedCount)
        throw new HttpError(409, "Course changed. Reload first.");
    } else await d.courses.insertOne(next);
    return ok({ course: next });
  }
  if (route === "workouts" && method === "PUT") {
    if (u.role !== "trainee")
      throw new HttpError(403, "Only trainees can log workouts.");
    const input = schema.workout.parse(await body(req));
    const c = await ownCourse(input.courseId, u);
    const p = c.programs.find((p) => p.id === input.programId);
    if (!p) throw new HttpError(404, "Program not found.");
    if (input.date > dateInZone(input.timezone) || input.date < c.startDate)
      throw new HttpError(400, "Choose a date between course start and today.");
    const id = `${u.id}:${c.id}:${p.id}:${input.date}`;
    const existing = await d.workouts.findOne({ _id: id });
    const planned = existing?.sets ?? plannedSets(p);
    if (
      new Set(input.sets.map((s) => s.key)).size !== input.sets.length ||
      input.sets.length !== planned.length ||
      input.sets.some((s) => !planned.some((p) => p.key === s.key))
    )
      throw new HttpError(
        400,
        "The workout structure changed. Reopen it before saving.",
      );
    const row = {
      _id: id,
      id,
      courseId: c.id,
      programId: p.id,
      traineeId: u.id,
      coachId: c.coachId,
      date: input.date,
      timezone: input.timezone,
      programTitle: existing?.programTitle ?? p.title,
      weightKg: input.weightKg,
      durationMinutes: input.durationMinutes,
      notes: input.notes,
      sets: planned.map((s) => ({
        ...s,
        actual: input.sets.find((v) => v.key === s.key)!.actual,
        completed: input.sets.find((v) => v.key === s.key)!.completed,
      })),
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      const result = await d.workouts.replaceOne(
        { _id: id, updatedAt: input.updatedAt || "" },
        row,
      );
      if (!result.matchedCount)
        throw new HttpError(409, "Workout changed elsewhere. Reopen it.");
    } else await d.workouts.insertOne(row);
    return ok({ log: row });
  }
  if (route === "reports" && method === "GET") {
    const c = await ownCourse(url.searchParams.get("courseId") || "", u);
    if (!c.startDate)
      throw new HttpError(
        400,
        "Set a course start date before opening its reports.",
      );
    const [logs, health, saved, trainee] = await Promise.all([
      d.workouts.find({ traineeId: c.traineeId }).sort({ date: 1 }).toArray(),
      d.health.find({ userId: c.traineeId }).sort({ date: 1 }).toArray(),
      d.reports.find({ courseId: c.id }).toArray(),
      d.users.findOne({ _id: c.traineeId }),
    ]);
    const today = dateInZone(trainee?.timezone || "UTC");
    return ok({
      reports: c.milestones.map((m) => {
        const generated = buildReport(c, m.id, logs, health, today);
        const edited = saved.find((r) => r.milestoneId === m.id);
        return edited
          ? {
              ...generated,
              weightBefore: edited.weightBefore,
              weightAfter: edited.weightAfter,
              weightBeforeSource: "Edited report",
              weightAfterSource: "Edited report",
              notes: edited.notes,
              updatedAt: edited.updatedAt,
              status: "submitted",
            }
          : generated;
      }),
    });
  }
  if (route === "reports" && method === "PUT") {
    const input = schema.report.parse(await body(req));
    const c = await ownCourse(input.courseId, u);
    if (!c.milestones.some((m) => m.id === input.milestoneId))
      throw new HttpError(404, "Milestone not found.");
    const id = `${c.id}:${input.milestoneId}`;
    const prior = await d.reports.findOne({ _id: id });
    const row = {
      _id: id,
      ...input,
      updatedAt: new Date().toISOString(),
      editedBy: u.id,
    };
    if (prior) {
      const result = await d.reports.replaceOne(
        { _id: id, updatedAt: input.updatedAt || "" },
        row,
      );
      if (!result.matchedCount)
        throw new HttpError(409, "Report changed. Reload before editing.");
    } else await d.reports.insertOne(row);
    await d.reminders.updateMany(
      { courseId: c.id, milestoneId: input.milestoneId },
      { $set: { read: true } },
    );
    return ok({ ok: true });
  }
  if (route === "coaches" && method === "GET") {
    const query = (url.searchParams.get("q") || "")
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rows = await d.users
      .find({
        role: "coach",
        ...(query ? { name: { $regex: query, $options: "i" } } : {}),
      })
      .limit(50)
      .toArray();
    return ok({ coaches: rows.map((v) => publicCoach(publicUser(v))) });
  }
  if (route === "conversations" && method === "POST") {
    if (u.role !== "trainee")
      throw new HttpError(403, "Trainees start a conversation with a coach.");
    const { coachId } = z
      .object({ coachId: z.string().max(150) })
      .parse(await body(req));
    const coach = await d.users.findOne({ _id: coachId, role: "coach" });
    if (!coach) throw new HttpError(404, "Coach not found.");
    const id = `${coachId}:${u.id}`;
    await d.conversations.updateOne(
      { _id: id },
      {
        $setOnInsert: {
          id,
          coachId,
          traineeId: u.id,
          coachName: coach.name,
          traineeName: u.name,
        },
      },
      { upsert: true },
    );
    return ok({ id });
  }
  if (route === "messages" && method === "POST") {
    const { conversationId, text } = z
      .object({
        conversationId: z.string().max(310),
        text: z.string().trim().min(1).max(5000),
      })
      .parse(await body(req));
    const c = await d.conversations.findOne({
      _id: conversationId,
      ...(u.role === "coach" ? { coachId: u.id } : { traineeId: u.id }),
    });
    if (!c) throw new HttpError(404, "Conversation not found.");
    const id = randomUUID(),
      now = new Date().toISOString();
    await d.messages.insertOne({
      _id: id,
      id,
      conversationId,
      traineeId: c.traineeId,
      sender: u.role,
      text,
      time: now,
      createdAt: now,
    });
    return ok({ ok: true }, 201);
  }
  if (route === "requests" && method === "POST") {
    if (u.role !== "trainee" || u.coachId)
      throw new HttpError(
        409,
        "You already have a coach or cannot send requests.",
      );
    const { conversationId } = z
      .object({ conversationId: z.string().max(310) })
      .parse(await body(req));
    const c = await d.conversations.findOne({
      _id: conversationId,
      traineeId: u.id,
    });
    if (!c) throw new HttpError(404, "Conversation not found.");
    const existing = await d.requests.findOne({ _id: c.id });
    if (existing?.status === "pending")
      throw new HttpError(409, "A request is already pending.");
    await d.requests.updateOne(
      { _id: c.id },
      {
        $set: {
          id: c.id,
          conversationId: c.id,
          coachId: c.coachId,
          traineeId: u.id,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );
    return ok({ ok: true });
  }
  if (route === "requests" && method === "PATCH") {
    const input = z
      .object({
        id: z.string().max(310),
        status: z.enum(["accepted", "declined", "cancelled"]),
      })
      .parse(await body(req));
    await d.client.withSession(async (session) =>
      session.withTransaction(async () => {
        const r = await d.requests.findOne(
          { _id: input.id, status: "pending" },
          { session },
        );
        if (!r)
          throw new HttpError(409, "This request has already been handled.");
        if (
          input.status === "cancelled"
            ? u.id !== r.traineeId
            : u.id !== r.coachId
        )
          throw new HttpError(403, "Not allowed.");
        if (input.status === "accepted") {
          const result = await d.users.updateOne(
            { _id: r.traineeId, coachId: "" },
            { $set: { coachId: u.id } },
            { session },
          );
          if (!result.matchedCount)
            throw new HttpError(409, "This trainee already has a coach.");
          await d.requests.updateMany(
            { traineeId: r.traineeId, status: "pending", _id: { $ne: r._id } },
            { $set: { status: "cancelled" } },
            { session },
          );
        }
        await d.requests.updateOne(
          { _id: r._id, status: "pending" },
          { $set: { status: input.status } },
          { session },
        );
      }),
    );
    return ok({ ok: true });
  }
  if (route === "templates" && method === "PUT") {
    requireCoach(u);
    const input = z
      .object({
        id: z.string().max(150),
        title: z.string().trim().min(1).max(120),
        kind: z.enum(["exercise", "day", "program"]),
        program: schema.program,
      })
      .parse(await body(req));
    const id = input.id || randomUUID();
    const existing = await d.templates.findOne({ _id: id });
    if (existing && existing.coachId !== u.id)
      throw new HttpError(403, "Not your template.");
    await d.templates.replaceOne(
      { _id: id },
      { ...input, id, coachId: u.id, updatedAt: new Date().toISOString() },
      { upsert: true },
    );
    return ok({ ok: true });
  }
  if (route === "templates" && method === "DELETE") {
    requireCoach(u);
    await d.templates.deleteOne({
      _id: url.searchParams.get("id") || "",
      coachId: u.id,
    });
    return ok({ ok: true });
  }
  if (route === "reminders" && method === "PATCH") {
    const { id } = z.object({ id: z.string().max(500) }).parse(await body(req));
    await d.reminders.updateOne(
      { _id: id, userId: u.id },
      { $set: { read: true } },
    );
    return ok({ ok: true });
  }
  if (route === "health/connections" && method === "POST") {
    if (u.role !== "trainee")
      throw new HttpError(403, "Only trainees can connect health data.");
    const { source, consent } = z
      .object({
        source: z.enum(["apple-health", "samsung-health"]),
        consent: z.literal(true),
      })
      .parse(await body(req));
    void consent;
    const value = token(),
      id = `${u.id}:${source}`;
    await d.healthTokens.replaceOne(
      { _id: id },
      {
        userId: u.id,
        source,
        tokenHash: hash(value),
        expiresAt: new Date(Date.now() + 90 * 86400000),
      },
      { upsert: true },
    );
    return ok({
      token: value,
      endpoint: `${process.env.APP_URL || new URL(req.url).origin}/api/health/ingest`,
    });
  }
  if (route === "health/connections" && method === "DELETE") {
    const source = z
      .enum(["apple-health", "samsung-health"])
      .parse(url.searchParams.get("source"));
    await d.healthTokens.deleteOne({ _id: `${u.id}:${source}`, userId: u.id });
    if (url.searchParams.get("deleteData") === "true")
      await d.health.deleteMany({ userId: u.id, source });
    return ok({ ok: true });
  }
  throw new HttpError(404, "Endpoint not found.");
}
