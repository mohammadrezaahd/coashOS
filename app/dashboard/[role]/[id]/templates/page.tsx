import { redirect } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ role: string; id: string }>;
}) {
  const { role, id } = await params;
  redirect(`/dashboard/${role}/${id}/courses`);
}
