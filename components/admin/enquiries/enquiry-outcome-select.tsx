"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENQUIRY_OUTCOME_LABELS, type EnquiryOutcome } from "@/types";

export function EnquiryOutcomeSelect({ id, outcome }: { id: string; outcome: EnquiryOutcome }) {
  const router = useRouter();
  const [current, setCurrent] = useState(outcome);
  const [updating, setUpdating] = useState(false);

  async function handleChange(value: string) {
    setUpdating(true);
    const previous = current;
    setCurrent(value as EnquiryOutcome);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}/outcome`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: value }),
      });
      if (!res.ok) throw new Error("Failed to update outcome");
      toast.success("Outcome updated");
      router.refresh();
    } catch (err) {
      setCurrent(previous);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Select value={current} onValueChange={handleChange} disabled={updating}>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        {Object.entries(ENQUIRY_OUTCOME_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
