import { Suspense } from "react";
import NarrationExperience from "@/components/NarrationExperience";

export default function NarrationPage() {
  return (
    <Suspense>
      <NarrationExperience />
    </Suspense>
  );
}
