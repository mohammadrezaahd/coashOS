import { Skeleton, Stack } from "@mui/material";
export default function Loading() {
  return (
    <Stack sx={{ gap: 2 }} aria-label="Loading workspace">
      <Skeleton width="50%" height={60} />
      <Skeleton variant="rounded" height={160} />
      <Skeleton variant="rounded" height={300} />
    </Stack>
  );
}
