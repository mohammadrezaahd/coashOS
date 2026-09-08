"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  DashboardOutlined,
  PeopleOutlined,
  FitnessCenterOutlined,
  MessageOutlined,
  PersonOutlined,
  Logout,
  Menu,
  Close,
} from "@mui/icons-material";
import {
  Brand,
  ThemeToggle,
  useDashboard,
} from "@/components/workspace/shared";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";
export function DashboardLayout({ children }: { children: ReactNode }) {
  const { base, isCoach, id } = useDashboard();
  const { coachProfile, trainees } = useWorkspace();
  const profile = isCoach
    ? coachProfile
    : (trainees.find((p) => p.id === id) ?? trainees[0]);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = [
    { label: "Overview", path: "", icon: DashboardOutlined },
    {
      label: isCoach ? "Courses" : "My training",
      path: "/courses",
      icon: FitnessCenterOutlined,
    },
    ...(isCoach
      ? [{ label: "Trainees", path: "/trainees", icon: PeopleOutlined }]
      : []),
    { label: "Messages", path: "/messages", icon: MessageOutlined },
    { label: "Profile", path: "/profile", icon: PersonOutlined },
  ];
  const active = (path: string) =>
    path ? pathname.startsWith(base + path) : pathname === base;
  const sidebar = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 2.5,
        color: "#eff5ef",
        bgcolor: "#111b17",
      }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 5 }}
      >
        <Brand />
        <IconButton
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          sx={{ display: { md: "none" }, color: "inherit" }}
        >
          <Close />
        </IconButton>
      </Stack>
      <Typography className="eyebrow" sx={{ color: "#92a298", mb: 2 }}>
        Your workspace
      </Typography>
      <Stack sx={{ gap: 1 }}>
        {nav.map((n) => (
          <Button
            key={n.path}
            component={Link}
            href={base + n.path}
            onClick={() => setOpen(false)}
            aria-current={active(n.path) ? "page" : undefined}
            startIcon={<n.icon />}
            sx={{
              justifyContent: "flex-start",
              px: 2,
              py: 1.4,
              gap: 1,
              color: active(n.path) ? "#c5f57a" : "#adbbb2",
              bgcolor: active(n.path) ? "#283a2e" : "transparent",
              "&:hover": { bgcolor: "#24332a" },
            }}
          >
            {n.label}
          </Button>
        ))}
      </Stack>
      <Box sx={{ mt: "auto", pt: 5 }}>
        <Box sx={{ p: 2, border: "1px solid #34443a", borderRadius: 3, mb: 2 }}>
          <Typography sx={{ fontWeight: 600 }}>
            {isCoach ? "Built around your athletes." : "Every session counts."}
          </Typography>
          <Typography sx={{ color: "#adbbb2", mt: 1, fontSize: 14 }}>
            {isCoach
              ? "A clear plan. A stronger connection."
              : "Keep showing up for yourself."}
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/login"
          startIcon={<Logout />}
          sx={{ color: "#adbbb2" }}
        >
          Sign out
        </Button>
      </Box>
    </Box>
  );
  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <Box
        component="aside"
        sx={{
          display: { xs: "none", md: "block" },
          position: "fixed",
          inset: "0 auto 0 0",
          width: 240,
        }}
      >
        {sidebar}
      </Box>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 270 } } }}
      >
        {sidebar}
      </Drawer>
      <Box sx={{ ml: { md: "240px" } }}>
        <Box
          component="header"
          sx={{
            height: 80,
            px: { xs: 2, md: 4 },
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "background.paper",
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <IconButton
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
              sx={{ display: { md: "none" } }}
            >
              <Menu />
            </IconButton>
            <Typography
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              Workspace /
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {nav.find((n) => active(n.path) && n.path !== "")?.label ??
                "Overview"}
            </Typography>
            <Chip
              size="small"
              label={isCoach ? "Coach" : "Trainee"}
              variant="outlined"
              sx={{ ml: 1 }}
            />
          </Stack>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
            <ThemeToggle />
            <Box sx={{ width: 1, height: 28, bgcolor: "divider" }} />
            <Button
              component={Link}
              href={base + "/profile"}
              sx={{ color: "text.primary", minWidth: 0, gap: 1.2 }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: "green.main",
                  color: "green.sub",
                  fontSize: 14,
                }}
              >
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </Avatar>
              <Typography
                sx={{ display: { xs: "none", sm: "block" }, fontSize: 14 }}
              >
                {profile.name.split(" ")[0]}
              </Typography>
            </Button>
          </Stack>
        </Box>
        <Box
          component="main"
          id="main-content"
          sx={{
            maxWidth: 1600,
            mx: "auto",
            px: { xs: 2, md: 4 },
            pt: { xs: 3, md: 4 },
            pb: { xs: 13, md: 5 },
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 2 }}
          >
            Client preview · Sample data · Changes last until refresh
          </Typography>
          {children}
        </Box>
      </Box>
      <Box
        component="nav"
        aria-label="Mobile navigation"
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          bottom: "max(12px, env(safe-area-inset-bottom))",
          left: 12,
          right: 12,
          zIndex: 1100,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
          bgcolor: "background.paper",
          boxShadow: "0 8px 30px #0002",
          p: 0.7,
        }}
      >
        {nav.map((n) => (
          <Button
            key={n.path}
            component={Link}
            href={base + n.path}
            aria-current={active(n.path) ? "page" : undefined}
            sx={{
              minWidth: 0,
              flex: 1,
              flexDirection: "column",
              gap: 0.5,
              fontSize: 12,
              color: active(n.path) ? "green.sub" : "text.secondary",
              bgcolor: active(n.path) ? "green.main" : "transparent",
            }}
          >
            <n.icon fontSize="small" />
            {n.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
