"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Ticket, TicketPriority, TicketStatus } from "@/lib/types";

type Props = {
  ticket: Ticket;
  isStaff: boolean;
  agents: Pick<Profile, "id" | "email" | "full_name">[];
  assignedName: string;
};

export function TicketActions({ ticket, isStaff, agents, assignedName }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [assignedTo, setAssignedTo] = useState<string>(ticket.assigned_to ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const update: Partial<Ticket> = { status, priority };
    if (isStaff) update.assigned_to = assignedTo || null;
    const { error } = await supabase.from("tickets").update(update).eq("id", ticket.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="card">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)}>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select
            className="input"
            value={priority}
            disabled={!isStaff}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="label">Assigned to</label>
          {isStaff ? (
            <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
              ))}
            </select>
          ) : (
            <input className="input" value={assignedName} readOnly />
          )}
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4">
        <button className="btn" disabled={saving} onClick={save}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
