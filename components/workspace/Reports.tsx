"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { useSearchParams } from "next/navigation";
import type { MilestoneReport } from "@/interfaces/Workspace.interface";
import { api, useWorkspace } from "./WorkspaceProvider";
import { Empty, PageHeading, Panel } from "./shared";
export function Reports() {
  const { courses } = useWorkspace();
  const query = useSearchParams();
  const [selected, setSelected] = useState(
    query.get("course") ?? courses.find((c) => c.startDate)?.id ?? "",
  );
  return (
    <>
      <PageHeading
        title="Milestones & reports"
        description="Follow each training period, compare actual performance, and review progress together."
      />
      <TextField
        select
        label="Training course"
        fullWidth
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        sx={{ mb: 3 }}
      >
        {courses
          .filter((c) => c.startDate)
          .map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.title}
            </MenuItem>
          ))}
      </TextField>
      {selected ? (
        <MilestoneTimeline
          key={selected}
          courseId={selected}
          initialMilestone={query.get("milestone") ?? undefined}
        />
      ) : (
        <Empty
          title="No milestones yet"
          description="Create a course with a start date and milestones to begin tracking progress."
        />
      )}
    </>
  );
}
export function MilestoneTimeline({
  courseId,
  initialMilestone,
}: {
  courseId: string;
  initialMilestone?: string;
}) {
  const [reports, setReports] = useState<MilestoneReport[]>([]),
    [selected, setSelected] = useState(initialMilestone ?? ""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  async function reload() {
    try {
      const r = await api<{ reports: MilestoneReport[] }>(
        `reports?courseId=${encodeURIComponent(courseId)}`,
      );
      setReports(r.reports.sort((a, b) => a.to.localeCompare(b.to)));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let alive = true;
    api<{ reports: MilestoneReport[] }>(
      `reports?courseId=${encodeURIComponent(courseId)}`,
    )
      .then((r) => {
        if (alive)
          setReports(r.reports.sort((a, b) => a.to.localeCompare(b.to)));
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [courseId]);
  const active =
    reports.find((r) => r.milestoneId === selected) ??
    reports.find((r) => r.status === "due") ??
    reports[0];
  return (
    <Stack sx={{ gap: 3 }}>
      {error && (
        <Alert
          severity="error"
          action={<Button onClick={reload}>Retry</Button>}
        >
          {error}
        </Alert>
      )}
      {loading ? (
        <Typography>Loading reports…</Typography>
      ) : !reports.length ? (
        <Empty
          title="No milestones in this course"
          description="Your coach can add review points in the course editor."
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "260px minmax(0,1fr)" },
            gap: 3,
          }}
        >
          <Stack
            component="nav"
            aria-label="Milestone timeline"
            sx={{
              gap: 1,
              alignSelf: "start",
              borderLeft: "2px solid",
              borderColor: "divider",
              pl: 2,
            }}
          >
            {reports.map((r, i) => (
              <Button
                key={r.id}
                onClick={() => setSelected(r.milestoneId)}
                aria-current={active?.id === r.id ? "step" : undefined}
                variant={active?.id === r.id ? "contained" : "outlined"}
                sx={{ textAlign: "left", justifyContent: "flex-start", py: 2 }}
              >
                <Box>
                  <Typography variant="caption">
                    {String(i + 1).padStart(2, "0")} · {r.to}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>{r.title}</Typography>
                  <Typography variant="caption">
                    {r.status} · {r.sessionCount} sessions
                  </Typography>
                </Box>
              </Button>
            ))}
          </Stack>
          {active && (
            <ReportEditor
              key={`${active.id}:${active.updatedAt ?? ""}`}
              report={active}
              onSaved={reload}
            />
          )}
        </Box>
      )}
    </Stack>
  );
}
function ReportEditor({
  report: r,
  onSaved,
}: {
  report: MilestoneReport;
  onSaved: () => Promise<void>;
}) {
  const { mutate } = useWorkspace();
  const [before, setBefore] = useState(r.weightBefore?.toString() ?? ""),
    [after, setAfter] = useState(r.weightAfter?.toString() ?? ""),
    [notes, setNotes] = useState(r.notes),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Stack sx={{ gap: 3 }}>
      <Panel title={r.title} action={<Chip label={r.status} />}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {r.from} — {r.to} · {r.sessionCount} recorded sessions ·{" "}
          {r.completedSets} completed sets
        </Typography>
        <Box
          component="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await mutate("reports", "PUT", {
                courseId: r.courseId,
                milestoneId: r.milestoneId,
                weightBefore: before === "" ? null : Number(before),
                weightAfter: after === "" ? null : Number(after),
                notes,
                updatedAt: r.updatedAt,
              });
              await onSaved();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Stack sx={{ gap: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                type="number"
                label="Weight before (kg)"
                value={before}
                onChange={(e) => setBefore(e.target.value)}
                helperText={r.weightBeforeSource}
                slotProps={{ htmlInput: { min: 20, max: 500, step: 0.1 } }}
              />
              <TextField
                type="number"
                label="Weight after (kg)"
                value={after}
                onChange={(e) => setAfter(e.target.value)}
                helperText={r.weightAfterSource}
                slotProps={{ htmlInput: { min: 20, max: 500, step: 0.1 } }}
              />
            </Box>
            {before !== "" && after !== "" && (
              <Typography>
                Change: {(Number(after) - Number(before)).toFixed(1)} kg
              </Typography>
            )}
            <TextField
              multiline
              minRows={3}
              label="Review notes & next steps"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {(!before || !after) && (
              <Alert severity="info">
                Missing measurements? Enter them manually when available. No
                measurements are estimated.
              </Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={busy}>
              {busy ? "Saving…" : "Save milestone report"}
            </Button>
          </Stack>
        </Box>
      </Panel>
      <Panel title="Prescribed vs. performed">
        {!r.logs.length ? (
          <Typography color="text.secondary">
            No daily logs in this period yet. Saved logs will appear here
            automatically.
          </Typography>
        ) : (
          r.logs.map((l) => (
            <Accordion key={l.id} disableGutters>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>
                    {l.date} · {l.programTitle}
                  </Typography>
                  <Typography variant="caption">
                    {l.durationMinutes ?? "—"} min · {l.weightKg ?? "—"} kg body
                    weight · {l.sets.filter((s) => s.completed).length}/
                    {l.sets.length} sets
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table
                    size="small"
                    aria-label="Planned versus actual workout"
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>Exercise / set</TableCell>
                        <TableCell>Coach’s target</TableCell>
                        <TableCell>Actual</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {l.sets.map((s) => (
                        <TableRow key={s.key}>
                          <TableCell>
                            {s.title} / {s.setNumber}
                          </TableCell>
                          <TableCell>
                            {s.planned.reps} reps × {s.planned.weight}{" "}
                            {s.planned.unit}
                            <br />
                            {s.planned.durationSeconds ?? "—"}s work ·{" "}
                            {s.planned.restSeconds}s rest
                          </TableCell>
                          <TableCell>
                            {s.actual.reps ?? "—"} reps ×{" "}
                            {s.actual.weight ?? "—"} {s.actual.unit}
                            <br />
                            {s.actual.durationSeconds ?? "—"}s work ·{" "}
                            {s.actual.restSeconds ?? "—"}s rest
                          </TableCell>
                          <TableCell>
                            {s.completed ? "Done" : "Not completed"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {l.notes && <Typography sx={{ mt: 2 }}>{l.notes}</Typography>}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Panel>
    </Stack>
  );
}
