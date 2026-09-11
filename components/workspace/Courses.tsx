"use client";
import { WorkoutForm } from "./WorkoutForm";
import { FloatingAdd } from "./shared";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { ArrowBack, EditOutlined, FitnessCenter } from "@mui/icons-material";
import type {
  TrainingCourse,
  TrainingProgram,
} from "@/interfaces/Workspace.interface";
import { useWorkspace } from "./WorkspaceProvider";
import { exercisesOf } from "./data";
import {
  Empty,
  GoLink,
  PageHeading,
  Panel,
  Status,
  twoColumns,
  useDashboard,
} from "./shared";
export function CourseCard({ course }: { course: TrainingCourse }) {
  const { base, isCoach } = useDashboard();
  const { trainees, logs } = useWorkspace();
  return (
    <Panel>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Box
          sx={{
            p: 1.2,
            display: "flex",
            borderRadius: 2,
            bgcolor: "green.main",
            color: "green.sub",
          }}
        >
          <FitnessCenter />
        </Box>
        <Status value={course.status} />
      </Stack>
      <Typography
        component="h2"
        sx={{ mt: 3, mb: 0.5, fontSize: 21, fontWeight: 650 }}
      >
        {course.title}
      </Typography>
      <Typography color="text.secondary" sx={{ fontSize: 14 }}>
        {isCoach
          ? trainees.find((p) => p.id === course.traineeId)?.name
          : course.goal}
      </Typography>
      <Stack direction="row" sx={{ gap: 1, mt: 2.5, mb: 3 }}>
        <Chip
          variant="outlined"
          size="small"
          label={`${course.durationWeeks} weeks`}
        />
        <Chip
          variant="outlined"
          size="small"
          label={`${course.programs.length} training days`}
        />
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {logs.filter((l) => l.courseId === course.id).length} sessions recorded
      </Typography>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <GoLink href={`${base}/courses/${course.id}`}>View course</GoLink>
        {isCoach && (
          <Button
            component={Link}
            href={`${base}/courses/${course.id}/edit`}
            size="small"
            startIcon={<EditOutlined />}
          >
            Edit
          </Button>
        )}
      </Stack>
    </Panel>
  );
}
export function Courses() {
  const { base, isCoach, id } = useDashboard();
  const { courses, trainees } = useWorkspace();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const visible = courses.filter(
    (c) =>
      (isCoach || (c.traineeId === id && c.status !== "Draft")) &&
      (status === "All" || c.status === status) &&
      `${c.title} ${trainees.find((p) => p.id === c.traineeId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow={isCoach ? "Coaching / Courses" : "Training / Courses"}
        title={
          isCoach ? "A plan for every athlete." : "Your training, all together."
        }
        description={
          isCoach
            ? "Create, refine, and follow each training cycle."
            : "Everything your coach has planned for you."
        }
      />
      {isCoach && (
        <FloatingAdd href={base + "/courses/new"} label="Create course" />
      )}
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2, mb: 3 }}>
        <TextField
          label="Search courses"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        >
          {[
            "All",
            "Active",
            "Upcoming",
            "Completed",
            ...(isCoach ? ["Draft"] : []),
          ].map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Typography color="text.secondary" sx={{ fontSize: 14, mb: 2 }}>
        {visible.length} courses
      </Typography>
      {visible.length ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,minmax(0,1fr))",
              xl: "repeat(3,minmax(0,1fr))",
            },
            gap: 3,
          }}
        >
          {visible.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </Box>
      ) : (
        <Panel>
          <Empty
            title="No courses here yet"
            description="Try a different search or status."
            action={
              <Button
                onClick={() => {
                  setSearch("");
                  setStatus("All");
                }}
              >
                Clear filters
              </Button>
            }
          />
        </Panel>
      )}
    </>
  );
}
export function CourseDetails() {
  const { courseId } = useParams<{ courseId: string }>();
  const { base, isCoach, id } = useDashboard();
  const { courses, trainees } = useWorkspace();
  const c = courses.find(
    (c) =>
      c.id === courseId &&
      (isCoach || (c.traineeId === id && c.status !== "Draft")),
  );
  if (!c)
    return (
      <Empty
        title="Course not found"
        description="This course is not available in your workspace."
        action={<GoLink href={base + "/courses"}>Back to courses</GoLink>}
      />
    );
  return (
    <>
      <Button
        component={Link}
        href={base + "/courses"}
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
      >
        All courses
      </Button>
      <PageHeading
        eyebrow="Course overview"
        title={c.title}
        description={c.goal}
        action={
          isCoach && (
            <Button
              component={Link}
              href={`${base}/courses/${c.id}/edit`}
              variant="contained"
              startIcon={<EditOutlined />}
            >
              Edit course
            </Button>
          )
        }
      />
      <Box sx={twoColumns}>
        <Panel title="Training days" action={<Status value={c.status} />}>
          <Stack sx={{ gap: 2 }}>
            {c.programs.map((p, i) => (
              <Box
                key={p.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  p: 2,
                }}
              >
                <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
                  <Typography
                    sx={{
                      fontSize: 30,
                      fontWeight: 700,
                      color: "text.secondary",
                      opacity: 0.6,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{p.title}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                      {exercisesOf(p).length} exercises · {p.sections.length}{" "}
                      sections
                    </Typography>
                  </Box>
                </Stack>
                <GoLink href={`${base}/courses/${c.id}/programs/${p.id}`}>
                  {isCoach ? "Review program" : "Open workout"}
                </GoLink>
              </Box>
            ))}
            {!c.programs.length && (
              <Empty
                title="Room for your first training day"
                description="Add a program in the course editor."
              />
            )}
          </Stack>
        </Panel>
        <Stack sx={{ gap: 3 }}>
          <Panel title="The plan">
            <Typography color="text.secondary">{c.description}</Typography>
            <Divider sx={{ my: 2 }} />
            <Stack sx={{ gap: 2 }}>
              {[
                ["Trainee", trainees.find((p) => p.id === c.traineeId)?.name],
                ["Starts", c.startDate],
                ["Duration", `${c.durationWeeks} weeks`],
              ].map(([label, value]) => (
                <Stack
                  key={label}
                  direction="row"
                  sx={{ justifyContent: "space-between", gap: 2 }}
                >
                  <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>{value}</Typography>
                </Stack>
              ))}
            </Stack>
          </Panel>
          <Panel title="Milestones">
            <Stack sx={{ gap: 2 }}>
              {c.milestones.map((m) => (
                <Stack direction="row" key={m.id} sx={{ gap: 2 }}>
                  <Chip size="small" label={`Week ${m.week}`} />
                  <GoLink
                    href={`${base}/reports?course=${c.id}&milestone=${m.id}`}
                  >
                    {m.title}
                  </GoLink>
                </Stack>
              ))}
            </Stack>
          </Panel>
        </Stack>
      </Box>
    </>
  );
}
export function ProgramContent({
  program,
  interactive = false,
}: {
  program: TrainingProgram;
  interactive?: boolean;
}) {
  const { completedSets, setCompletedSets } = useWorkspace();
  const toggle = (id: string) =>
    setCompletedSets((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  return (
    <Stack sx={{ gap: 3 }}>
      {program.notes && (
        <Alert severity="info" icon={false}>
          {program.notes}
        </Alert>
      )}
      {program.sections.map((section) => (
        <Panel key={section.id} title={section.title}>
          <Stack sx={{ gap: 2 }}>
            {section.blocks.map((block) => (
              <Box
                key={block.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  overflow: "hidden",
                }}
              >
                {block.kind === "superset" && (
                  <Stack
                    direction="row"
                    sx={{
                      bgcolor: "green.main",
                      color: "green.sub",
                      p: 1.5,
                      gap: 1,
                      alignItems: "center",
                    }}
                  >
                    <Chip size="small" label="Superset" />
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {block.title} · {block.rounds} rounds
                    </Typography>
                  </Stack>
                )}
                {(block.kind === "exercise"
                  ? [block.exercise]
                  : block.exercises
                ).map((e, i) => (
                  <Box
                    key={e.id}
                    sx={{
                      p: 2,
                      borderTop: i ? "1px solid" : 0,
                      borderColor: "divider",
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{ justifyContent: "space-between", gap: 1, mb: 1 }}
                    >
                      <Typography sx={{ fontWeight: 650 }}>
                        {e.title || "Untitled exercise"}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        {e.restSeconds}s rest
                      </Typography>
                    </Stack>
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: 14, mb: 2 }}
                    >
                      {e.equipment}
                      {e.durationSeconds
                        ? ` · ${e.durationSeconds}s duration`
                        : ""}
                      {e.notes ? ` · ${e.notes}` : ""}
                    </Typography>
                    <Stack sx={{ gap: 0.7 }}>
                      {(block.kind === "superset"
                        ? Array.from({ length: block.rounds }, (_, round) => ({
                            ...e.sets[0],
                            id: `${e.id}-round-${round}`,
                          }))
                        : e.sets
                      ).map((s, j) => (
                        <Stack
                          key={s.id}
                          direction="row"
                          sx={{
                            bgcolor: "action.hover",
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 0.5,
                            gap: 2,
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            color="text.secondary"
                            sx={{ minWidth: 55, fontSize: 13 }}
                          >
                            {block.kind === "superset" ? "Round" : "Set"}{" "}
                            {j + 1}
                          </Typography>
                          <Typography sx={{ flex: 1, fontSize: 14 }}>
                            {s.reps} reps · {s.weight || "Body"}
                            {s.weight ? ` ${s.unit}` : "weight"}
                          </Typography>
                          {interactive && (
                            <Checkbox
                              checked={completedSets.includes(s.id)}
                              onChange={() => toggle(s.id)}
                              slotProps={{
                                input: {
                                  "aria-label": `Complete ${e.title} ${block.kind === "superset" ? "round" : "set"} ${j + 1}`,
                                },
                              }}
                            />
                          )}
                        </Stack>
                      ))}
                    </Stack>
                    {e.mediaUrl && /^https?:\/\//i.test(e.mediaUrl) && (
                      <Button
                        component="a"
                        href={e.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        sx={{ mt: 1 }}
                      >
                        View exercise media
                      </Button>
                    )}
                  </Box>
                ))}
              </Box>
            ))}
          </Stack>
          {!section.blocks.length && (
            <Typography color="text.secondary">
              No exercises added to this section yet.
            </Typography>
          )}
        </Panel>
      ))}
    </Stack>
  );
}
export function ProgramDetails() {
  const { courseId, programId } = useParams<{
    courseId: string;
    programId: string;
  }>();
  const { base, isCoach, id } = useDashboard();
  const { courses } = useWorkspace();
  const course = courses.find(
    (c) =>
      c.id === courseId &&
      (isCoach || (c.traineeId === id && c.status !== "Draft")),
  );
  const program = course?.programs.find((p) => p.id === programId);
  if (!program)
    return (
      <Empty
        title="Program not found"
        description="Return to your courses to find your training plan."
        action={<GoLink href={base + "/courses"}>My courses</GoLink>}
      />
    );
  return (
    <>
      <Button
        component={Link}
        href={`${base}/courses/${courseId}`}
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
      >
        Back to course
      </Button>
      <PageHeading
        eyebrow={course?.title}
        title={program.title}
        description={`${exercisesOf(program).length} exercises · Move with intent`}
        action={
          isCoach && (
            <Button
              component={Link}
              href={`${base}/courses/${courseId}/edit`}
              startIcon={<EditOutlined />}
            >
              Edit program
            </Button>
          )
        }
      />
      <Box sx={{ maxWidth: 960 }}>
        {isCoach ? (
          <ProgramContent program={program} />
        ) : (
          <WorkoutForm course={course!} program={program} />
        )}
      </Box>
    </>
  );
}
