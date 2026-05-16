"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NewChatButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, subject: subject || null })
      .select("id")
      .single();
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/chat/${data.id}`);
    router.refresh();
  }

  if (!open) return <button className="btn" onClick={() => setOpen(true)}>Start chat</button>;

  return (
    <div className="card w-80">
      <label className="label">Subject (optional)</label>
      <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button className="btn" disabled={loading} onClick={start}>{loading ? "Starting..." : "Start"}</button>
        <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
