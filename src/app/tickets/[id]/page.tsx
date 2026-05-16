import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Ticket, TicketComment, Profile } from "@/lib/types";
import { TicketActions } from "./ticket-actions";
import { CommentForm } from "./comment-form";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ticket } = await supabase.from("tickets").select("*").eq("id", id).single();
  if (!ticket) notFound();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role ?? "user";
  const isStaff = role === "agent" || role === "admin";

  const { data: comments } = await supabase
    .from("ticket_comments")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  const participantIds = new Set<string>([ticket.created_by]);
  if (ticket.assigned_to) participantIds.add(ticket.assigned_to);
  (comments ?? []).forEach((c) => participantIds.add(c.author_id));

  const { data: profilesList } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .in("id", Array.from(participantIds));
  const profilesById = new Map<string, Pick<Profile, "id" | "email" | "full_name" | "role">>(
    (profilesList ?? []).map((p) => [p.id, p]),
  );
  const nameOf = (uid: string | null) => {
    if (!uid) return "Unassigned";
    const p = profilesById.get(uid);
    return p?.full_name || p?.email || uid;
  };

  let agents: Pick<Profile, "id" | "email" | "full_name">[] = [];
  if (isStaff) {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("role", ["agent", "admin"]);
    agents = data ?? [];
  }

  const t = ticket as Ticket;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.subject}</h1>
        <p className="text-sm text-slate-500">
          Opened by {nameOf(t.created_by)} · {new Date(t.created_at).toLocaleString()}
        </p>
      </div>

      <div className="card whitespace-pre-wrap">{t.description}</div>

      <TicketActions
        ticket={t}
        isStaff={isStaff}
        agents={agents}
        assignedName={nameOf(t.assigned_to)}
      />

      <div>
        <h2 className="mb-3 text-lg font-medium">Comments</h2>
        <div className="space-y-3">
          {(comments as TicketComment[] | null)?.map((c) => (
            <div
              key={c.id}
              className={`rounded-md border p-4 ${c.is_internal ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {nameOf(c.author_id)}
                  {c.is_internal && <span className="ml-2 text-amber-700">internal</span>}
                </span>
                <span>{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{c.body}</p>
            </div>
          ))}
          {(!comments || comments.length === 0) && (
            <div className="text-sm text-slate-500">No comments yet.</div>
          )}
        </div>
      </div>

      <CommentForm ticketId={t.id} canPostInternal={isStaff} />
    </div>
  );
}
