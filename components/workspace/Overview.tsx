"use client";
import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowForward,
  FitnessCenterOutlined,
  PeopleOutlined,
  FlagOutlined,
  TaskAlt,
  PlayArrow,
} from "@mui/icons-material";
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
export function Overview() {
  const { isCoach, id, base } = useDashboard();
  const { courses, trainees, coachProfile, completedSessions } = useWorkspace();
  const own = isCoach
    ? courses
    : courses.filter((c) => c.traineeId === id && c.status !== "Draft");
  const active = own.filter((c) => c.status === "Active");
  const current = active[0] ?? own[0];
  const person = isCoach ? coachProfile : trainees.find((p) => p.id === id);
  const stats = isCoach
    ? [
        {
          title: "Your trainees",
          value: trainees.length,
          note: "People in your coaching space",
          icon: PeopleOutlined,
        },
        {
          title: "Active courses",
          value: active.length,
          note: "Currently in progress",
          icon: FitnessCenterOutlined,
        },
        {
          title: "Draft courses",
          value: courses.filter((c) => c.status === "Draft").length,
          note: "Ready for your next edit",
          icon: FlagOutlined,
        },
        {
          title: "Completed courses",
          value: courses.filter((c) => c.status === "Completed").length,
          note: "Milestones worth celebrating",
          icon: TaskAlt,
        },
      ]
    : [
        {
          title: "Course progress",
          value: `${current?.progress ?? 0}%`,
          note: current?.title ?? "No course assigned",
          icon: FlagOutlined,
        },
        {
          title: "Training days",
          value: current?.programs.length ?? 0,
          note: "In your current plan",
          icon: FitnessCenterOutlined,
        },
        {
          title: "Sessions completed",
          value: completedSessions.filter((s) =>
            current?.programs.some((p) => p.id === s),
          ).length,
          note: "In this preview session",
          icon: TaskAlt,
        },
        {
          title: "Your coach",
          value: coachProfile.name.split(" ")[0],
          note: "Here to support your progress",
          icon: PeopleOutlined,
        },
      ];
  return (
    <>
      <PageHeading
        eyebrow={isCoach ? "Your coaching space" : "Your training space"}
        title={`Good to see you, ${person?.name.split(" ")[0] ?? "athlete"}.`}
        description={
          isCoach
            ? "A little structure. A lot of progress."
            : "Take your time. Move with intent. Keep building."
        }
        action={
          isCoach ? (
            <Button
              component={Link}
              href={base + "/courses/new"}
              variant="contained"
              startIcon={<Add />}
            >
              Create a course
            </Button>
          ) : (
            <Button
              component={Link}
              href={base + "/courses"}
              variant="contained"
              endIcon={<ArrowForward />}
            >
              My training
            </Button>
          )
        }
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0,1fr))",
            xl: "repeat(4, minmax(0,1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {stats.map((s) => (
          <Panel key={s.title}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                {s.title}
              </Typography>
              <s.icon sx={{ color: "text.secondary", fontSize: 20 }} />
            </Stack>
            <Typography
              sx={{
                fontSize: { xs: 29, md: 36 },
                fontWeight: 700,
                letterSpacing: -1,
                my: 1.5,
              }}
            >
              {s.value}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              {s.note}
            </Typography>
          </Panel>
        ))}
      </Box>
      <Box sx={twoColumns}>
        <Box>
          {isCoach ? (
            <Panel
              title="Courses in motion"
              action={<GoLink href={base + "/courses"}>All courses</GoLink>}
            >
              <Stack sx={{ gap: 2.5 }}>
                {active.slice(0, 4).map((c) => (
                  <Box
                    key={c.id}
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      pb: 2,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{ justifyContent: "space-between", gap: 1 }}
                    >
                      <Box>
                        <GoLink href={`${base}/courses/${c.id}`}>
                          {c.title}
                        </GoLink>
                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: 14 }}
                        >
                          {trainees.find((p) => p.id === c.traineeId)?.name}
                        </Typography>
                      </Box>
                      <Status value={c.status} />
                    </Stack>
                    <Stack
                      direction="row"
                      sx={{ alignItems: "center", gap: 2, mt: 2 }}
                    >
                      <LinearProgress
                        variant="determinate"
                        value={c.progress}
                        sx={{ flex: 1, height: 6, borderRadius: 10 }}
                      />
                      <Typography sx={{ fontSize: 13 }}>
                        {c.progress}%
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
              {!active.length && (
                <Empty
                  title="A fresh start"
                  description="Create a course to start coaching."
                />
              )}
            </Panel>
          ) : (
            <Panel
              title="Your next session"
              action={<Chip label="Your pace, your progress" size="small" />}
            >
              {current?.programs[0] ? (
                <Box>
                  <Box
                    sx={{
                      bgcolor: "#17291e",
                      color: "#f4f9ee",
                      borderRadius: 3,
                      p: { xs: 3, md: 4 },
                      mb: 3,
                    }}
                  >
                    <Typography className="eyebrow" sx={{ color: "#c5f57a" }}>
                      {current.title}
                    </Typography>
                    <Typography
                      sx={{
                        maxWidth: 370,
                        mb: 2,
                        fontSize: 28,
                        fontWeight: 650,
                      }}
                    >
                      {current.programs[0].title}
                    </Typography>
                    <Typography sx={{ color: "#b9cbbd", mb: 3 }}>
                      {exercisesOf(current.programs[0]).length} exercises ·
                      Strength & control
                    </Typography>
                    <Button
                      component={Link}
                      href={`${base}/courses/${current.id}/programs/${current.programs[0].id}`}
                      variant="contained"
                      startIcon={<PlayArrow />}
                      sx={{
                        bgcolor: "#c5f57a",
                        color: "#17291e",
                        "&:hover": { bgcolor: "#b1df68" },
                      }}
                    >
                      Open workout
                    </Button>
                  </Box>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>
                    Coach’s focus
                  </Typography>
                  <Typography color="text.secondary">
                    {current.programs[0].notes}
                  </Typography>
                </Box>
              ) : (
                <Empty
                  title="Your next chapter starts here"
                  description="Your assigned training plan will appear here."
                />
              )}
            </Panel>
          )}
        </Box>
        <Stack sx={{ gap: 3 }}>
          <Panel title={isCoach ? "Needs your attention" : "Your coach"}>
            {isCoach ? (
              <Stack sx={{ gap: 2.5 }}>
                {courses
                  .filter(
                    (c) => c.status === "Draft" || c.status === "Upcoming",
                  )
                  .slice(0, 3)
                  .map((c) => (
                    <Box key={c.id}>
                      <Status value={c.status} />
                      <Typography sx={{ fontWeight: 600, mt: 1 }}>
                        {c.title}
                      </Typography>
                      <GoLink
                        href={`${base}/courses/${c.id}${c.status === "Draft" ? "/edit" : ""}`}
                      >
                        {c.status === "Draft"
                          ? "Continue planning"
                          : "Review course"}
                      </GoLink>
                    </Box>
                  ))}
              </Stack>
            ) : (
              <>
                <Stack
                  direction="row"
                  sx={{ gap: 2, alignItems: "center", mb: 2 }}
                >
                  <Avatar sx={{ bgcolor: "green.main", color: "green.sub" }}>
                    MA
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {coachProfile.name}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                      Strength & conditioning
                    </Typography>
                  </Box>
                </Stack>
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                  {coachProfile.bio}
                </Typography>
                <GoLink href={base + "/messages"}>Message your coach</GoLink>
              </>
            )}
          </Panel>
          <Panel title={isCoach ? "The next small step" : "Coming up"}>
            {isCoach ? (
              <>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Keep your plans personal. Review a trainee’s current course
                  before adding the next training day.
                </Typography>
                <GoLink href={base + "/trainees"}>Visit your trainees</GoLink>
              </>
            ) : (
              <Stack sx={{ gap: 2 }}>
                {current?.milestones.map((m) => (
                  <Stack key={m.id} direction="row" sx={{ gap: 2 }}>
                    <Chip label={`W${m.week}`} size="small" />
                    <Typography sx={{ fontSize: 14 }}>{m.title}</Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Panel>
        </Stack>
      </Box>
    </>
  );
}
