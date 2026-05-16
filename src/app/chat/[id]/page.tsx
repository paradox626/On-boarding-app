import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatRoom } from "./chat-room";
import type { Profile } from "@/lib/types";

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: session } = await supabase.from("chat_sessions").select("*").eq("id", id).single();
  if (!session) notFound();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isStaff = profile?.role === "agent" || profile?.role === "admin";

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  const ids = new Set<string>([session.user_id, user.id]);
  if (session.agent_id) ids.add(session.agent_id);
  (messages ?? []).forEach((m) => ids.add(m.sender_id));
  const { data: profilesList } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", Array.from(ids));
  const namesById: Record<string, string> = {};
  (profilesList ?? []).forEach((p: Pick<Profile, "id" | "email" | "full_name">) => {
    namesById[p.id] = p.full_name || p.email;
  });

  return (
    <ChatRoom
      session={session}
      currentUserId={user.id}
      isStaff={isStaff}
      initialMessages={messages ?? []}
      namesById={namesById}
    />
  );
}
