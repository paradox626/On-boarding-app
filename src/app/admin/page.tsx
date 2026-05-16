import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { RoleSelect } from "./role-select";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  const [
    { count: openTickets },
    { count: urgentTickets },
    { count: resolvedTickets },
    { count: waitingChats },
    { count: activeChats },
    { count: totalAssets },
    { count: assignedAssets },
    { data: profiles },
  ] = await Promise.all([
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("priority", "urgent").in("status", ["open", "in_progress"]),
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("chat_sessions").select("*", { count: "exact", head: true }).eq("status", "waiting"),
    supabase.from("chat_sessions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("assets").select("*", { count: "exact", head: true }),
    supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "assigned"),
    supabase.from("profiles").select("id, email, full_name, role, created_at").order("created_at", { ascending: false }),
  ]);

  const stats = [
    { label: "Open tickets", value: openTickets ?? 0 },
    { label: "Urgent tickets", value: urgentTickets ?? 0 },
    { label: "Resolved tickets", value: resolvedTickets ?? 0 },
    { label: "Chats waiting", value: waitingChats ?? 0 },
    { label: "Chats active", value: activeChats ?? 0 },
    { label: "Assets total", value: totalAssets ?? 0 },
    { label: "Assets assigned", value: assignedAssets ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <section>
        <h2 className="mb-3 text-lg font-medium">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card">
              <div className="text-3xl font-semibold text-brand">{s.value}</div>
              <div className="mt-1 text-sm text-slate-600">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Users</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(profiles ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{p.full_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{p.email}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <RoleSelect userId={p.id} initialRole={p.role as UserRole} disabled={p.id === user.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
