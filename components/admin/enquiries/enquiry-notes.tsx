"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { EnquiryNote } from "@/types";

// Private, admin-only notes. Never shown on any customer-facing page and
// never injected into a WhatsApp message.
export function EnquiryNotes({ enquiryId, initialNotes }: { enquiryId: string; initialNotes: EnquiryNote[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save note");
      setNotes((n) => [data.note, ...n]);
      setDraft("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a private note (only visible to admins)…"
          className="min-h-20"
        />
        <Button type="button" size="sm" variant="outline" disabled={saving || !draft.trim()} onClick={addNote}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-3 border-t border-border pt-3">
          {notes.map((n) => (
            <div key={n.id} className="text-sm">
              <p className="whitespace-pre-wrap text-ink/90">{n.note}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {n.created_by ?? "Admin"} ·{" "}
                {new Date(n.created_at).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
