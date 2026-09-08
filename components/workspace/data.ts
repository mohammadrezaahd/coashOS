import { coachDashboardData } from "@/public/fakeData/coachDashboard";
import { coachCoursesData } from "@/public/fakeData/courses";
import type {
  TrainingCourse,
  TrainingExercise,
  TrainingProgram,
  WorkspacePerson,
  WorkspaceMessage,
} from "@/interfaces/Workspace.interface";

export const uid = () => crypto.randomUUID();
export const newExercise = (): TrainingExercise => ({
  id: uid(),
  title: "",
  equipment: "",
  notes: "",
  restSeconds: 60,
  sets: [{ id: uid(), reps: 10, weight: 0, unit: "kg" }],
});
export const newProgram = (day: number): TrainingProgram => ({
  id: uid(),
  title: `Day ${day}`,
  notes: "",
  sections: [{ id: uid(), title: "Main workout", blocks: [] }],
});
const exercise = (
  id: string,
  title: string,
  weight: number,
): TrainingExercise => ({
  id,
  title,
  equipment: weight ? "Dumbbells" : "Bodyweight",
  notes:
    "Move with control. Keep your core engaged throughout each repetition.",
  restSeconds: 60,
  sets: (id.endsWith("-e2") || id.endsWith("-e3") ? [1] : [1, 2, 3]).map(
    (n) => ({
      id: `${id}-s${n}`,
      reps: 12,
      weight,
      unit: "kg",
    }),
  ),
});
export const people: WorkspacePerson[] = coachCoursesData.map((c, i) => ({
  id: c.trainee.id,
  name: `${c.trainee.firstName} ${c.trainee.lastName}`,
  email: `${c.trainee.firstName.toLowerCase()}@example.com`,
  location: "Tehran, Iran",
  bio: "Building strength, one session at a time.",
  goal: c.title,
  level: i % 3 === 0 ? "Beginner" : "Intermediate",
  coachId: "coach-1",
}));
export const coach: WorkspacePerson = {
  id: "coach-1",
  name: "Mohammad Ahadiyan",
  email: "coach@example.com",
  location: "Tehran, Iran",
  bio: "Strength and conditioning coach. Thoughtful programming for sustainable progress.",
  goal: "Help every athlete move forward",
  level: "Advanced",
  phoneNumber: coachDashboardData.phoneNumber,
  birthDate: String(coachDashboardData.birthDate),
  address: coachDashboardData.address,
  specialties: coachDashboardData.specialties,
  certifications: coachDashboardData.certifications,
  medicalInfo: coachDashboardData.medicalInfo,
  coachId: "coach-1",
};
export const initialCourses: TrainingCourse[] = coachCoursesData.map(
  (c, index) => ({
    id: c.id,
    title: c.title,
    traineeId: c.trainee.id,
    status: c.publishStatus === "Cancelled" ? "Draft" : c.publishStatus,
    goal: "Build strength and improve movement quality",
    description:
      "A progressive training cycle with dedicated strength, mobility, and recovery work.",
    startDate: c.startDate,
    durationWeeks: 8,
    progress: c.completion,
    milestones: [
      { id: `${c.id}-m1`, title: "Technique review", week: 2 },
      { id: `${c.id}-m2`, title: "Mid-cycle review", week: 4 },
      { id: `${c.id}-m3`, title: "Cycle complete", week: 8 },
    ],
    programs: [
      "Upper body strength",
      "Lower body strength",
      "Full body & mobility",
    ].map((title, d) => {
      const id = `${c.id}-day-${d + 1}`;
      return {
        id,
        title: `Day ${d + 1} · ${title}`,
        notes: "Choose a load that leaves two repetitions in reserve.",
        sections: [
          {
            id: `${id}-warmup`,
            title: "Warm-up",
            blocks: [
              {
                id: `${id}-b0`,
                kind: "exercise",
                exercise: {
                  ...exercise(`${id}-e0`, "Dynamic mobility", 0),
                  durationSeconds: 300,
                  sets: [
                    { id: `${id}-warm-set`, reps: 1, weight: 0, unit: "kg" },
                  ],
                },
              },
            ],
          },
          {
            id: `${id}-main`,
            title: "Main workout",
            blocks: [
              {
                id: `${id}-b1`,
                kind: "exercise",
                exercise: exercise(
                  `${id}-e1`,
                  d === 1 ? "Goblet squat" : "Dumbbell bench press",
                  16 + index * 2,
                ),
              },
              {
                id: `${id}-b2`,
                kind: "superset",
                title: "Superset A",
                rounds: 3,
                exercises: [
                  exercise(
                    `${id}-e2`,
                    d === 1 ? "Romanian deadlift" : "One-arm row",
                    12,
                  ),
                  exercise(
                    `${id}-e3`,
                    d === 1 ? "Standing calf raise" : "Lateral raise",
                    6,
                  ),
                ],
              },
              {
                id: `${id}-b3`,
                kind: "exercise",
                exercise: exercise(`${id}-e4`, "Dead bug", 0),
              },
            ],
          },
        ],
      };
    }),
  }),
);
export const initialMessages: WorkspaceMessage[] = people
  .slice(0, 4)
  .flatMap((p, i) => [
    {
      id: `m-${i}-1`,
      traineeId: p.id,
      sender: "trainee",
      text: "Finished the first session. The new tempo felt much better!",
      time: "09:24",
    },
    {
      id: `m-${i}-2`,
      traineeId: p.id,
      sender: "coach",
      text: "Great. Keep the same load for the next session and focus on a controlled lowering phase.",
      time: "09:32",
    },
  ]);
export const exercisesOf = (p: TrainingProgram) =>
  p.sections.flatMap((s) =>
    s.blocks.flatMap((b) =>
      b.kind === "exercise" ? [b.exercise] : b.exercises,
    ),
  );
