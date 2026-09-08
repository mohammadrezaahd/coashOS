"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Close } from "@mui/icons-material";
import { useWorkspace } from "./WorkspaceProvider";
import {
  Empty,
  GoLink,
  PageHeading,
  Panel,
  Status,
  useDashboard,
} from "./shared";
export function People() {
  const { isCoach, base } = useDashboard();
  const { trainees, courses } = useWorkspace();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All levels");
  const [selected, setSelected] = useState<string | null>(null);
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  if (!isCoach)
    return (
      <Empty
        title="Your coach is here for you"
        description="Open messages to connect with your coach."
        action={<GoLink href={base + "/messages"}>Messages</GoLink>}
      />
    );
  const visible = trainees.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "All levels" || p.level === filter),
  );
  const person = trainees.find((p) => p.id === selected);
  return (
    <>
      <PageHeading
        eyebrow="Your people"
        title="Built on connection."
        description="A clear view of every athlete you coach."
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setInvite(true);
              setSent(false);
            }}
          >
            Invite trainee
          </Button>
        }
      />
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2, mb: 3 }}>
        <TextField
          size="small"
          label="Search trainees"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          size="small"
          label="Level"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ minWidth: 190 }}
        >
          {["All levels", "Beginner", "Intermediate", "Advanced"].map((v) => (
            <MenuItem key={v} value={v}>
              {v}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Panel title={`${visible.length} trainees`}>
        <TableContainer>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                {["Trainee", "Current focus", "Level", "Course", ""].map(
                  (t, i) => (
                    <TableCell key={i}>{t}</TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((p) => {
                const c =
                  courses.find(
                    (c) => c.traineeId === p.id && c.status === "Active",
                  ) ?? courses.find((c) => c.traineeId === p.id);
                return (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Stack
                        direction="row"
                        sx={{ gap: 1.5, alignItems: "center" }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "green.main",
                            color: "green.sub",
                            fontSize: 14,
                          }}
                        >
                          {p.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                            {p.name}
                          </Typography>
                          <Typography
                            color="text.secondary"
                            sx={{ fontSize: 13 }}
                          >
                            {p.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{p.goal}</TableCell>
                    <TableCell>{p.level}</TableCell>
                    <TableCell>
                      {c ? <Status value={c.status} /> : "Not assigned"}
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => setSelected(p.id)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {!visible.length && (
          <Empty
            title="No matching trainees"
            description="Try another name or level."
          />
        )}
      </Panel>
      <Dialog
        open={!!person}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{person?.name}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {person?.bio}
          </Typography>
          <Typography sx={{ fontSize: 14 }}>
            {person?.email} · {person?.location}
          </Typography>
          <Typography sx={{ fontWeight: 600, mt: 3, mb: 1 }}>
            Assigned courses
          </Typography>
          <Stack sx={{ gap: 1 }}>
            {courses
              .filter((c) => c.traineeId === person?.id)
              .map((c) => (
                <GoLink key={c.id} href={`${base}/courses/${c.id}`}>
                  {c.title}
                </GoLink>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
          <Button
            component={Link}
            href={`${base}/messages?trainee=${person?.id}`}
            variant="outlined"
          >
            Message
          </Button>
          <Button
            component={Link}
            href={`${base}/courses/new?trainee=${person?.id}`}
            variant="contained"
          >
            Create course
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={invite}
        onClose={() => setInvite(false)}
        fullWidth
        maxWidth="xs"
      >
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <DialogTitle>Invite a trainee</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Give your athlete a place in your coaching workspace.
            </Typography>
            <TextField
              label="Trainee email"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSent(false);
              }}
            />
            {sent && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Invitation preview for {email}. No email was sent.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInvite(false)}>Close</Button>
            <Button variant="contained" type="submit">
              Preview invitation
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
