"use client";
import { TemplateTools } from "./Templates";
import { FloatingAdd } from "./shared";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Step,
  StepButton,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  ArrowDownward,
  ArrowUpward,
  Check,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
} from "@mui/icons-material";
import type {
  TrainingBlock,
  TrainingCourse,
  TrainingProgram,
} from "@/interfaces/Workspace.interface";
import { useWorkspace } from "./WorkspaceProvider";
import { newExercise, newProgram, uid } from "./data";
import { Empty, GoLink, PageHeading, Panel, useDashboard } from "./shared";
import { ExerciseEditor } from "./ExerciseEditor";
import { ProgramContent } from "./Courses";
import { validateCourse } from "@/utils/trainingValidation";

function move<T>(items: T[], from: number, to: number): T[] {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
export function Builder() {
  const { isCoach, base } = useDashboard();
  const { courseId } = useParams<{ courseId?: string }>();
  const { courses, trainees } = useWorkspace();
  const search = useSearchParams();
  const existing = courseId
    ? courses.find((c) => c.id === courseId)
    : undefined;
  if (!isCoach)
    return (
      <Empty
        title="Your plan is created by your coach"
        description="Visit your training page to view your assigned programs."
        action={<GoLink href={base + "/courses"}>My training</GoLink>}
      />
    );
  if (courseId && !existing)
    return (
      <Empty
        title="Course not found"
        description="Return to the course list."
        action={<GoLink href={base + "/courses"}>Courses</GoLink>}
      />
    );
  if (!trainees.length)
    return (
      <Empty
        title="Connect with a trainee first"
        description="Accept a coaching request in Messages before creating a plan."
        action={<GoLink href={base + "/messages"}>Open messages</GoLink>}
      />
    );
  return (
    <CourseEditor
      key={courseId ?? "new"}
      initial={
        existing ?? {
          id: "",
          title: "",
          traineeId: trainees.some((p) => p.id === search.get("trainee"))
            ? search.get("trainee")!
            : (trainees[0]?.id ?? ""),
          status: "Draft",
          goal: "",
          description: "",
          startDate: "",
          durationWeeks: 8,
          progress: 0,
          programs: [],
          milestones: [],
        }
      }
    />
  );
}
function CourseEditor({ initial }: { initial: TrainingCourse }) {
  const { base } = useDashboard();
  const router = useRouter();
  const { trainees, mutate } = useWorkspace();
  const [draft, setDraft] = useState<TrainingCourse>(initial);
  const [step, setStep] = useState(0);
  const [day, setDay] = useState(0);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{
    sectionId: string;
    block: TrainingBlock;
    isNew: boolean;
  } | null>(null);
  const [remove, setRemove] = useState<{
    label: string;
    action: () => void;
  } | null>(null);
  const [publish, setPublish] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addKind, setAddKind] = useState("day");
  const [targetSection, setTargetSection] = useState("");
  const [saving, setSaving] = useState(false);
  const program = draft.programs[day];
  const update = (p: TrainingProgram) =>
    setDraft((prev) => ({
      ...prev,
      programs: prev.programs.map((v) => (v.id === p.id ? p : v)),
    }));
  const addDay = () => {
    setDraft((prev) => ({
      ...prev,
      programs: [...prev.programs, newProgram(prev.programs.length + 1)],
    }));
    setDay(draft.programs.length);
  };
  async function save(active: boolean) {
    const validation = active
      ? validateCourse(draft)
      : !draft.title.trim()
        ? "Give your course a title before saving."
        : null;
    if (validation) {
      setError(validation);
      setPublish(false);
      return;
    }
    const next = {
      ...draft,
      id: draft.id || uid(),
      status: active ? ("Active" as const) : draft.status,
    };
    if (saving) return;
    setSaving(true);
    try {
      await mutate("courses", "PUT", next);
      router.push(`${base}/courses/${next.id}`);
    } catch (e) {
      setError((e as Error).message);
      setPublish(false);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      {step < 2 && (
        <FloatingAdd
          label={step === 0 ? "Add milestone" : "Add to plan"}
          onClick={() => {
            if (step === 0) {
              setDraft((p) => ({
                ...p,
                milestones: [
                  ...p.milestones,
                  {
                    id: uid(),
                    title: "",
                    week: Math.min(
                      p.durationWeeks,
                      (p.milestones.at(-1)?.week ?? 0) + 1,
                    ),
                  },
                ],
              }));
            } else {
              setTargetSection(program?.sections[0]?.id ?? "");
              setAddKind(program ? "exercise" : "day");
              setAdding(true);
            }
          }}
        />
      )}
      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Add to your plan</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, pt: 1 }}>
            <TextField
              select
              label="What would you like to add?"
              value={addKind}
              onChange={(e) => setAddKind(e.target.value)}
            >
              <MenuItem value="day">Training day</MenuItem>
              <MenuItem value="section" disabled={!program}>
                Section in current day
              </MenuItem>
              <MenuItem value="exercise" disabled={!program?.sections.length}>
                Exercise
              </MenuItem>
              <MenuItem value="superset" disabled={!program?.sections.length}>
                Superset
              </MenuItem>
            </TextField>
            {["exercise", "superset"].includes(addKind) && (
              <TextField
                select
                label="Section"
                value={targetSection}
                onChange={(e) => setTargetSection(e.target.value)}
              >
                {program?.sections.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.title}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdding(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={
              ["exercise", "superset"].includes(addKind) && !targetSection
            }
            onClick={() => {
              if (addKind === "day") addDay();
              else if (addKind === "section")
                update({
                  ...program,
                  sections: [
                    ...program.sections,
                    { id: uid(), title: "New section", blocks: [] },
                  ],
                });
              else
                setEditing({
                  sectionId: targetSection,
                  isNew: true,
                  block:
                    addKind === "exercise"
                      ? { id: uid(), kind: "exercise", exercise: newExercise() }
                      : {
                          id: uid(),
                          kind: "superset",
                          title: "Superset",
                          rounds: 3,
                          exercises: [newExercise(), newExercise()],
                        },
                });
              setAdding(false);
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Button
        component={Link}
        href={base + "/courses"}
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
      >
        Courses
      </Button>
      <PageHeading
        eyebrow={draft.id ? "Refine the plan" : "A new training cycle"}
        title={
          draft.id
            ? "Make the next session better."
            : "Good progress starts with a plan."
        }
        action={
          <Button
            variant="outlined"
            startIcon={<SaveOutlined />}
            disabled={saving}
            onClick={() => save(false)}
          >
            {draft.id ? "Save changes" : "Save draft"}
          </Button>
        }
      />
      <Stepper nonLinear activeStep={step} sx={{ mb: 4, maxWidth: 800 }}>
        {["Course details", "Training days", "Review & publish"].map((s, i) => (
          <Step key={s}>
            <StepButton
              onClick={() => {
                setStep(i);
                setError("");
              }}
            >
              {s}
            </StepButton>
          </Step>
        ))}
      </Stepper>
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {step === 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0,1.8fr) minmax(260px,1fr)",
            },
            gap: 3,
          }}
        >
          <Panel title="The foundations">
            <Stack sx={{ gap: 3 }}>
              <TextField
                label="Course title"
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Strength foundations"
              />
              <TextField
                select
                label="Assigned trainee"
                value={draft.traineeId}
                onChange={(e) =>
                  setDraft({ ...draft, traineeId: e.target.value })
                }
              >
                {trainees.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Primary goal"
                value={draft.goal}
                onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
              />
              <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
                <TextField
                  label="Start date"
                  type="date"
                  value={draft.startDate}
                  onChange={(e) =>
                    setDraft({ ...draft, startDate: e.target.value })
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
                <TextField
                  label="Duration (weeks)"
                  type="number"
                  value={draft.durationWeeks}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      durationWeeks: Number(e.target.value),
                    })
                  }
                  slotProps={{ htmlInput: { min: 1, max: 104 } }}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Course description"
                multiline
                minRows={3}
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
              <Button
                variant="contained"
                onClick={() => setStep(1)}
                sx={{ alignSelf: "flex-end" }}
              >
                Continue to training days
              </Button>
            </Stack>
          </Panel>
          <Panel title="Milestones">
            <Typography color="text.secondary" sx={{ fontSize: 14, mb: 3 }}>
              Add a few moments to review progress together.
            </Typography>
            <Stack sx={{ gap: 2 }}>
              {draft.milestones.map((m) => (
                <Box key={m.id}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Milestone"
                    value={m.title}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        milestones: draft.milestones.map((v) =>
                          v.id === m.id ? { ...v, title: e.target.value } : v,
                        ),
                      })
                    }
                  />
                  <Stack direction="row" sx={{ gap: 1, mt: 1 }}>
                    <TextField
                      size="small"
                      label="Week"
                      type="number"
                      value={m.week}
                      slotProps={{
                        htmlInput: { min: 1, max: draft.durationWeeks },
                      }}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          milestones: draft.milestones.map((v) =>
                            v.id === m.id
                              ? { ...v, week: Number(e.target.value) }
                              : v,
                          ),
                        })
                      }
                    />
                    <IconButton
                      aria-label="Remove milestone"
                      onClick={() =>
                        setRemove({
                          label: m.title || "this milestone",
                          action: () =>
                            setDraft({
                              ...draft,
                              milestones: draft.milestones.filter(
                                (v) => v.id !== m.id,
                              ),
                            }),
                        })
                      }
                    >
                      <DeleteOutlined />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Panel>
        </Box>
      )}
      {step === 1 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "230px minmax(0,1fr)" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Panel title="Training days">
            <Stack sx={{ gap: 1 }}>
              {draft.programs.map((p, i) => (
                <Box
                  key={p.id}
                  sx={{
                    border: "1px solid",
                    borderColor: day === i ? "primary.main" : "divider",
                    borderRadius: 2,
                    p: 0.5,
                  }}
                >
                  <Button
                    fullWidth
                    onClick={() => setDay(i)}
                    sx={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                      color: day === i ? "primary.main" : "text.primary",
                    }}
                  >
                    {p.title || `Day ${i + 1}`}
                  </Button>
                  <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                    <IconButton
                      size="small"
                      aria-label="Move training day up"
                      disabled={!i}
                      onClick={() => {
                        setDraft({
                          ...draft,
                          programs: move(draft.programs, i, i - 1),
                        });
                        setDay(i - 1);
                      }}
                    >
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Move training day down"
                      disabled={i === draft.programs.length - 1}
                      onClick={() => {
                        setDraft({
                          ...draft,
                          programs: move(draft.programs, i, i + 1),
                        });
                        setDay(i + 1);
                      }}
                    >
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Panel>
          <Box>
            <TemplateTools
              program={program}
              onImport={(copy, kind) => {
                if (kind === "exercise" && program) {
                  const blocks = copy.sections.flatMap((s) => s.blocks);
                  update({
                    ...program,
                    sections: program.sections.length
                      ? program.sections.map((s, i) =>
                          i === 0
                            ? { ...s, blocks: [...s.blocks, ...blocks] }
                            : s,
                        )
                      : [{ id: uid(), title: "Exercises", blocks }],
                  });
                } else {
                  setDraft((p) => ({ ...p, programs: [...p.programs, copy] }));
                  setDay(draft.programs.length);
                }
              }}
            />
            {!program ? (
              <Panel>
                <Empty
                  title="What does day one look like?"
                  description="Use the Add button at the bottom right to create a day, section or exercise."
                />
              </Panel>
            ) : (
              <Stack sx={{ gap: 3 }}>
                <Panel>
                  <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                    <TextField
                      fullWidth
                      label="Training day title"
                      value={program.title}
                      onChange={(e) =>
                        update({ ...program, title: e.target.value })
                      }
                    />
                    <Tooltip title="Delete training day">
                      <IconButton
                        aria-label="Delete training day"
                        onClick={() =>
                          setRemove({
                            label: program.title,
                            action: () => {
                              setDraft((prev) => ({
                                ...prev,
                                programs: prev.programs.filter(
                                  (p) => p.id !== program.id,
                                ),
                              }));
                              setDay(0);
                            },
                          })
                        }
                      >
                        <DeleteOutlined />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <TextField
                    fullWidth
                    multiline
                    label="Notes for this day"
                    value={program.notes}
                    onChange={(e) =>
                      update({ ...program, notes: e.target.value })
                    }
                    sx={{ mt: 2 }}
                  />
                </Panel>
                {program.sections.map((section, si) => (
                  <Panel key={section.id}>
                    <Stack
                      direction="row"
                      sx={{ alignItems: "center", gap: 1, mb: 3 }}
                    >
                      <TextField
                        size="small"
                        label="Section"
                        value={section.title}
                        onChange={(e) =>
                          update({
                            ...program,
                            sections: program.sections.map((s) =>
                              s.id === section.id
                                ? { ...s, title: e.target.value }
                                : s,
                            ),
                          })
                        }
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        aria-label="Move section up"
                        disabled={!si}
                        onClick={() =>
                          update({
                            ...program,
                            sections: move(program.sections, si, si - 1),
                          })
                        }
                      >
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Move section down"
                        disabled={si === program.sections.length - 1}
                        onClick={() =>
                          update({
                            ...program,
                            sections: move(program.sections, si, si + 1),
                          })
                        }
                      >
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Delete section"
                        onClick={() =>
                          setRemove({
                            label: section.title,
                            action: () =>
                              update({
                                ...program,
                                sections: program.sections.filter(
                                  (s) => s.id !== section.id,
                                ),
                              }),
                          })
                        }
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Stack sx={{ gap: 1.5 }}>
                      {section.blocks.map((block, bi) => {
                        const exercises =
                          block.kind === "exercise"
                            ? [block.exercise]
                            : block.exercises;
                        return (
                          <Box
                            key={block.id}
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 1.5,
                              p: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              borderLeft: "3px solid",
                              borderLeftColor:
                                block.kind === "superset"
                                  ? "primary.main"
                                  : "divider",
                              borderRadius: 2,
                            }}
                          >
                            <Typography
                              color="text.secondary"
                              sx={{ fontSize: 14 }}
                            >
                              {String(bi + 1).padStart(2, "0")}
                            </Typography>
                            <Box sx={{ flex: "1 1 160px", minWidth: 0 }}>
                              {block.kind === "superset" && (
                                <Chip
                                  size="small"
                                  label={`${block.title || "Superset"} · ${block.rounds} rounds`}
                                  sx={{ mb: 0.5 }}
                                />
                              )}
                              <Typography
                                sx={{
                                  overflowWrap: "anywhere",
                                  fontWeight: 600,
                                }}
                              >
                                {exercises.map((e) => e.title).join(" + ")}
                              </Typography>
                              <Typography
                                color="text.secondary"
                                sx={{ fontSize: 13 }}
                              >
                                {block.kind === "exercise"
                                  ? `${block.exercise.sets.length} sets · ${block.exercise.sets.map((s) => s.reps).join(" / ")} reps · ${block.exercise.restSeconds}s rest`
                                  : `${exercises.length} exercises, performed back to back`}
                              </Typography>
                            </Box>
                            <Stack direction="row">
                              <IconButton
                                size="small"
                                aria-label="Move exercise up"
                                disabled={!bi}
                                onClick={() =>
                                  update({
                                    ...program,
                                    sections: program.sections.map((s) =>
                                      s.id === section.id
                                        ? {
                                            ...s,
                                            blocks: move(s.blocks, bi, bi - 1),
                                          }
                                        : s,
                                    ),
                                  })
                                }
                              >
                                <ArrowUpward fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                aria-label="Move exercise down"
                                disabled={bi === section.blocks.length - 1}
                                onClick={() =>
                                  update({
                                    ...program,
                                    sections: program.sections.map((s) =>
                                      s.id === section.id
                                        ? {
                                            ...s,
                                            blocks: move(s.blocks, bi, bi + 1),
                                          }
                                        : s,
                                    ),
                                  })
                                }
                              >
                                <ArrowDownward fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                aria-label="Edit exercise"
                                onClick={() =>
                                  setEditing({
                                    sectionId: section.id,
                                    block: structuredClone(block),
                                    isNew: false,
                                  })
                                }
                              >
                                <EditOutlined fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                aria-label="Delete exercise"
                                onClick={() =>
                                  setRemove({
                                    label: exercises
                                      .map((e) => e.title)
                                      .join(" + "),
                                    action: () =>
                                      update({
                                        ...program,
                                        sections: program.sections.map((s) =>
                                          s.id === section.id
                                            ? {
                                                ...s,
                                                blocks: s.blocks.filter(
                                                  (b) => b.id !== block.id,
                                                ),
                                              }
                                            : s,
                                        ),
                                      }),
                                  })
                                }
                              >
                                <DeleteOutlined fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                    {!section.blocks.length && (
                      <Typography
                        color="text.secondary"
                        sx={{ py: 3, fontSize: 14 }}
                      >
                        A blank page for purposeful movement.
                      </Typography>
                    )}
                  </Panel>
                ))}

                <Button variant="contained" onClick={() => setStep(2)}>
                  Review the plan
                </Button>
              </Stack>
            )}
          </Box>
        </Box>
      )}
      {step === 2 && (
        <Box sx={{ maxWidth: 1000 }}>
          <Panel title={draft.title || "Untitled course"}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Chip
                label={trainees.find((p) => p.id === draft.traineeId)?.name}
              />
              <Chip label={`${draft.durationWeeks} weeks`} />
              <Chip label={`${draft.programs.length} training days`} />
            </Stack>
            <Typography color="text.secondary">
              {draft.description || "Add a description in course details."}
            </Typography>
          </Panel>
          <Typography variant="h6" sx={{ mt: 4 }}>
            The trainee’s view
          </Typography>
          <Tabs
            value={program ? day : false}
            onChange={(_, i) => setDay(i)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3 }}
          >
            {draft.programs.map((p) => (
              <Tab key={p.id} label={p.title} />
            ))}
          </Tabs>
          {program ? (
            <ProgramContent program={program} />
          ) : (
            <Empty
              title="No training days yet"
              description="Add a training day before publishing."
              action={
                <Button onClick={() => setStep(1)}>Design training days</Button>
              }
            />
          )}
          <Stack
            direction="row"
            sx={{ justifyContent: "flex-end", gap: 2, mt: 3 }}
          >
            <Button onClick={() => setStep(1)}>Back to editing</Button>
            <Button
              variant="contained"
              startIcon={<Check />}
              onClick={() => {
                const message = validateCourse(draft);
                if (message) setError(message);
                else setPublish(true);
              }}
            >
              {draft.status === "Active"
                ? "Update active course"
                : "Publish course"}
            </Button>
          </Stack>
        </Box>
      )}
      {editing && program && (
        <ExerciseEditor
          key={editing.block.id}
          block={editing.block}
          onClose={() => setEditing(null)}
          onSave={(block) => {
            update({
              ...program,
              sections: program.sections.map((s) =>
                s.id !== editing.sectionId
                  ? s
                  : {
                      ...s,
                      blocks: editing.isNew
                        ? [...s.blocks, block]
                        : s.blocks.map((b) => (b.id === block.id ? block : b)),
                    },
              ),
            });
            setEditing(null);
          }}
        />
      )}
      <Dialog open={!!remove} onClose={() => setRemove(null)}>
        <DialogTitle>Remove {remove?.label}?</DialogTitle>
        <DialogContent>
          This will remove it from the current draft.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemove(null)}>Keep it</Button>
          <Button
            color="error"
            onClick={() => {
              remove?.action();
              setRemove(null);
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={publish} onClose={() => setPublish(false)}>
        <DialogTitle>Ready for your athlete?</DialogTitle>
        <DialogContent>
          <Typography>
            {draft.title} will become available to your trainee in My training.
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 14, mt: 2 }}>
            They can open each day and record their actual workout.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublish(false)}>Keep editing</Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => save(true)}
          >
            Publish course
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
