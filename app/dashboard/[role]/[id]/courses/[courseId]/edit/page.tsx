import { Suspense } from "react";
import { Builder } from "@/components/workspace/Builder";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading course editor…</p>}>
      <Builder />
    </Suspense>
  );
}
