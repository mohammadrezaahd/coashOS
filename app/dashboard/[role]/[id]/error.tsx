"use client";
import { Alert, Button, Stack } from "@mui/material";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Stack sx={{ gap: 2 }}>
      <Alert severity="error">
        We couldn’t open this part of your workspace.
      </Alert>
      <Button onClick={reset} variant="outlined">
        Try again
      </Button>
    </Stack>
  );
}
