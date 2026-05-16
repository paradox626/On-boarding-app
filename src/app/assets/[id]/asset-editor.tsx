"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Asset, AssetStatus, Profile } from "@/lib/types";

type Props = {
  asset: Asset;
  people: Pick<Profile, "id" | "email" | "full_name">[];
  currentUserId: string;
};

export function AssetEditor({ asset, people, currentUserId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<AssetStatus>(asset.status);
  const [assignedTo, setAssignedTo] = useState<string>(asset.assigned_to ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const nextAssigned = assignedTo || null;
    const nextStatus: AssetStatus = nextAssigned ? "assigned" : status === "assigned" ? "available" : status;

    const { error: updateErr } = await supabase
      .from("assets")
      .update({ status: nextStatus, assigned_to: nextAssigned })
      .eq("id", asset.id);
    if (updateErr) {
      setError(updateErr.message);
      setSaving(false);
      return;
    }

    if (nextAssigned && nextAssigned !== asset.assigned_to) {
      const { error: histErr } = await supabase.from("asset_assignments").insert({
        asset_id: asset.id,
        assigned_to: nextAssigned,
        assigned_by: currentUserId,
        notes: notes || null,
      });
      if (histErr) {
        setError(histErr.message);
        setSaving(false);
        return;
      }
    }

    if (!nextAssigned && asset.assigned_to) {
      // Close out the most recent open assignment.
      await supabase
        .from("asset_assignments")
        .update({ returned_at: new Date().toISOString() })
        .eq("asset_id", asset.id)
        .is("returned_at", null);
    }

    setSaving(false);
    setNotes("");
    router.refresh();
  }

  return (
    <div className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as AssetStatus)}>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="in_repair">In repair</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Assigned to</label>
          <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Assignment note (optional)</label>
        <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for reassignment, condition, etc." />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn" disabled={saving} onClick={save}>
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
