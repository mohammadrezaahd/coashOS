import { Suspense } from "react";
import { ResetPassword } from "@/components/workspace/ResetPassword";
export default function Page() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}
