"use client";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useWorkspace } from "./WorkspaceProvider";
import {
  Empty,
  FloatingAdd,
  GoLink,
  PageHeading,
  Panel,
  useDashboard,
} from "./shared";
export function Overview() {
  const { isCoach, base } = useDashboard();
  const { user, courses, trainees, logs, requests, reminders } = useWorkspace();
  const active = courses.filter((c) => c.status === "Active");
  const due = reminders.filter((r) => !r.read);
  return (
    <>
      <PageHeading
        eyebrow={isCoach ? "Coach workspace" : "Your training workspace"}
        title={`Hello, ${user!.name.split(" ")[0]}`}
        description={
          isCoach
            ? "Review progress, respond to requests, and plan the next session."
            : "Open your training day, complete your session, then record what you did."
        }
      />
      {isCoach && (
        <FloatingAdd label="Create course" href={base + "/courses/new"} />
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          {
            title: isCoach ? "Connected trainees" : "Active courses",
            value: isCoach ? trainees.length : active.length,
            href: isCoach ? "/trainees" : "/courses",
          },
          { title: "Recorded sessions", value: logs.length, href: "/reports" },
          {
            title: "Unreviewed reminders",
            value: due.length,
            href: "/reminders",
          },
        ].map((s) => (
          <Panel key={s.title}>
            <Typography color="text.secondary">{s.title}</Typography>
            <Typography sx={{ fontSize: 36, fontWeight: 700 }}>
              {s.value}
            </Typography>
            <GoLink href={base + s.href}>View details</GoLink>
          </Panel>
        ))}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.5fr 1fr" },
          gap: 3,
        }}
      >
        <Panel
          title={isCoach ? "Active training plans" : "Choose your training day"}
        >
          {active.length ? (
            <Stack sx={{ gap: 2 }}>
              {active.map((c) => (
                <Box
                  key={c.id}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>{c.title}</Typography>
                  <Typography color="text.secondary">
                    {isCoach
                      ? trainees.find((t) => t.id === c.traineeId)?.name
                      : c.goal}
                  </Typography>
                  {isCoach ? (
                    <GoLink href={`${base}/reports?course=${c.id}`}>
                      Review milestones
                    </GoLink>
                  ) : (
                    <Stack
                      direction="row"
                      sx={{ gap: 1, flexWrap: "wrap", mt: 2 }}
                    >
                      {c.programs.map((p) => (
                        <Button
                          component={Link}
                          key={p.id}
                          href={`${base}/courses/${c.id}/programs/${p.id}`}
                          variant="outlined"
                        >
                          {p.title} → Log workout
                        </Button>
                      ))}
                    </Stack>
                  )}
                  <GoLink href={`${base}/courses/${c.id}`}>Open plan</GoLink>
                </Box>
              ))}
            </Stack>
          ) : (
            <Empty
              title={
                isCoach
                  ? "Ready for your first training plan"
                  : "Your next step"
              }
              description={
                isCoach
                  ? "Accept a trainee’s request in Messages, then create their course."
                  : user!.coachId
                    ? "Your coach will publish a training course here."
                    : "Find a coach and start a conversation. Request coaching when you’re ready."
              }
              action={<GoLink href={base + "/messages"}>Open messages</GoLink>}
            />
          )}
        </Panel>
        <Stack sx={{ gap: 3 }}>
          <Panel title="Needs your attention">
            {due.length ? (
              due.slice(0, 5).map((r) => (
                <Box key={r.id} sx={{ mb: 2 }}>
                  <Chip size="small" label={`Review · ${r.dueDate}`} />
                  <Typography sx={{ mt: 1 }}>{r.title}</Typography>
                  <GoLink
                    href={`${base}/reports?course=${r.courseId}&milestone=${r.milestoneId}`}
                  >
                    Open report
                  </GoLink>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">
                You’re up to date. Milestone reminders appear two days before
                the review date.
              </Typography>
            )}
            {requests.some((r) => r.status === "pending") && (
              <GoLink href={base + "/messages"}>
                {requests.filter((r) => r.status === "pending").length} pending
                coaching requests
              </GoLink>
            )}
          </Panel>
          <Panel
            title={isCoach ? "Build once, reuse often" : "Your daily routine"}
          >
            <Typography color="text.secondary">
              {isCoach
                ? "Save exercises and full training days as templates. Import an independent copy into any trainee’s plan."
                : "1. Open a training day. 2. Record actual sets and your check-in. 3. Review your milestone with your coach."}
            </Typography>
            <GoLink href={base + (isCoach ? "/templates" : "/reports")}>
              {isCoach ? "Open templates" : "See your milestones"}
            </GoLink>
          </Panel>
        </Stack>
      </Box>
    </>
  );
}
