import type { FunnelData } from "@/lib/analytics/queries";

// A plain, honest funnel: each stage shown as a proportional bar against the
// first stage. This is a summary of how many enquiries reached each stage in
// the period — it does not claim every customer moves through these stages
// in this exact order.
export function FunnelChart({ funnel }: { funnel: FunnelData }) {
  const stages: { label: string; value: number; color: string }[] = [
    { label: "Enquiries", value: funnel.enquiries, color: "#2563EB" },
    { label: "WhatsApp Opened", value: funnel.whatsappOpened, color: "#128C7E" },
    { label: "Contacted", value: funnel.contacted, color: "#7C3AED" },
    { label: "Sale Recorded", value: funnel.saleCompleted, color: "#16A34A" },
  ];
  const max = Math.max(1, stages[0].value);

  if (funnel.enquiries === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No enquiries in this period yet.</p>;
  }

  return (
    <div className="space-y-4">
      {stages.map((stage) => (
        <div key={stage.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium uppercase tracking-widest2 text-muted-foreground">{stage.label}</span>
            <span className="text-ink">{stage.value}</span>
          </div>
          <div className="h-2.5 w-full bg-secondary">
            <div
              className="h-full"
              style={{ width: `${Math.max(2, (stage.value / max) * 100)}%`, backgroundColor: stage.color }}
            />
          </div>
        </div>
      ))}
      <p className="pt-1 text-xs text-muted-foreground">
        Each stage counts enquiries from this period only. WhatsApp Opened means the chat was opened, not that a
        message was sent; customers still press Send themselves.
      </p>
    </div>
  );
}
