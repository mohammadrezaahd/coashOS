"use client";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import { useWorkspace } from "./WorkspaceProvider";
import { Empty, PageHeading, Panel, useDashboard } from "./shared";
import type { HealthDay } from "@/interfaces/Workspace.interface";
export function Health() {
  const { isCoach } = useDashboard();
  const { health, connections, mutate } = useWorkspace();
  const [source, setSource] = useState<HealthDay["source"] | null>(null),
    [consent, setConsent] = useState(false),
    [secret, setSecret] = useState<{ token: string; endpoint: string } | null>(
      null,
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (isCoach)
    return (
      <Empty
        title="Health data belongs to your trainees"
        description="Shared weight measurements appear in the trainee’s milestone reports."
      />
    );
  return (
    <>
      <PageHeading
        title="Health data"
        description="Daily measurements from a connected mobile companion, alongside your workout check-ins."
      />
      <Alert severity="info" sx={{ mb: 3 }}>
        Apple Health and Samsung Health require a mobile app with your
        permission. The website cannot read them directly. A companion app is
        not included yet; the secure daily sync endpoint is ready for
        integration.
      </Alert>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          mb: 3,
        }}
      >
        {(["apple-health", "samsung-health"] as const).map((s) => {
          const c = connections.find((c) => c.source === s);
          return (
            <Panel
              key={s}
              title={s === "apple-health" ? "Apple Health" : "Samsung Health"}
            >
              <Stack sx={{ gap: 2 }}>
                <Typography color="text.secondary">
                  {c?.lastSyncAt
                    ? `Last received: ${new Date(c.lastSyncAt).toLocaleString()}`
                    : c
                      ? "Token created · waiting for mobile data"
                      : "Not connected"}
                </Typography>
                {c && (
                  <Typography variant="caption">
                    Token expires {new Date(c.expiresAt).toLocaleDateString()}
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSource(s);
                    setConsent(false);
                    setSecret(null);
                  }}
                >
                  {c ? "Rotate companion token" : "Set up mobile sync"}
                </Button>
                {c && (
                  <>
                    <Button
                      onClick={async () => {
                        try {
                          await mutate(
                            `health/connections?source=${s}`,
                            "DELETE",
                          );
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Revoke sync token
                    </Button>
                    <Button
                      color="error"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            "Delete the stored daily health data for this source and revoke its token?",
                          )
                        )
                          return;
                        try {
                          await mutate(
                            `health/connections?source=${s}&deleteData=true`,
                            "DELETE",
                          );
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Disconnect & delete source data
                    </Button>
                  </>
                )}
              </Stack>
            </Panel>
          );
        })}
      </Box>
      <Panel title="Daily readings">
        {!health.length ? (
          <Typography color="text.secondary">
            No readings received yet. You can still record body weight in your
            daily workout form.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    "Date",
                    "Source",
                    "Steps",
                    "Active kcal",
                    "Sleep min",
                    "Weight kg",
                  ].map((v) => (
                    <TableCell key={v}>{v}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {health.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {d.date}
                      <br />
                      <Typography variant="caption">{d.timezone}</Typography>
                    </TableCell>
                    <TableCell>{d.source}</TableCell>
                    <TableCell>{d.steps ?? "—"}</TableCell>
                    <TableCell>{d.activeCalories ?? "—"}</TableCell>
                    <TableCell>{d.sleepMinutes ?? "—"}</TableCell>
                    <TableCell>{d.weightKg ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Panel>
      <Dialog
        open={!!source}
        onClose={() => {
          setSource(null);
          setSecret(null);
        }}
        fullWidth
      >
        <DialogTitle>Authorize a mobile companion</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, pt: 1 }}>
            {secret ? (
              <>
                <Alert severity="success">
                  Token created. It is shown only once; store it securely in
                  your companion app.
                </Alert>
                <TextField
                  label="Sync endpoint"
                  value={secret.endpoint}
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  multiline
                  label="Private sync token"
                  value={secret.token}
                  slotProps={{ input: { readOnly: true } }}
                />
                <Typography color="text.secondary">
                  Send daily aggregates with this bearer token. Never place it
                  in frontend code or share it with your coach.
                </Typography>
              </>
            ) : (
              <>
                <Typography>
                  The companion must request permission in HealthKit (iOS) or
                  Samsung Health / Health Connect (Android). Rotating a token
                  invalidates the previous one.
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                  }
                  label="I authorize my companion to send daily steps, activity, sleep and weight. Weight may appear in reports shared with my coach."
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSource(null);
              setSecret(null);
            }}
          >
            Close
          </Button>
          {!secret && (
            <Button
              disabled={!consent || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  setSecret(
                    await mutate<{ token: string; endpoint: string }>(
                      "health/connections",
                      "POST",
                      { source, consent: true },
                    ),
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Create token
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
