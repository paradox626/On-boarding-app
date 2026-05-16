import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Asset, AssetStatus, Profile } from "@/lib/types";

const STATUS_STYLES: Record<AssetStatus, string> = {
  available: "bg-emerald-100 text-emerald-700",
  assigned: "bg-blue-100 text-blue-700",
  in_repair: "bg-amber-100 text-amber-700",
  retired: "bg-slate-200 text-slate-600",
};

export default async function AssetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isStaff = profile?.role === "agent" || profile?.role === "admin";
  if (!isStaff) redirect("/");

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });

  const assignedIds = Array.from(new Set((assets ?? []).map((a) => a.assigned_to).filter(Boolean) as string[]));
  const { data: people } = assignedIds.length
    ? await supabase.from("profiles").select("id, email, full_name").in("id", assignedIds)
    : { data: [] as Pick<Profile, "id" | "email" | "full_name">[] };
  const nameById = new Map<string, string>((people ?? []).map((p) => [p.id, p.full_name || p.email]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Assets</h1>
        <Link href="/assets/new" className="btn">Add asset</Link>
      </div>

      {(!assets || assets.length === 0) ? (
        <div className="card text-center text-slate-600">No assets yet.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tag</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned to</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(assets as Asset[]).map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link href={`/assets/${a.id}`} className="text-brand hover:underline">{a.asset_tag}</Link>
                  </td>
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3 text-slate-600">{a.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_STYLES[a.status]}`}>{a.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.assigned_to ? nameById.get(a.assigned_to) ?? "—" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
