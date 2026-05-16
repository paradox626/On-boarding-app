import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function KbArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: article } = await supabase.from("kb_articles").select("*").eq("slug", slug).single();
  if (!article) notFound();

  const { data: category } = article.category_id
    ? await supabase.from("kb_categories").select("name").eq("id", article.category_id).single()
    : { data: null };

  return (
    <article className="mx-auto max-w-3xl space-y-4">
      <Link href="/kb" className="text-sm text-brand hover:underline">← All articles</Link>
      <div className="text-xs uppercase tracking-wide text-slate-500">{category?.name ?? "Uncategorized"}</div>
      <h1 className="text-3xl font-semibold">{article.title}</h1>
      <p className="text-sm text-slate-500">Updated {new Date(article.updated_at).toLocaleDateString()}</p>
      <div className="card whitespace-pre-wrap text-slate-800">{article.body}</div>
    </article>
  );
}
