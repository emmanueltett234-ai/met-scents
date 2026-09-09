import { CircleDot, MessageCircle, RefreshCw, StickyNote, ReceiptText, Flag } from "lucide-react";
import type { EnquiryActivity } from "@/types";

const EVENT_CONFIG: Record<string, { label: (m: Record<string, unknown>) => string; icon: typeof CircleDot }> = {
  enquiry_created: { label: () => "Enquiry created", icon: CircleDot },
  whatsapp_opened: { label: () => "WhatsApp opened", icon: MessageCircle },
  status_changed: {
    label: (m) => `Status changed${m.from && m.to ? ` from ${m.from} to ${m.to}` : ""}`,
    icon: RefreshCw,
  },
  outcome_changed: {
    label: (m) => `Outcome changed${m.from && m.to ? ` from ${m.from} to ${m.to}` : ""}`,
    icon: Flag,
  },
  note_added: { label: () => "Note added", icon: StickyNote },
  sale_created: {
    label: (m) => `Sale recorded${typeof m.sale_amount === "number" ? `: GH₵${m.sale_amount.toLocaleString()}` : ""}`,
    icon: ReceiptText,
  },
  sale_updated: { label: () => "Sale updated", icon: ReceiptText },
};

// Append-only, real events only — nothing here is ever fabricated for
// historical enquiries created before this feature shipped.
export function EnquiryTimeline({ activities }: { activities: EnquiryActivity[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recorded activity yet. Activity is tracked from the moment this feature shipped onward; older enquiries
        may not show early events.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {activities.map((a) => {
        const config = EVENT_CONFIG[a.event_type] ?? { label: () => a.event_type, icon: CircleDot };
        const Icon = config.icon;
        return (
          <li key={a.id} className="flex gap-3 text-sm">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent-dark" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="text-ink/90">{config.label(a.metadata ?? {})}</p>
              <p className="text-xs text-muted-foreground">
                {a.created_by ? `${a.created_by} · ` : ""}
                {new Date(a.created_at).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
