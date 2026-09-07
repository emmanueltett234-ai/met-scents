import { Badge } from "@/components/ui/badge";
import { AVAILABILITY_LABELS, type Availability } from "@/types";

const VARIANT: Record<Availability, "success" | "warning" | "destructive" | "muted"> = {
  available: "success",
  low_stock: "warning",
  out_of_stock: "destructive",
  coming_soon: "muted",
};

export function AvailabilityBadge({ status }: { status: Availability }) {
  return <Badge variant={VARIANT[status]}>{AVAILABILITY_LABELS[status]}</Badge>;
}
