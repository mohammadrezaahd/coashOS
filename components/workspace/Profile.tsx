"use client";
import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SaveOutlined } from "@mui/icons-material";
import { useWorkspace } from "./WorkspaceProvider";
import { Empty, PageHeading, Panel, twoColumns, useDashboard } from "./shared";
import type { WorkspacePerson } from "@/interfaces/Workspace.interface";
function ProfileForm({ person }: { person: WorkspacePerson }) {
  const { isCoach } = useDashboard();
  const { setCoachProfile, setTrainees } = useWorkspace();
  const [draft, setDraft] = useState(person);
  const [saved, setSaved] = useState(false);
  const change = (
    field:
      | "name"
      | "email"
      | "location"
      | "goal"
      | "bio"
      | "level"
      | "phoneNumber"
      | "birthDate"
      | "address",
    value: string,
  ) => {
    setDraft((p) => ({ ...p, [field]: value }));
    setSaved(false);
  };
  const medical = draft.medicalInfo ?? {
    height: 0,
    weight: 0,
    size: { waist: 0, hip: 0, chest: 0 },
    bloodType: "",
    allergies: "",
    injuries: "",
    notes: "",
  };
  return (
    <>
      <PageHeading
        eyebrow="Your profile"
        title="A little more about you."
        description="Keep your details up to date."
      />
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (isCoach) setCoachProfile(draft);
          else
            setTrainees((prev) =>
              prev.map((p) => (p.id === draft.id ? draft : p)),
            );
          setSaved(true);
        }}
      >
        <Box sx={twoColumns}>
          <Stack sx={{ gap: 3 }}>
            <Panel title="Personal information">
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2.5,
                }}
              >
                <TextField
                  required
                  label="Full name"
                  value={draft.name}
                  onChange={(e) => change("name", e.target.value)}
                />
                <TextField
                  required
                  type="email"
                  label="Email address"
                  value={draft.email}
                  onChange={(e) => change("email", e.target.value)}
                />
                <TextField
                  label="Phone number"
                  type="tel"
                  value={draft.phoneNumber ?? ""}
                  onChange={(e) => change("phoneNumber", e.target.value)}
                />
                <TextField
                  label="Birth date"
                  type="date"
                  value={draft.birthDate ?? ""}
                  onChange={(e) => change("birthDate", e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Address"
                  value={draft.address ?? ""}
                  onChange={(e) => change("address", e.target.value)}
                />
                <TextField
                  label="Location"
                  value={draft.location}
                  onChange={(e) => change("location", e.target.value)}
                />
                <TextField
                  label={isCoach ? "Coaching focus" : "Training goal"}
                  value={draft.goal}
                  onChange={(e) => change("goal", e.target.value)}
                />
                <TextField
                  label="About you"
                  multiline
                  minRows={4}
                  value={draft.bio}
                  onChange={(e) => change("bio", e.target.value)}
                  sx={{ gridColumn: "1 / -1" }}
                />
                {!isCoach && (
                  <TextField
                    select
                    label="Training experience"
                    value={draft.level}
                    onChange={(e) => change("level", e.target.value)}
                  >
                    {["Beginner", "Intermediate", "Advanced"].map((l) => (
                      <MenuItem key={l} value={l}>
                        {l}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Box>
            </Panel>
            {isCoach && (
              <Panel title="Coaching expertise">
                <Stack sx={{ gap: 2 }}>
                  <TextField
                    label="Specialties"
                    helperText="Separate specialties with commas."
                    value={(draft.specialties ?? []).join(",")}
                    onChange={(e) => {
                      setDraft({
                        ...draft,
                        specialties: e.target.value.split(","),
                      });
                      setSaved(false);
                    }}
                  />
                  <TextField
                    label="Certifications"
                    helperText="Separate certifications with commas."
                    value={(draft.certifications ?? []).join(",")}
                    onChange={(e) => {
                      setDraft({
                        ...draft,
                        certifications: e.target.value.split(","),
                      });
                      setSaved(false);
                    }}
                  />
                </Stack>
              </Panel>
            )}
            <Panel title="Physical profile & training considerations">
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                {(["height", "weight"] as const).map((field) => (
                  <TextField
                    key={field}
                    label={field === "height" ? "Height (cm)" : "Weight (kg)"}
                    type="number"
                    value={medical[field] || ""}
                    slotProps={{ htmlInput: { min: 0, max: 500, step: 0.1 } }}
                    onChange={(e) => {
                      setDraft({
                        ...draft,
                        medicalInfo: {
                          ...medical,
                          [field]: Number(e.target.value),
                        },
                      });
                      setSaved(false);
                    }}
                  />
                ))}
                {(["waist", "hip", "chest"] as const).map((field) => (
                  <TextField
                    key={field}
                    label={`${field[0].toUpperCase() + field.slice(1)} (cm)`}
                    type="number"
                    value={medical.size[field] || ""}
                    slotProps={{ htmlInput: { min: 0, max: 500, step: 0.1 } }}
                    onChange={(e) => {
                      setDraft({
                        ...draft,
                        medicalInfo: {
                          ...medical,
                          size: {
                            ...medical.size,
                            [field]: Number(e.target.value),
                          },
                        },
                      });
                      setSaved(false);
                    }}
                  />
                ))}
                <TextField
                  select
                  label="Blood type"
                  value={medical.bloodType}
                  onChange={(e) => {
                    setDraft({
                      ...draft,
                      medicalInfo: { ...medical, bloodType: e.target.value },
                    });
                    setSaved(false);
                  }}
                >
                  {["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (v) => (
                      <MenuItem key={v} value={v}>
                        {v || "Not specified"}
                      </MenuItem>
                    ),
                  )}
                </TextField>
                {(["injuries", "allergies", "notes"] as const).map((field) => (
                  <TextField
                    key={field}
                    label={field[0].toUpperCase() + field.slice(1)}
                    multiline
                    value={medical[field]}
                    onChange={(e) => {
                      setDraft({
                        ...draft,
                        medicalInfo: { ...medical, [field]: e.target.value },
                      });
                      setSaved(false);
                    }}
                    sx={{ gridColumn: "1 / -1" }}
                  />
                ))}
              </Box>
            </Panel>
            <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveOutlined />}
              >
                Save changes
              </Button>
              <Button
                onClick={() => {
                  setDraft(person);
                  setSaved(false);
                }}
              >
                Reset changes
              </Button>
            </Stack>
            {saved && (
              <Alert severity="success">
                Your profile is updated for this preview session.
              </Alert>
            )}
          </Stack>
          <Panel>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "green.main",
                color: "green.sub",
                fontSize: 28,
                mb: 3,
              }}
            >
              {draft.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </Avatar>
            <Typography sx={{ fontSize: 24, fontWeight: 650 }}>
              {draft.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {isCoach ? "Coach" : "Trainee"} · {draft.location}
            </Typography>
            <Typography>{draft.bio}</Typography>
            <Box
              sx={{
                mt: 4,
                pt: 3,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography className="eyebrow" color="text.secondary">
                Your focus
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{draft.goal}</Typography>
            </Box>
          </Panel>
        </Box>
      </Box>
    </>
  );
}
export function Profile() {
  const { isCoach, id } = useDashboard();
  const { coachProfile, trainees } = useWorkspace();
  const person = isCoach ? coachProfile : trainees.find((p) => p.id === id);
  return person ? (
    <ProfileForm key={person.id} person={person} />
  ) : (
    <Empty
      title="Profile not found"
      description="Open a demo account from the sign-in page."
    />
  );
}
