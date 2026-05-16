import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types";

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-200 text-slate-600",
};
const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default async function TicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <Link href="/tickets/new" className="btn">New ticket</Link>
      </div>

      {(!tickets || tickets.length === 0) ? (
        <div className="card text-center text-slate-600">No tickets yet.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(tickets as Ticket[]).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${t.id}`} className="font-medium text-brand hover:underline">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_STYLES[t.status]}`}>{t.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(t.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
