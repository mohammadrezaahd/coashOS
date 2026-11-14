"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TrainingCourse, WorkspaceMessage, WorkspacePerson, WorkoutTemplate } from "@/interfaces/Workspace.interface";
import { initialCourses, initialMessages, people, coach } from "./data";
const key = "coachOS.workspace.v2";
type Stored = { courses: TrainingCourse[]; templates: WorkoutTemplate[]; completedSets: string[]; completedSessions: string[] };
function readStored(): Partial<Stored> | null { if (typeof window === "undefined") return null; try { const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null"); return value && typeof value === "object" ? value as Partial<Stored> : null; } catch { return null; } }
function useWorkspaceState() {
  const stored = readStored();
  const [courses, setCourses] = useState<TrainingCourse[]>(stored?.courses ?? initialCourses);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(stored?.templates ?? []);
  const [trainees, setTrainees] = useState<WorkspacePerson[]>(people);
  const [coachProfile, setCoachProfile] = useState(coach);
  const [messages, setMessages] = useState<WorkspaceMessage[]>(initialMessages);
  const [completedSets, setCompletedSets] = useState<string[]>(stored?.completedSets ?? []);
  const [completedSessions, setCompletedSessions] = useState<string[]>(stored?.completedSessions ?? []);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify({ courses, templates, completedSets, completedSessions } satisfies Stored)); } catch { /* storage may be unavailable */ } }, [courses, templates, completedSets, completedSessions]);
  return { courses, setCourses, templates, setTemplates, trainees, setTrainees, coachProfile, setCoachProfile, messages, setMessages, completedSets, setCompletedSets, completedSessions, setCompletedSessions };
}
const WorkspaceContext = createContext<ReturnType<typeof useWorkspaceState> | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) { const state = useWorkspaceState(); return <WorkspaceContext.Provider value={state}>{children}</WorkspaceContext.Provider>; }
export function useWorkspace() { const state = useContext(WorkspaceContext); if (!state) throw new Error("WorkspaceProvider is required"); return state; }
