"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TicketPriority } from "@/lib/types";

export default function NewTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("tickets")
      .insert({ subject, description, priority, category: category || null, created_by: user.id })
      .select("id")
      .single();
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/tickets/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card">
        <h1 className="mb-4 text-xl font-semibold">New ticket</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <input className="input" required value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[140px]" required value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <input className="input" placeholder="e.g. Network, Hardware" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn" disabled={loading} type="submit">
            {loading ? "Creating..." : "Create ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}
