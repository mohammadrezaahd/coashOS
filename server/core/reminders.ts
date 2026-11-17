import { readyDb } from "./db";
import { addDays, dateInZone } from "@/utils/workout";
/** Idempotent in-app reminders; no invented workout/health values. */
export async function createReminders(coachId?: string, traineeId?: string) {
  const d = await readyDb();
  const courses = await d.courses
    .find({
      status: { $in: ["Active", "Upcoming"] },
      ...(coachId ? { coachId } : {}),
      ...(traineeId ? { traineeId } : {}),
    })
    .toArray();
  let count = 0;
  for (const c of courses) {
    const trainee = await d.users.findOne({ _id: c.traineeId });
    if (!trainee) continue;
    const today = dateInZone(trainee.timezone || "UTC");
    for (const m of c.milestones) {
      const due = addDays(c.startDate, m.week * 7 - 1);
      if (today < addDays(due, -2)) continue;
      if (await d.reports.findOne({ _id: `${c.id}:${m.id}` })) continue;
      for (const userId of [c.coachId, c.traineeId]) {
        const id = `${userId}:${c.id}:${m.id}`;
        await d.reminders.updateOne(
          { _id: id },
          {
            $set: { dueDate: due, title: `${c.title} · ${m.title}` },
            $setOnInsert: {
              id,
              userId,
              courseId: c.id,
              milestoneId: m.id,
              read: false,
            },
          },
          { upsert: true },
        );
        count++;
      }
    }
  }
  return count;
}
