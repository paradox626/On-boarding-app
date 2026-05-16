import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { KbArticle, KbCategory } from "@/lib/types";

export default async function KbPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isStaff = profile?.role === "agent" || profile?.role === "admin";

  const [{ data: articles }, { data: categories }] = await Promise.all([
    supabase.from("kb_articles").select("*").order("updated_at", { ascending: false }),
    supabase.from("kb_categories").select("*").order("name"),
  ]);

  const categoryById = new Map<string, KbCategory>((categories ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Knowledge base</h1>
        {isStaff && <Link href="/kb/new" className="btn">New article</Link>}
      </div>

      {(!articles || articles.length === 0) ? (
        <div className="card text-center text-slate-600">No articles published yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(articles as KbArticle[]).map((a) => {
            const cat = a.category_id ? categoryById.get(a.category_id) : undefined;
            return (
              <Link key={a.id} href={`/kb/${a.slug}`} className="card transition hover:shadow-md">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                  <span>{cat?.name ?? "Uncategorized"}</span>
                  {!a.published && <span className="text-amber-600">Draft</span>}
                </div>
                <h2 className="mt-2 text-base font-semibold">{a.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.body.slice(0, 160)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
