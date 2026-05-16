"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CommentForm({ ticketId, canPostInternal }: { ticketId: string; canPostInternal: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from("ticket_comments")
      .insert({ ticket_id: ticketId, author_id: user.id, body, is_internal: isInternal });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody("");
    setIsInternal(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <label className="label">Add a comment</label>
      <textarea className="input min-h-[100px]" value={body} onChange={(e) => setBody(e.target.value)} />
      {canPostInternal && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
          Internal note (staff only)
        </label>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn" disabled={loading} type="submit">
        {loading ? "Posting..." : "Post comment"}
      </button>
    </form>
  );
}
