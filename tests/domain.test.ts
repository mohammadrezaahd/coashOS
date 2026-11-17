import { test } from "node:test";
import assert from "node:assert/strict";
import {
  plannedSets,
  buildReport,
  copyProgram,
  dateInZone,
} from "../utils/workout";
import type {
  TrainingCourse,
  TrainingProgram,
} from "../interfaces/Workspace.interface";
const program: TrainingProgram = {
  id: "p",
  title: "Day 1",
  notes: "",
  sections: [
    {
      id: "section",
      title: "Main",
      blocks: [
        {
          id: "b",
          kind: "superset",
          title: "Pair",
          rounds: 3,
          exercises: ["a", "b"].map((id) => ({
            id,
            title: id,
            equipment: "",
            notes: "",
            restSeconds: 60,
            sets: [{ id: "set-" + id, reps: 10, weight: 20, unit: "kg" }],
          })),
        },
      ],
    },
  ],
};
test("superset log has one independently editable record per round and exercise", () => {
  const sets = plannedSets(program);
  assert.equal(sets.length, 6);
  assert.equal(new Set(sets.map((s) => s.key)).size, 6);
  assert.equal(sets[0].actual.weight, null);
  assert.equal(sets[0].planned.weight, 20);
  sets[0].actual.weight = 15;
  assert.equal(sets[1].actual.weight, null);
});
test("template copies share neither identities nor nested references", () => {
  const a = copyProgram(program),
    b = copyProgram(program);
  assert.notEqual(a.id, b.id);
  assert.notEqual(a.sections[0].blocks[0].id, b.sections[0].blocks[0].id);
  a.sections[0].title = "Changed";
  assert.equal(program.sections[0].title, "Main");
});
test("milestone windows do not overlap and missing values stay missing", () => {
  const c: TrainingCourse = {
    id: "c",
    title: "Cycle",
    traineeId: "t",
    status: "Active",
    goal: "",
    description: "",
    startDate: "2026-09-01",
    durationWeeks: 2,
    progress: 0,
    programs: [program],
    milestones: [
      { id: "m1", title: "First", week: 1 },
      { id: "m2", title: "Second", week: 2 },
    ],
  };
  const first = buildReport(c, "m1", [], [], "2026-09-07"),
    second = buildReport(c, "m2", [], [], "2026-09-07");
  assert.equal(first.to, "2026-09-07");
  assert.equal(second.from, "2026-09-08");
  assert.equal(first.status, "due");
  assert.equal(second.status, "upcoming");
  assert.equal(first.weightBefore, null);
  assert.equal(first.weightAfter, null);
});
test("workout dates use the user timezone across midnight", () => {
  assert.equal(
    dateInZone("Asia/Tehran", new Date("2026-09-09T22:00:00Z")),
    "2026-09-10",
  );
  assert.equal(
    dateInZone("America/Los_Angeles", new Date("2026-09-10T01:00:00Z")),
    "2026-09-09",
  );
});
