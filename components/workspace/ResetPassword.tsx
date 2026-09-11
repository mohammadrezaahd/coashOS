"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import { api } from "./WorkspaceProvider";
import { PageHeading, ThemeToggle } from "./shared";
export function ResetPassword() {
  const search = useSearchParams();
  const [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <Box sx={{ maxWidth: 460, mx: "auto", p: 3, pt: 8 }}>
      <ThemeToggle />
      <PageHeading
        title="Reset your password"
        description="Choose a new password of at least 8 characters."
      />
      {done ? (
        <Alert severity="success">
          Password changed. <Link href="/login">Sign in</Link>
        </Alert>
      ) : (
        <Box
          component="form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            try {
              await api("auth/reset", "POST", {
                token: search.get("token"),
                password: f.get("password"),
              });
              setDone(true);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Stack sx={{ gap: 2 }}>
            <TextField
              name="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={busy}>
              Save password
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
