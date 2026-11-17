"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Fab,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Stack,
  Typography,
  useColorScheme,
  Tooltip,
} from "@mui/material";
import {
  DarkModeOutlined,
  LightModeOutlined,
  Add,
  Bolt,
  ArrowForward,
} from "@mui/icons-material";
import type { DashboardRole } from "@/interfaces/Workspace.interface";
export function useDashboard() {
  const { role, id } = useParams<{ role: DashboardRole; id: string }>();
  return {
    role,
    id,
    base: `/dashboard/${role}/${id}`,
    isCoach: role === "coach",
  };
}
export function ThemeToggle() {
  const { mode, setMode, systemMode } = useColorScheme();
  const dark = (mode === "system" ? systemMode : mode) === "dark";
  return (
    <Tooltip title={dark ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        aria-label="Toggle color theme"
        onClick={() => setMode(dark ? "light" : "dark")}
        color="inherit"
      >
        {dark ? <LightModeOutlined /> : <DarkModeOutlined />}
      </IconButton>
    </Tooltip>
  );
}
export function Brand() {
  return (
    <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderRadius: 2,
          p: 0.5,
          display: "flex",
        }}
      >
        <Bolt />
      </Box>
      <Typography sx={{ fontSize: 22, fontWeight: 800, letterSpacing: -1 }}>
        coach<span style={{ fontWeight: 400 }}>OS</span>
      </Typography>
    </Stack>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      sx={{ mb: 3.5, justifyContent: "space-between", gap: 2 }}
    >
      <Box>
        {eyebrow && (
          <Typography className="eyebrow" color="text.secondary">
            {eyebrow}
          </Typography>
        )}
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 28, md: 36 },
            fontWeight: 750,
            letterSpacing: "-1.2px",
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
          {action}
        </Box>
      )}
    </Stack>
  );
}
export function Panel({
  children,
  title,
  action,
}: {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <Card sx={{ p: { xs: 2, md: 3 }, height: "100%" }}>
      {title && (
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            mb: 2.5,
          }}
        >
          <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>
            {title}
          </Typography>
          {action}
        </Stack>
      )}
      {children}
    </Card>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <Chip
      size="small"
      label={value}
      sx={{
        fontWeight: 600,
        bgcolor:
          value === "Active" || value === "Completed"
            ? "green.main"
            : value === "Draft"
              ? "action.hover"
              : "blue.main",
        color:
          value === "Active" || value === "Completed"
            ? "green.sub"
            : value === "Draft"
              ? "text.secondary"
              : "blue.sub",
      }}
    />
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Box sx={{ textAlign: "center", py: 7, px: 2 }}>
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary" sx={{ my: 1.5 }}>
        {description}
      </Typography>
      {action}
    </Box>
  );
}
export function GoLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      component={Link}
      href={href}
      endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
      size="small"
    >
      {children}
    </Button>
  );
}
export const twoColumns = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.7fr) minmax(280px, 1fr)" },
  gap: 3,
};

export function FloatingAdd({
  label,
  href,
  onClick,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const props = {
    color: "primary" as const,
    variant: "extended" as const,
    "aria-label": label,
    sx: {
      position: "fixed",
      right: { xs: 20, md: 32 },
      bottom: "max(24px, env(safe-area-inset-bottom))",
      zIndex: 1050,
      gap: 1,
      boxShadow: 6,
    },
  };
  return href ? (
    <Fab {...props} component={Link} href={href}>
      <Add />
      {label}
    </Fab>
  ) : (
    <Fab {...props} onClick={onClick}>
      <Add />
      {label}
    </Fab>
  );
}
