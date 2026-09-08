"use client";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { theme } from "./Theme";
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme} defaultMode="light">
        <CssBaseline />
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
