import { DashboardLayout } from "@/components/layouts";
import { notFound } from "next/navigation";
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string; id: string }>;
}) {
  const { role } = await params;
  if (role !== "coach" && role !== "trainee") notFound();
  return <DashboardLayout>{children}</DashboardLayout>;
}
