import { Alert, AlertTitle } from "@/components/ui/alert";
import { ClockIcon } from "lucide-react";

export function StaleBanner({ stale }: { stale: boolean }) {
  if (!stale) return null;
  return (
    <Alert>
      <ClockIcon />
      <AlertTitle>Numbers may lag by a few minutes.</AlertTitle>
    </Alert>
  );
}
