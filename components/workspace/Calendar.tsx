"use client";
import { useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useWorkspace } from "./WorkspaceProvider";
import { scheduleForDate, addDays, dateInZone } from "@/utils/workout";
import { PageHeading, Panel, useDashboard } from "./shared";
function monthDays(month: string) { const first = `${month}-01`; const count = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate(); return Array.from({ length: count }, (_, index) => addDays(first, index)); }
export function Calendar() {
  const { base } = useDashboard(); const { user, courses, logs } = useWorkspace();
  const [month, setMonth] = useState(dateInZone(user!.timezone).slice(0, 7));
  const days = useMemo(() => monthDays(month), [month]);
  const move = (delta: number) => { const date = new Date(`${month}-15T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + delta); setMonth(date.toISOString().slice(0, 7)); };
  return <><PageHeading title="Training calendar" description="Your recurring plan, completed sessions, rest days, and eligible schedule changes in one place." action={<Stack direction="row"><Button aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft /></Button><Button aria-label="Next month" onClick={() => move(1)}><ChevronRight /></Button></Stack>} /><Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", lg: "repeat(7, 1fr)" }, gap: 1.5 }}>{days.map((date) => { const course = courses.find((value) => value.startDate <= date && addDays(value.startDate, value.durationWeeks * 7 - 1) >= date); const program = course ? scheduleForDate(course, date, user!.timezone) : null; const log = logs.find((value) => value.courseId === course?.id && value.date === date); return <Panel key={date}><Typography variant="caption" color="text.secondary">{date.slice(5)}</Typography><Typography sx={{ fontWeight: 700, mt: 1 }}>{program?.title ?? "Rest day"}</Typography><Stack direction="row" sx={{ gap: .5, flexWrap: "wrap", mt: 1 }}>{log && <Chip size="small" color="success" label={log.checklistStatus === "completed" ? "Completed" : "Logged"} />}{program && !log && <Chip size="small" variant="outlined" label="Upcoming" />}</Stack>{program && <Button component={Link} href={`${base}/courses/${course!.id}/programs/${program.id}`} size="small" sx={{ mt: 1 }}>Open</Button>}</Panel>; })}</Box></>;
}
