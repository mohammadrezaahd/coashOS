"use client";
import { useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { useWorkspace } from "./WorkspaceProvider";
import { Empty, GoLink, PageHeading, Panel, useDashboard } from "./shared";
export function Reminders() {
  const { reminders, mutate } = useWorkspace();
  const { base } = useDashboard();
  const [error, setError] = useState("");
  return (
    <>
      <PageHeading
        title="Reminders"
        description="Milestone check-ins appear two days before their due date and stay here until reviewed."
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Stack sx={{ gap: 2 }}>
        {[...reminders]
          .sort(
            (a, b) =>
              Number(a.read) - Number(b.read) ||
              a.dueDate.localeCompare(b.dueDate),
          )
          .map((r) => (
            <Panel
              key={r.id}
              title={r.title}
              action={
                <Button
                  disabled={r.read}
                  onClick={async () => {
                    try {
                      await mutate("reminders", "PATCH", { id: r.id });
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {r.read ? "Read" : "Mark read"}
                </Button>
              }
            >
              <Typography color="text.secondary">Due {r.dueDate}</Typography>
              <GoLink
                href={`${base}/reports?course=${r.courseId}&milestone=${r.milestoneId}`}
              >
                Review milestone
              </GoLink>
            </Panel>
          ))}
      </Stack>
      {!reminders.length && (
        <Empty
          title="No reminders yet"
          description="Add milestones to an active course to schedule check-ins."
        />
      )}
    </>
  );
}
