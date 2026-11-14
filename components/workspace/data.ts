import { coachDashboardData } from "@/public/fakeData/coachDashboard";
import { coachCoursesData } from "@/public/fakeData/courses";
import type { IExercise, IProgram, ISection, ISet, TrainingCourse, WorkspaceMessage, WorkspacePerson } from "@/interfaces/Workspace.interface";
import { Equipments, TargetTypes, WeightTypes } from "@/interfaces/Workspace.interface";

export const uid = () => crypto.randomUUID();
export const newExercise = (): IExercise => ({ id: uid(), title: "", desc: "", target: { target: 10, targetType: TargetTypes.COUNT, repeat: 3 }, restSeconds: 60 });
export const newSet = (): ISet => ({ id: uid(), title: "Exercise group", desc: "", repeat: 1, exercises: [newExercise()] });
export const newSection = (title = "Main workout"): ISection => ({ id: uid(), title, sets: [] });
export const newProgram = (day: number): IProgram => ({ id: uid(), title: `Day ${day}`, notes: "", workouts: [newSection()] });

const exercise = (id: string, title: string, target: number, equipment?: Equipments, load?: number): IExercise => ({ id, title, equipment, desc: "Move with control and keep your breathing steady.", restSeconds: 60, target: { target, targetType: TargetTypes.COUNT, repeat: 3, rpe: 6, ...(load ? { load, loadUnit: WeightTypes.KG } : {}) } });
const program = (courseId: string, day: number, index: number): IProgram => {
  const id = `${courseId}-day-${day}`;
  return { id, title: `Day ${day} · ${["Upper body strength", "Lower body strength", "Full body & mobility"][day - 1]}`, notes: "Choose a load that leaves two repetitions in reserve.", workouts: [
    { id: `${id}-warmup`, title: "Warm-up", sets: [{ id: `${id}-warm-set`, title: "Mobility", repeat: 1, exercises: [{ id: `${id}-e0`, title: "Dynamic mobility", desc: "Prepare the joints for the session.", target: { target: 5, targetType: TargetTypes.DURATION, targetUnit: "minutes", repeat: 1 }, restSeconds: 30 }] }] },
    { id: `${id}-main`, title: "Main workout", sets: [
      { id: `${id}-s1`, title: "Primary lift", repeat: 1, exercises: [exercise(`${id}-e1`, day === 2 ? "Goblet squat" : "Dumbbell bench press", 8, Equipments.DB, 16 + index * 2)] },
      { id: `${id}-s2`, title: "Strength circuit", desc: "Complete each exercise before repeating the round.", repeat: 3, exercises: [exercise(`${id}-e2`, day === 2 ? "Romanian deadlift" : "One-arm row", 10, Equipments.DB, 12), exercise(`${id}-e3`, day === 2 ? "Standing calf raise" : "Lateral raise", 12, Equipments.DB, 6)] },
      { id: `${id}-s3`, title: "Core", repeat: 1, exercises: [{ ...exercise(`${id}-e4`, "Dead bug", 10), target: { target: 30, targetType: TargetTypes.DURATION, targetUnit: "seconds", repeat: 2 } }] },
    ] },
  ] };
};

export const people: WorkspacePerson[] = coachCoursesData.map((c, i) => ({ id: c.trainee.id, name: `${c.trainee.firstName} ${c.trainee.lastName}`, email: `${c.trainee.firstName.toLowerCase()}@example.com`, location: "Tehran, Iran", bio: "Building strength, one session at a time.", goal: c.title, level: i % 3 === 0 ? "Beginner" : "Intermediate", coachId: "coach-1" }));
export const coach: WorkspacePerson = { id: "coach-1", name: "Mohammad Ahadiyan", email: "coach@example.com", location: "Tehran, Iran", bio: "Strength and conditioning coach. Thoughtful programming for sustainable progress.", goal: "Help every athlete move forward", level: "Advanced", phoneNumber: coachDashboardData.phoneNumber, birthDate: String(coachDashboardData.birthDate), address: coachDashboardData.address, specialties: coachDashboardData.specialties, certifications: coachDashboardData.certifications, medicalInfo: coachDashboardData.medicalInfo, coachId: "coach-1" };
export const initialCourses: TrainingCourse[] = coachCoursesData.map((c, index) => ({ id: c.id, title: c.title, traineeId: c.trainee.id, status: c.publishStatus === "Cancelled" ? "Draft" : c.publishStatus, goal: "Build strength and improve movement quality", description: "A progressive training cycle with dedicated strength, mobility, and recovery work.", startDate: c.startDate, durationWeeks: 8, progress: c.completion, milestones: [{ id: `${c.id}-m1`, title: "Technique review", week: 2 }, { id: `${c.id}-m2`, title: "Mid-cycle review", week: 4 }, { id: `${c.id}-m3`, title: "Cycle complete", week: 8 }], programs: [1, 2, 3].map((day) => program(c.id, day, index)) }));
export const initialMessages: WorkspaceMessage[] = people.slice(0, 4).flatMap((p, i) => [{ id: `m-${i}-1`, traineeId: p.id, sender: "trainee", text: "Finished the first session. The new tempo felt much better!", time: "09:24" }, { id: `m-${i}-2`, traineeId: p.id, sender: "coach", text: "Great. Keep the same load for the next session.", time: "09:32" }]);
export const exercisesOf = (p: IProgram) => p.workouts.flatMap((s) => s.sets.flatMap((g) => g.exercises));
export function cloneWithIds<T extends IProgram | ISection>(value: T): T { const copy = structuredClone(value) as T; if ("workouts" in copy) { copy.id = uid(); copy.workouts.forEach((s) => { s.id = uid(); s.sets.forEach((g) => { g.id = uid(); g.exercises.forEach((e) => { e.id = uid(); }); }); }); } else { copy.id = uid(); copy.sets.forEach((g) => { g.id = uid(); g.exercises.forEach((e) => { e.id = uid(); }); }); } return copy; }
