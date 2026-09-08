"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  TrainingCourse,
  WorkspaceMessage,
  WorkspacePerson,
} from "@/interfaces/Workspace.interface";
import { initialCourses, initialMessages, people, coach } from "./data";

function useWorkspaceState() {
  const [courses, setCourses] = useState<TrainingCourse[]>(initialCourses);
  const [trainees, setTrainees] = useState<WorkspacePerson[]>(people);
  const [coachProfile, setCoachProfile] = useState(coach);
  const [messages, setMessages] = useState<WorkspaceMessage[]>(initialMessages);
  const [completedSets, setCompletedSets] = useState<string[]>([]);
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  return {
    courses,
    setCourses,
    trainees,
    setTrainees,
    coachProfile,
    setCoachProfile,
    messages,
    setMessages,
    completedSets,
    setCompletedSets,
    completedSessions,
    setCompletedSessions,
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
