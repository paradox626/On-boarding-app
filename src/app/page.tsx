import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="card text-center">
        <h1 className="text-2xl font-semibold">Welcome to IT Support</h1>
        <p className="mt-2 text-slate-600">Sign in to submit tickets, chat with an agent, or browse the knowledge base.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="btn">Sign in</Link>
          <Link href="/signup" className="btn-secondary">Create account</Link>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "user";
  const isStaff = role === "agent" || role === "admin";

  const [{ count: myOpenTickets }, { count: assignedToMe }, { count: waitingChats }] = await Promise.all([
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("created_by", user.id).in("status", ["open", "in_progress"]),
    isStaff
      ? supabase.from("tickets").select("*", { count: "exact", head: true }).eq("assigned_to", user.id).in("status", ["open", "in_progress"])
      : Promise.resolve({ count: 0 }),
    isStaff
      ? supabase.from("chat_sessions").select("*", { count: "exact", head: true }).eq("status", "waiting")
      : Promise.resolve({ count: 0 }),
  ]);

  const tiles: { label: string; value: number; href: string }[] = [
    { label: "My open tickets", value: myOpenTickets ?? 0, href: "/tickets" },
  ];
  if (isStaff) {
    tiles.push(
      { label: "Tickets assigned to me", value: assignedToMe ?? 0, href: "/tickets?assigned=me" },
      { label: "Chats waiting", value: waitingChats ?? 0, href: "/chat" },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hi {profile?.full_name || user.email}</h1>
        <p className="text-slate-600">What do you need help with today?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card transition hover:shadow-md">
            <div className="text-3xl font-semibold text-brand">{t.value}</div>
            <div className="mt-1 text-sm text-slate-600">{t.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/tickets/new" className="card text-center hover:shadow-md">
          <div className="text-base font-medium">New ticket</div>
          <div className="text-xs text-slate-500">Report an issue</div>
        </Link>
        <Link href="/kb" className="card text-center hover:shadow-md">
          <div className="text-base font-medium">Browse articles</div>
          <div className="text-xs text-slate-500">Self-service help</div>
        </Link>
        <Link href="/chat" className="card text-center hover:shadow-md">
          <div className="text-base font-medium">Live chat</div>
          <div className="text-xs text-slate-500">Talk to an agent</div>
        </Link>
        {isStaff && (
          <Link href="/assets" className="card text-center hover:shadow-md">
            <div className="text-base font-medium">Assets</div>
            <div className="text-xs text-slate-500">Inventory</div>
          </Link>
        )}
      </div>
    </div>
  );
}
