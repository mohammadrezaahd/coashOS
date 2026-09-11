import type {
  TrainingExercise,
  TrainingProgram,
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
export const exercisesOf = (p: TrainingProgram) =>
  p.sections.flatMap((s) =>
    s.blocks.flatMap((b) =>
      b.kind === "exercise" ? [b.exercise] : b.exercises,
    ),
  );
