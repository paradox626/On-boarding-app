import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Asset, Profile } from "@/lib/types";
import { AssetEditor } from "./asset-editor";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isStaff = profile?.role === "agent" || profile?.role === "admin";
  if (!isStaff) redirect("/");

  const { data: asset } = await supabase.from("assets").select("*").eq("id", id).single();
  if (!asset) notFound();

  const { data: people } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .order("full_name");

  const { data: history } = await supabase
    .from("asset_assignments")
    .select("*")
    .eq("asset_id", id)
    .order("assigned_at", { ascending: false });

  const nameById = new Map<string, string>(
    (people ?? []).map((p: Pick<Profile, "id" | "email" | "full_name">) => [p.id, p.full_name || p.email]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{asset.name}</h1>
        <p className="font-mono text-xs text-slate-500">{asset.asset_tag}</p>
      </div>

      <AssetEditor asset={asset as Asset} people={people ?? []} currentUserId={user.id} />

      <div>
        <h2 className="mb-3 text-lg font-medium">Assignment history</h2>
        {(!history || history.length === 0) ? (
          <div className="card text-sm text-slate-500">No assignment history.</div>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                <div className="flex justify-between">
                  <span>Assigned to <strong>{nameById.get(h.assigned_to) ?? h.assigned_to}</strong> by {nameById.get(h.assigned_by) ?? h.assigned_by}</span>
                  <span className="text-slate-500">{new Date(h.assigned_at).toLocaleString()}</span>
                </div>
                {h.returned_at && (
                  <div className="text-xs text-slate-500">Returned {new Date(h.returned_at).toLocaleString()}</div>
                )}
                {h.notes && <div className="mt-1 text-slate-700">{h.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
