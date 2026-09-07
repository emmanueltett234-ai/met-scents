"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENQUIRY_STATUS_LABELS, type EnquiryStatus } from "@/types";

export function EnquiryStatusSelect({ id, status }: { id: string; status: EnquiryStatus }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [updating, setUpdating] = useState(false);

  async function handleChange(value: string) {
    setUpdating(true);
    const previous = current;
    setCurrent(value as EnquiryStatus);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Status updated");
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
      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
      <SelectContent>
        {Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
