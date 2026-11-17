"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import type {
  TrainingCourse,
  WorkspaceMessage,
  WorkspacePerson,
  SessionUser,
  WorkoutLog,
  Conversation,
  CoachingRequest,
  TrainingTemplate,
  Reminder,
  HealthDay,
  HealthConnection,
} from "@/interfaces/Workspace.interface";
export async function api<T = unknown>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method,
    credentials: "same-origin",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Request failed. Please try again.");
  return data;
}
interface Workspace {
  user: SessionUser;
  courses: TrainingCourse[];
  trainees: WorkspacePerson[];
  coachProfile: WorkspacePerson | null;
  messages: WorkspaceMessage[];
  logs: WorkoutLog[];
  conversations: Conversation[];
  requests: CoachingRequest[];
  templates: TrainingTemplate[];
  reminders: Reminder[];
  health: HealthDay[];
  connections: HealthConnection[];
}
const emptyPerson: WorkspacePerson = {
  id: "",
  name: "",
  email: "",
  location: "",
  bio: "",
  goal: "",
  level: "Beginner",
  coachId: "",
};
function useWorkspaceState() {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [completedSets, setCompletedSets] = useState<string[]>([]);
  const refresh = useCallback(async () => {
    try {
      const next = await api<Workspace>("workspace");
      setData(next);
      setError("");
      return next;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  }, []);
  const mutate = useCallback(
    async <T,>(path: string, method: string, body?: unknown) => {
      const result = await api<T>(path, method, body);
      await refresh().catch(() => {});
      return result;
    },
    [refresh],
  );
  return {
    user: data?.user,
    courses: data?.courses ?? [],
    trainees: data?.trainees ?? [],
    coachProfile: data?.coachProfile ?? emptyPerson,
    messages: data?.messages ?? [],
    logs: data?.logs ?? [],
    conversations: data?.conversations ?? [],
    requests: data?.requests ?? [],
    templates: data?.templates ?? [],
    reminders: data?.reminders ?? [],
    health: data?.health ?? [],
    connections: data?.connections ?? [],
    completedSets,
    setCompletedSets,
    completedSessions: data?.logs.map((l) => l.programId) ?? [],
    refresh,
    mutate,
    error,
    ready: !!data,
    clear: () => setData(null),
  };
}
const WorkspaceContext = createContext<ReturnType<
  typeof useWorkspaceState
> | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const state = useWorkspaceState();
  return (
    <WorkspaceContext.Provider value={state}>
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  const state = useContext(WorkspaceContext);
  if (!state) throw new Error("WorkspaceProvider is required");
  return state;
}
export function WorkspaceGate({ children }: { children: ReactNode }) {
  const { ready, error, refresh } = useWorkspace();
  useEffect(() => {
    refresh().catch(() => {});
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh().catch(() => {});
    }, 60000);
    return () => clearInterval(t);
  }, [refresh]);
  if (!ready)
    return (
      <Box sx={{ p: 5 }}>
        {error ? (
          <Alert
            severity="error"
            action={
              <Button onClick={() => refresh().catch(() => {})}>Retry</Button>
            }
          >
            {error}
          </Alert>
        ) : (
          <CircularProgress aria-label="Loading workspace" />
        )}
      </Box>
    );
  return (
    <>
      {error && (
        <Alert
          severity="warning"
          action={
            <Button onClick={() => refresh().catch(() => {})}>Reload</Button>
          }
        >
          Unable to refresh your workspace: {error}
        </Alert>
      )}
      {children}
    </>
  );
}
