"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, ChatSession } from "@/lib/types";

type Props = {
  session: ChatSession;
  currentUserId: string;
  isStaff: boolean;
  initialMessages: ChatMessage[];
  namesById: Record<string, string>;
};

export function ChatRoom({ session, currentUserId, isStaff, initialMessages, namesById }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(session.status);
  const [agentId, setAgentId] = useState(session.agent_id);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${session.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${session.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_sessions", filter: `id=eq.${session.id}` },
        (payload) => {
          const s = payload.new as ChatSession;
          setStatus(s.status);
          setAgentId(s.agent_id);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("chat_messages")
      .insert({ session_id: session.id, sender_id: currentUserId, body });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody("");
  }

  async function claim() {
    const supabase = createClient();
    const { error } = await supabase
      .from("chat_sessions")
      .update({ agent_id: currentUserId, status: "active" })
      .eq("id", session.id);
    if (error) setError(error.message);
    else router.refresh();
  }

  async function closeChat() {
    const supabase = createClient();
    const { error } = await supabase
      .from("chat_sessions")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", session.id);
    if (error) setError(error.message);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{session.subject || "Chat"}</h1>
          <p className="text-sm text-slate-500">
            Status: <span className="font-medium">{status}</span>
            {agentId && <> · Agent: {namesById[agentId] || agentId}</>}
          </p>
        </div>
        {isStaff && (
          <div className="flex gap-2">
            {status === "waiting" && (
              <button className="btn" onClick={claim}>Claim chat</button>
            )}
            {status !== "closed" && (
              <button className="btn-secondary" onClick={closeChat}>Close chat</button>
            )}
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="h-[480px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No messages yet. Send one below.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => {
              const mine = m.sender_id === currentUserId;
              return (
                <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                      mine ? "bg-brand text-white" : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="text-xs opacity-75">
                      {namesById[m.sender_id] || (mine ? "You" : "Them")} · {new Date(m.created_at).toLocaleTimeString()}
                    </div>
                    <div className="mt-0.5 whitespace-pre-wrap">{m.body}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          className="input flex-1"
          placeholder={status === "closed" ? "This chat is closed" : "Type a message..."}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={status === "closed"}
        />
        <button className="btn" disabled={sending || status === "closed"} type="submit">
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
