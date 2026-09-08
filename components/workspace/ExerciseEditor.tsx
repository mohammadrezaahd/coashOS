"use client";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Add, DeleteOutlined } from "@mui/icons-material";
import type {
  TrainingBlock,
  TrainingExercise,
} from "@/interfaces/Workspace.interface";
import { newExercise, uid } from "./data";
import { validateExercise } from "@/utils/trainingValidation";

export function ExerciseEditor({
  block,
  onSave,
  onClose,
}: {
  block: TrainingBlock;
  onSave: (value: TrainingBlock) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(block);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const group = draft.kind === "superset";
  const exercises =
    draft.kind === "exercise" ? [draft.exercise] : draft.exercises;
  const exercise = exercises[index] ?? exercises[0];
  function update(value: TrainingExercise) {
    setDraft((prev) =>
      prev.kind === "exercise"
        ? { ...prev, exercise: value }
        : {
            ...prev,
            exercises: prev.exercises.map((e) =>
              e.id === value.id ? value : e,
            ),
          },
    );
    setError("");
  }
  const number = (value: string) => Number(value);
  function save() {
    const error = exercises.map(validateExercise).find(Boolean);
    if (error) {
      setError(error);
      return;
    }
    if (
      draft.kind === "superset" &&
      (!Number.isInteger(draft.rounds) || draft.rounds < 1 || draft.rounds > 20)
    ) {
      setError("Use 1 to 20 rounds.");
      return;
    }
    onSave(draft);
  }
  return (
    <Dialog open fullWidth maxWidth="md" onClose={onClose}>
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <DialogTitle>
          {group ? "Design a superset" : "Exercise details"}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {group
              ? "These exercises run back to back. Rest between rounds."
              : "Keep the instructions specific to this athlete."}
          </Typography>
          {draft.kind === "superset" && (
            <>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{ gap: 2, mb: 2 }}
              >
                <TextField
                  label="Superset name"
                  fullWidth
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
                <TextField
                  label="Rounds"
                  type="number"
                  required
                  value={draft.rounds}
                  onChange={(e) =>
                    setDraft({ ...draft, rounds: number(e.target.value) })
                  }
                  slotProps={{ htmlInput: { min: 1, max: 20 } }}
                  sx={{ minWidth: 100 }}
                />
              </Stack>
              <Stack direction="row" sx={{ alignItems: "center", mb: 3 }}>
                <Tabs
                  value={index}
                  onChange={(_, i) => setIndex(i)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ flex: 1, minWidth: 0 }}
                >
                  {draft.exercises.map((e, i) => (
                    <Tab
                      key={e.id}
                      label={`Exercise ${String.fromCharCode(65 + i)}`}
                    />
                  ))}
                </Tabs>
                <Button
                  startIcon={<Add />}
                  onClick={() => {
                    setDraft({
                      ...draft,
                      exercises: [...draft.exercises, newExercise()],
                    });
                    setIndex(draft.exercises.length);
                  }}
                >
                  Add
                </Button>
              </Stack>
            </>
          )}
          <Stack sx={{ gap: 2.5 }}>
            <Stack direction="row" sx={{ gap: 1 }}>
              <TextField
                label="Exercise name"
                autoFocus
                required
                fullWidth
                value={exercise.title}
                onChange={(e) => update({ ...exercise, title: e.target.value })}
              />
              {draft.kind === "superset" && (
                <IconButton
                  aria-label="Remove exercise from superset"
                  disabled={draft.exercises.length <= 2}
                  onClick={() => {
                    setDraft({
                      ...draft,
                      exercises: draft.exercises.filter(
                        (e) => e.id !== exercise.id,
                      ),
                    });
                    setIndex(0);
                  }}
                >
                  <DeleteOutlined />
                </IconButton>
              )}
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" },
                gap: 2,
              }}
            >
              <TextField
                label="Equipment"
                value={exercise.equipment}
                onChange={(e) =>
                  update({ ...exercise, equipment: e.target.value })
                }
              />
              <TextField
                label="Rest (seconds)"
                type="number"
                required
                value={exercise.restSeconds}
                onChange={(e) =>
                  update({ ...exercise, restSeconds: number(e.target.value) })
                }
                slotProps={{ htmlInput: { min: 0, max: 3600 } }}
              />
              <TextField
                label="Duration (seconds, optional)"
                type="number"
                value={exercise.durationSeconds ?? ""}
                onChange={(e) =>
                  update({
                    ...exercise,
                    durationSeconds: e.target.value
                      ? number(e.target.value)
                      : undefined,
                  })
                }
                slotProps={{ htmlInput: { min: 1, max: 86400 } }}
              />
            </Box>
            <Divider />
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography sx={{ fontWeight: 650 }}>
                {group ? "Prescription per round" : "Sets & repetitions"}
              </Typography>
              {!group && (
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() =>
                    update({
                      ...exercise,
                      sets: [
                        ...exercise.sets,
                        {
                          ...exercise.sets[exercise.sets.length - 1],
                          id: uid(),
                        },
                      ],
                    })
                  }
                >
                  Add set
                </Button>
              )}
            </Stack>
            {exercise.sets.map((s, i) => (
              <Box
                key={s.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "32px minmax(0,1fr) minmax(0,1fr) 75px 32px",
                  alignItems: "center",
                  gap: { xs: 0.5, sm: 1.5 },
                }}
              >
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                  {i + 1}
                </Typography>
                <TextField
                  size="small"
                  label="Reps"
                  required
                  type="number"
                  value={s.reps}
                  slotProps={{ htmlInput: { min: 1, max: 1000 } }}
                  onChange={(e) =>
                    update({
                      ...exercise,
                      sets: exercise.sets.map((v) =>
                        v.id === s.id
                          ? { ...v, reps: number(e.target.value) }
                          : v,
                      ),
                    })
                  }
                />
                <TextField
                  size="small"
                  label="Weight"
                  required
                  type="number"
                  value={s.weight}
                  slotProps={{ htmlInput: { min: 0, max: 2000, step: 0.25 } }}
                  onChange={(e) =>
                    update({
                      ...exercise,
                      sets: exercise.sets.map((v) =>
                        v.id === s.id
                          ? { ...v, weight: number(e.target.value) }
                          : v,
                      ),
                    })
                  }
                />
                <TextField
                  select
                  label="Unit"
                  size="small"
                  value={s.unit}
                  onChange={(e) =>
                    update({
                      ...exercise,
                      sets: exercise.sets.map((v) =>
                        v.id === s.id
                          ? { ...v, unit: e.target.value as "kg" | "lb" }
                          : v,
                      ),
                    })
                  }
                >
                  <MenuItem value="kg">kg</MenuItem>
                  <MenuItem value="lb">lb</MenuItem>
                </TextField>
                <IconButton
                  size="small"
                  aria-label={`Remove set ${i + 1}`}
                  disabled={exercise.sets.length === 1}
                  onClick={() =>
                    update({
                      ...exercise,
                      sets: exercise.sets.filter((v) => v.id !== s.id),
                    })
                  }
                >
                  <DeleteOutlined fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <TextField
              label="Coaching notes"
              multiline
              minRows={2}
              value={exercise.notes}
              onChange={(e) => update({ ...exercise, notes: e.target.value })}
            />
            <TextField
              label="Image or video link (optional)"
              type="url"
              value={exercise.mediaUrl ?? ""}
              onChange={(e) =>
                update({ ...exercise, mediaUrl: e.target.value })
              }
              helperText="A link to your own demonstration of this exercise."
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Save {group ? "superset" : "exercise"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
