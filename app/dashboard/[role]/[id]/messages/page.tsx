import { Suspense } from "react";
import { Messages } from "@/components/workspace/Messages";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading conversations…</p>}>
      <Messages />
    </Suspense>
  );
}
