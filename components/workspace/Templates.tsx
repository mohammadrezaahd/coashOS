"use client";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  TrainingProgram,
  TrainingTemplate,
} from "@/interfaces/Workspace.interface";
import { copyProgram } from "@/utils/workout";
import { useWorkspace } from "./WorkspaceProvider";
import { Empty, FloatingAdd, PageHeading, Panel, useDashboard } from "./shared";
export function TemplateTools({
  program,
  onImport,
}: {
  program?: TrainingProgram;
  onImport: (p: TrainingProgram, kind: TrainingTemplate["kind"]) => void;
}) {
  const { templates, mutate } = useWorkspace();
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [title, setTitle] = useState(""),
    [saved, setSaved] = useState(false);
  return (
    <>
      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", my: 2 }}>
        <Button variant="outlined" onClick={() => setOpen(true)}>
          Import from templates
        </Button>
        {program && (
          <>
            <TextField
              size="small"
              label="Template name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Button
              onClick={async () => {
                try {
                  await mutate("templates", "PUT", {
                    id: "",
                    title: title || program.title,
                    kind: "day",
                    program: copyProgram(program),
                  });
                  setSaved(true);
                  setError("");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Save this day as template
            </Button>
          </>
        )}
      </Stack>
      {saved && (
        <Alert onClose={() => setSaved(false)}>
          Template saved. Future edits here won’t change it.
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Import a reusable template</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Days are added to your course. Exercise templates are added to the
            current day. Each import is an independent, editable copy.
          </Typography>
          <Stack sx={{ gap: 1 }}>
            {templates.map((t) => (
              <Button
                key={t.id}
                variant="outlined"
                disabled={t.kind === "exercise" && !program}
                onClick={() => {
                  onImport(copyProgram(t.program), t.kind);
                  setOpen(false);
                }}
              >
                {t.title} · {t.kind}
              </Button>
            ))}
          </Stack>
          {!templates.length && (
            <Typography>
              No saved templates. Save a day here or create a template in the
              Templates page.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
export function Templates() {
  const { isCoach } = useDashboard();
  const { templates, courses, mutate } = useWorkspace();
  const [open, setOpen] = useState(false),
    [title, setTitle] = useState(""),
    [kind, setKind] = useState<TrainingTemplate["kind"]>("day"),
    [choice, setChoice] = useState(""),
    [exercise, setExercise] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const programs = courses.flatMap((c) =>
    c.programs.map((p) => ({ course: c.title, program: p })),
  );
  const selected = programs.find((p) => p.program.id === choice)?.program;
  const exercises =
    selected?.sections.flatMap((s) =>
      s.blocks.flatMap((b) =>
        b.kind === "exercise" ? [b.exercise] : b.exercises,
      ),
    ) ?? [];
  if (!isCoach)
    return (
      <Empty
        title="Templates are managed by your coach"
        description="Your assigned training days are available in My training."
      />
    );
  return (
    <>
      <PageHeading
        title="Your template library"
        description="Save an exercise, training day or program. Import it into a course, then adapt the copy to your trainee."
      />
      <FloatingAdd label="Save template" onClick={() => setOpen(true)} />
      {error && <Alert severity="error">{error}</Alert>}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2,1fr)",
            xl: "repeat(3,1fr)",
          },
          gap: 3,
        }}
      >
        {templates.map((t) => (
          <Panel key={t.id} title={t.title}>
            <Typography color="text.secondary">
              {t.kind} ·{" "}
              {t.program.sections.reduce((n, s) => n + s.blocks.length, 0)}{" "}
              blocks
            </Typography>
            <Typography variant="caption">
              Import from the training-day step of any course editor.
            </Typography>
            <Button
              color="error"
              onClick={async () => {
                if (
                  !window.confirm(
                    `Delete template “${t.title}”? Existing imported copies stay unchanged.`,
                  )
                )
                  return;
                try {
                  await mutate(
                    `templates?id=${encodeURIComponent(t.id)}`,
                    "DELETE",
                  );
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Delete
            </Button>
          </Panel>
        ))}
      </Box>
      {!templates.length && (
        <Empty
          title="Keep your best building blocks"
          description="Save from an existing course here, or save a training day directly in the course editor."
        />
      )}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Save a template</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, pt: 1 }}>
            <TextField
              label="Template title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              select
              label="Template type"
              value={kind}
              onChange={(e) =>
                setKind(e.target.value as TrainingTemplate["kind"])
              }
            >
              {["exercise", "day", "program"].map((k) => (
                <MenuItem key={k} value={k}>
                  {k}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Source training day / program"
              value={choice}
              onChange={(e) => {
                setChoice(e.target.value);
                setExercise("");
              }}
            >
              {programs.map((p) => (
                <MenuItem key={p.program.id} value={p.program.id}>
                  {p.course} / {p.program.title}
                </MenuItem>
              ))}
            </TextField>
            {kind === "exercise" && (
              <TextField
                select
                label="Exercise"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
              >
                {exercises.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.title}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {!programs.length && (
              <Alert severity="info">
                Create a training day in a course first. You can save it as a
                template before publishing.
              </Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={
              busy ||
              !title.trim() ||
              !selected ||
              (kind === "exercise" && !exercise)
            }
            onClick={async () => {
              if (!selected) return;
              setBusy(true);
              try {
                const e = exercises.find((e) => e.id === exercise);
                const p =
                  kind === "exercise"
                    ? {
                        id: crypto.randomUUID(),
                        title,
                        notes: "",
                        sections: [
                          {
                            id: crypto.randomUUID(),
                            title: "Exercises",
                            blocks: [
                              {
                                id: crypto.randomUUID(),
                                kind: "exercise" as const,
                                exercise: e!,
                              },
                            ],
                          },
                        ],
                      }
                    : selected;
                await mutate("templates", "PUT", {
                  id: "",
                  title,
                  kind,
                  program: copyProgram(p),
                });
                setOpen(false);
                setTitle("");
                setError("");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Save template
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
