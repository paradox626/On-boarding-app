import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ChatSession, Profile } from "@/lib/types";
import { NewChatButton } from "./new-chat-button";

export default async function ChatListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isStaff = profile?.role === "agent" || profile?.role === "admin";

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  const participantIds = new Set<string>();
  (sessions ?? []).forEach((s) => {
    participantIds.add(s.user_id);
    if (s.agent_id) participantIds.add(s.agent_id);
  });
  const { data: profilesList } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", Array.from(participantIds));
  const profilesById = new Map<string, Pick<Profile, "id" | "email" | "full_name">>(
    (profilesList ?? []).map((p) => [p.id, p]),
  );
  const nameOf = (uid: string | null) => {
    if (!uid) return "—";
    const p = profilesById.get(uid);
    return p?.full_name || p?.email || uid;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Chat</h1>
        <NewChatButton />
      </div>

      {(!sessions || sessions.length === 0) ? (
        <div className="card text-center text-slate-600">No chat sessions yet.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(sessions as ChatSession[]).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/chat/${s.id}`} className="font-medium text-brand hover:underline">
                      {s.subject || "(no subject)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{nameOf(s.user_id)}</td>
                  <td className="px-4 py-3 text-slate-700">{nameOf(s.agent_id)}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-slate-100 text-slate-700">{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isStaff && (
        <p className="text-xs text-slate-500">As staff, you can pick up any waiting chat by opening it and clicking "Claim".</p>
      )}
    </div>
  );
}
