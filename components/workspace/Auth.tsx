"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  ArrowForward,
  Check,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import type { DashboardRole } from "@/interfaces/Workspace.interface";
import { Brand, ThemeToggle } from "./shared";
import { api, useWorkspace } from "./WorkspaceProvider";
export function Auth({
  screen = "login",
}: {
  screen?: "login" | "register" | "forgot";
}) {
  const router = useRouter();
  const { refresh } = useWorkspace();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<DashboardRole>("coach");
  const [show, setShow] = useState(false);
  const [sent, setSent] = useState(false);
  const register = screen === "register";
  const forgot = screen === "forgot";
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
      }}
    >
      <Box
        sx={{
          bgcolor: "#111b17",
          color: "#f3f7f1",
          p: { xs: 3, md: 6, lg: 8 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: { md: "100dvh" },
        }}
      >
        <Brand />
        <Box sx={{ py: { xs: 4, md: 8 }, maxWidth: 500 }}>
          <Typography className="eyebrow" sx={{ color: "#c5f57a" }}>
            Plan with purpose
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 38, md: 60, lg: 72 },
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: "-3px",
            }}
          >
            Stronger.
            <br />
            Together.
          </Typography>
          <Typography
            sx={{ color: "#b4c2b8", mt: 3, maxWidth: 370, fontSize: 18 }}
          >
            A clear path from your coach’s plan to your next personal best.
          </Typography>
          <Stack sx={{ mt: 5, display: { xs: "none", md: "flex" }, gap: 2.5 }}>
            {[
              "Training built around you",
              "Your coach, one message away",
              "Every session in one place",
            ].map((t) => (
              <Stack key={t} direction="row" sx={{ gap: 1.5 }}>
                <Check sx={{ color: "#c5f57a" }} />
                <Typography>{t}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
        <Typography
          sx={{
            color: "#82988a",
            display: { xs: "none", md: "block" },
            fontSize: 14,
          }}
        >
          Less friction. More progress.
        </Typography>
      </Box>
      <Box
        component="main"
        id="main-content"
        sx={{
          p: { xs: 3, md: 6 },
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ alignSelf: "flex-end" }}>
          <ThemeToggle />
        </Box>
        <Box sx={{ width: "100%", maxWidth: 420, m: "auto", py: 4 }}>
          <Typography className="eyebrow" color="text.secondary">
            Your next chapter
          </Typography>
          <Typography
            component="h1"
            sx={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}
          >
            {forgot
              ? "Forgot your password?"
              : register
                ? "Make room for progress."
                : "Welcome back."}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {forgot
              ? "Enter the email associated with your account."
              : register
                ? "Choose your role to create your workspace."
                : "Your people. Your plan. Let’s get to it."}
          </Typography>
          {register && (
            <ToggleButtonGroup
              value={role}
              exclusive
              fullWidth
              onChange={(_, v) => v && setRole(v)}
              sx={{ mb: 3 }}
            >
              <ToggleButton value="coach">I’m a coach</ToggleButton>
              <ToggleButton value="trainee">I’m a trainee</ToggleButton>
            </ToggleButtonGroup>
          )}
          <Box
            component="form"
            onSubmit={async (e) => {
              e.preventDefault();
              const fields = new FormData(e.currentTarget);
              setBusy(true);
              setError("");
              try {
                const result = await api<{
                  user: { role: string; id: string };
                }>(
                  `auth/${forgot ? "forgot" : register ? "register" : "login"}`,
                  "POST",
                  {
                    email: fields.get("email"),
                    password: fields.get("password") ?? undefined,
                    name: fields.get("name") ?? undefined,
                    role,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  },
                );
                if (forgot) setSent(true);
                else {
                  await refresh();
                  router.push(
                    `/dashboard/${result.user.role}/${result.user.id}`,
                  );
                  router.refresh();
                }
              } catch (error) {
                setError((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Stack sx={{ gap: 2.5 }}>
              {register && (
                <TextField
                  label="Full name"
                  name="name"
                  autoComplete="name"
                  required
                />
              )}
              <TextField
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
              {!forgot && (
                <TextField
                  label="Password"
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                  helperText={
                    register ? "Use at least 8 characters." : undefined
                  }
                  slotProps={{
                    htmlInput: { minLength: register ? 8 : 1 },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={
                              show ? "Hide password" : "Show password"
                            }
                            onClick={() => setShow(!show)}
                            edge="end"
                          >
                            {show ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
              {!register && !forgot && (
                <Box sx={{ textAlign: "right" }}>
                  <Link
                    href="/forgot-password"
                    style={{
                      color: "var(--mui-palette-primary-main)",
                      fontSize: 14,
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>
              )}
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                type="submit"
                disabled={busy}
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
              >
                {forgot
                  ? "Send reset link"
                  : register
                    ? "Create account"
                    : "Sign in"}
              </Button>
              {sent && (
                <Alert severity="info">
                  If an account exists, a password reset link has been sent.
                </Alert>
              )}
            </Stack>
          </Box>
          <Typography sx={{ my: 3, fontSize: 14, textAlign: "center" }}>
            {forgot ? (
              <Link href="/login">Back to sign in</Link>
            ) : (
              <>
                {register ? "Already have an account? " : "New to coachOS? "}
                <Link
                  href={register ? "/login" : "/register"}
                  style={{ color: "var(--mui-palette-primary-main)" }}
                >
                  {register ? "Sign in" : "Create an account"}
                </Link>
              </>
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
