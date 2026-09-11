import { DashboardLayout } from "@/components/layouts";
import { currentUser } from "@/server/core/auth";
import { WorkspaceGate } from "@/components/workspace/WorkspaceProvider";
import { redirect, notFound } from "next/navigation";
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string; id: string }>;
}) {
  const { role, id } = await params;
  if (role !== "coach" && role !== "trainee") notFound();
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== role || user.id !== id)
    redirect(`/dashboard/${user.role}/${user.id}`);
  return (
    <WorkspaceGate>
      <DashboardLayout>{children}</DashboardLayout>
    </WorkspaceGate>
  );
}
