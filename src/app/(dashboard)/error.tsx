"use client";

import { Button } from "@/components/ui/button";
import { ReadError } from "@/components/dashboard/empty-states";

export default function ErrorView({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ReadError />
      <Button onClick={reset} className="w-fit">
        Thử lại
      </Button>
    </div>
  );
}
