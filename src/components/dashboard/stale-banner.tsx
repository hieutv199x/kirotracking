import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ClockIcon } from "lucide-react";

export function StaleBanner({ stale }: { stale: boolean }) {
  if (!stale) return null;
  return (
    <Alert>
      <ClockIcon />
      <AlertTitle>Số liệu có thể chậm vài phút.</AlertTitle>
      <AlertDescription>Đang xem bản rollup gần nhất.</AlertDescription>
    </Alert>
  );
}
