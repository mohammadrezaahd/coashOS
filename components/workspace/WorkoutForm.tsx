"use client";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  TrainingCourse,
  TrainingProgram,
  ActualSet,
  WorkoutLog,
} from "@/interfaces/Workspace.interface";
import { plannedSets, dateInZone } from "@/utils/workout";
import { useWorkspace } from "./WorkspaceProvider";
import { Panel } from "./shared";
export function WorkoutForm({
  course,
  program,
}: {
  course: TrainingCourse;
  program: TrainingProgram;
}) {
  const { user, logs } = useWorkspace();
  const [date, setDate] = useState(dateInZone(user!.timezone));
  const existing = logs.find(
    (l) =>
      l.courseId === course.id && l.programId === program.id && l.date === date,
  );
  return (
    <Stack sx={{ gap: 3 }}>
      <TextField
        type="date"
        label="Workout date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { min: course.startDate, max: dateInZone(user!.timezone) },
        }}
        helperText={`Daily log · ${user!.timezone}. Choose a previous date to edit its log.`}
      />
      <LogEditor
        key={`${date}:${existing?.updatedAt ?? "new"}`}
        course={course}
        program={program}
        date={date}
        existing={existing}
      />
    </Stack>
  );
}
function LogEditor({
  course,
  program,
  date,
  existing,
}: {
  course: TrainingCourse;
  program: TrainingProgram;
  date: string;
  existing?: WorkoutLog;
}) {
  const { user, mutate } = useWorkspace();
  const [sets, setSets] = useState<ActualSet[]>(
    existing?.sets ?? plannedSets(program),
  );
  const [weight, setWeight] = useState(existing?.weightKg?.toString() ?? "");
  const [minutes, setMinutes] = useState(
    existing?.durationMinutes?.toString() ?? "",
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const update = (index: number, patch: Partial<ActualSet>) =>
    setSets((v) => v.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  return (
    <Box
      component="form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await mutate("workouts", "PUT", {
            courseId: course.id,
            programId: program.id,
            date,
            timezone: user!.timezone,
            weightKg: weight === "" ? null : Number(weight),
            durationMinutes: minutes === "" ? null : Number(minutes),
            notes,
            sets: sets.map(({ key, actual, completed }) => ({
              key,
              actual,
              completed,
            })),
            updatedAt: existing?.updatedAt,
          });
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Stack sx={{ gap: 3 }}>
        {existing && (
          <Alert severity="success">
            Saved for {date}. You can update this log below.
          </Alert>
        )}
        <Alert severity="info">
          Tick the sets you completed and enter what you actually did. Empty
          values stay unrecorded; your coach’s targets are shown for comparison.
        </Alert>
        {sets.map((s, i) => (
          <Panel
            key={s.key}
            title={`${s.title} · Set ${s.setNumber}`}
            action={
              <FormControlLabel
                label="Completed"
                control={
                  <Checkbox
                    checked={s.completed}
                    onChange={(e) => update(i, { completed: e.target.checked })}
                  />
                }
              />
            }
          >
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Target: {s.planned.reps} reps × {s.planned.weight}{" "}
              {s.planned.unit}
              {s.planned.durationSeconds
                ? ` · ${s.planned.durationSeconds}s work`
                : ""}{" "}
              · {s.planned.restSeconds}s rest
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" },
                gap: 2,
              }}
            >
              {(
                ["reps", "weight", "durationSeconds", "restSeconds"] as const
              ).map((field) => (
                <TextField
                  key={field}
                  type="number"
                  label={
                    {
                      reps: "Actual reps",
                      weight: "Actual weight",
                      durationSeconds: "Work (seconds)",
                      restSeconds: "Rest (seconds)",
                    }[field]
                  }
                  value={s.actual[field] ?? ""}
                  slotProps={{
                    htmlInput: { min: 0, step: field === "weight" ? 0.1 : 1 },
                  }}
                  onChange={(e) =>
                    update(i, {
                      actual: {
                        ...s.actual,
                        [field]:
                          e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              ))}
              <TextField
                select
                label="Weight unit"
                value={s.actual.unit}
                onChange={(e) =>
                  update(i, {
                    actual: {
                      ...s.actual,
                      unit: e.target.value as "kg" | "lb",
                    },
                  })
                }
              >
                <MenuItem value="kg">kg</MenuItem>
                <MenuItem value="lb">lb</MenuItem>
              </TextField>
            </Box>
          </Panel>
        ))}
        <Panel title="Session check-in">
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
                label="Body weight (kg, optional)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                slotProps={{ htmlInput: { min: 20, max: 500, step: 0.1 } }}
              />
              <TextField
                type="number"
                label="Session minutes (optional)"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                slotProps={{ htmlInput: { min: 0, max: 1440, step: 1 } }}
              />
            </Box>
            <TextField
              label="How did it feel? Any substitutions?"
              multiline
              minRows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={busy}>
              {busy
                ? "Saving…"
                : existing
                  ? "Update daily log"
                  : "Complete session & save log"}
            </Button>
            <Typography variant="caption" color="text.secondary">
              This log automatically contributes to its milestone report.
              Recording a session does not imply every prescribed set was
              completed.
            </Typography>
          </Stack>
        </Panel>
      </Stack>
    </Box>
  );
}
