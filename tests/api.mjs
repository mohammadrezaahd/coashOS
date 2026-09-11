// Runs against a disposable replica set and the production Next.js build; no external accounts.
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
const origin = "http://127.0.0.1:4239";
let mongo, server;
const day = (n) =>
  new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
try {
  mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: "7.0.14" },
  });
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "-p",
      "4239",
      "-H",
      "127.0.0.1",
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: "production",
        APP_URL: origin,
        MONGODB_URI: mongo.getUri(),
        MONGODB_DB: "coachos_test",
        CRON_SECRET: "integration-test-secret",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let errors = "";
  server.stderr.on("data", (d) => {
    errors += d;
  });
  server.stdout.on("data", () => {});
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(origin + "/login");
      if (r.ok) break;
    } catch {}
    if (i === 99) throw new Error("Test server did not start: " + errors);
    await delay(200);
  }
  async function request(
    path,
    method = "GET",
    body,
    session,
    expected = 200,
    extra = {},
  ) {
    const r = await fetch(origin + "/api/" + path, {
      method,
      headers: {
        Origin: origin,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(session ? { Cookie: session } : {}),
        ...extra,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json();
    assert.equal(
      r.status,
      expected,
      `${method} ${path}: ${JSON.stringify(data)}`,
    );
    return { data, cookie: r.headers.get("set-cookie")?.split(";")[0] };
  }
  const register = async (role, name) => {
    const r = await request(
      "auth/register",
      "POST",
      {
        name,
        role,
        email: name + "@example.test",
        password: "Test-pass-234!",
        timezone: "UTC",
      },
      undefined,
      201,
    );
    assert(!JSON.stringify(r.data).includes("passwordHash"));
    return { ...r.data.user, cookie: r.cookie };
  };
  const coach = await register("coach", "coach"),
    trainee = await register("trainee", "trainee"),
    stranger = await register("trainee", "stranger"),
    other = await register("coach", "other");
  await request("workspace", "GET", undefined, undefined, 401);
  await request("profile", "PUT", { name: "intruder" }, coach.cookie, 403, {
    Origin: "https://evil.example",
  });
  const { data: conv } = await request(
    "conversations",
    "POST",
    { coachId: coach.id },
    trainee.cookie,
  );
  await request(
    "messages",
    "POST",
    { conversationId: conv.id, text: "Can we discuss my goals?" },
    trainee.cookie,
    201,
  );
  await request(
    "messages",
    "POST",
    { conversationId: conv.id, text: "intrusion" },
    stranger.cookie,
    404,
  );
  await request(
    "requests",
    "POST",
    { conversationId: conv.id },
    trainee.cookie,
  );
  await request(
    "requests",
    "PATCH",
    { id: conv.id, status: "accepted" },
    other.cookie,
    403,
  );
  await request(
    "requests",
    "PATCH",
    { id: conv.id, status: "accepted" },
    coach.cookie,
  );
  assert.equal(
    (await request("workspace", "GET", undefined, trainee.cookie)).data.user
      .coachId,
    coach.id,
  );
  const p = {
    id: randomUUID(),
    title: "Day one",
    notes: "",
    sections: [
      {
        id: randomUUID(),
        title: "Main",
        blocks: [
          {
            id: randomUUID(),
            kind: "exercise",
            exercise: {
              id: randomUUID(),
              title: "Squat",
              equipment: "Barbell",
              notes: "",
              restSeconds: 90,
              durationSeconds: 45,
              sets: [{ id: randomUUID(), reps: 10, weight: 20, unit: "kg" }],
            },
          },
        ],
      },
    ],
  };
  const c = {
    id: randomUUID(),
    title: "Strength cycle",
    traineeId: trainee.id,
    status: "Active",
    goal: "Strength",
    description: "Test",
    startDate: day(-7),
    durationWeeks: 2,
    progress: 0,
    programs: [p],
    milestones: [{ id: randomUUID(), title: "Week one review", week: 1 }],
  };
  const saved = (await request("courses", "PUT", c, coach.cookie)).data.course;
  await request(
    "courses",
    "PUT",
    { ...saved, title: "wrong owner" },
    other.cookie,
    403,
  );
  await request("courses", "PUT", { ...saved, revision: 0 }, coach.cookie, 409);
  const e = p.sections[0].blocks[0].exercise;
  const log = {
    courseId: c.id,
    programId: p.id,
    date: day(-1),
    timezone: "UTC",
    weightKg: 88,
    durationMinutes: 40,
    notes: "Lighter today",
    sets: [
      {
        key: e.id + ":" + e.sets[0].id,
        actual: {
          reps: 8,
          weight: 15,
          unit: "kg",
          durationSeconds: 35,
          restSeconds: 120,
        },
        completed: true,
      },
    ],
  };
  await request("workouts", "PUT", log, stranger.cookie, 404);
  const savedLog = (await request("workouts", "PUT", log, trainee.cookie)).data
    .log;
  assert.equal(savedLog.sets[0].planned.weight, 20);
  assert.equal(savedLog.sets[0].actual.weight, 15);
  await request("workouts", "PUT", log, trainee.cookie, 409);
  const sync = (
    await request(
      "health/connections",
      "POST",
      { source: "apple-health", consent: true },
      trainee.cookie,
    )
  ).data;
  const days = {
    days: [{ date: day(-8), timezone: "UTC", weightKg: 90, steps: 1000 }],
  };
  await request("health/ingest", "POST", days, undefined, 200, {
    Authorization: "Bearer " + sync.token,
  });
  await request("health/ingest", "POST", days, undefined, 200, {
    Authorization: "Bearer " + sync.token,
  });
  const health = (await request("workspace", "GET", undefined, trainee.cookie))
    .data.health;
  assert.equal(health.length, 1);
  const reports = (
    await request("reports?courseId=" + c.id, "GET", undefined, coach.cookie)
  ).data.reports;
  assert.equal(reports[0].weightBefore, 90);
  assert.equal(reports[0].weightAfter, 88);
  assert.equal(reports[0].sessionCount, 1);
  assert.equal(reports[0].logs[0].sets[0].actual.restSeconds, 120);
  await request(
    "reports?courseId=" + c.id,
    "GET",
    undefined,
    stranger.cookie,
    404,
  );
  const template = {
    id: randomUUID(),
    title: "Reusable day",
    kind: "day",
    program: p,
  };
  await request("templates", "PUT", template, coach.cookie);
  await request("templates", "PUT", template, other.cookie, 403);
  const reminders = (await request("workspace", "GET", undefined, coach.cookie))
    .data.reminders;
  assert.equal(reminders.length, 1);
  await request(
    "reports",
    "PUT",
    {
      courseId: c.id,
      milestoneId: c.milestones[0].id,
      weightBefore: 90,
      weightAfter: 87.5,
      notes: "Reviewed together",
    },
    coach.cookie,
  );
  assert.equal(
    (
      await request(
        "reports?courseId=" + c.id,
        "GET",
        undefined,
        trainee.cookie,
      )
    ).data.reports[0].weightAfter,
    87.5,
  );
  assert.equal(
    (await request("workspace", "GET", undefined, coach.cookie)).data
      .reminders[0].read,
    true,
  );
  await request("cron/reminders", "GET", undefined, undefined, 401);
  await request("cron/reminders", "GET", undefined, undefined, 200, {
    Authorization: "Bearer integration-test-secret",
  });
  await request(
    "health/connections?source=apple-health",
    "DELETE",
    undefined,
    trainee.cookie,
  );
  await request("health/ingest", "POST", days, undefined, 401, {
    Authorization: "Bearer " + sync.token,
  });
  await request("auth/logout", "POST", undefined, trainee.cookie);
  await request("workspace", "GET", undefined, trainee.cookie, 401);
  console.log(
    "PASS: account sessions, origin protection, chat requests, owner isolation, courses, workout snapshots/conflicts, health idempotency/revocation, report aggregation/edits, templates and reminders.",
  );
} finally {
  if (server) {
    server.kill("SIGTERM");
    await new Promise((resolve) => {
      if (server.exitCode !== null) resolve();
      else server.once("exit", resolve);
    });
  }
  if (mongo) await mongo.stop();
}
