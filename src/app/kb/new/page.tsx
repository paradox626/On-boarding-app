"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { KbCategory } from "@/lib/types";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [published, setPublished] = useState(true);
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("kb_categories").select("*").order("name").then(({ data }) => {
      setCategories(data ?? []);
    });
  }, []);

  useEffect(() => {
    if (!slug) setSlug(slugify(title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setLoading(false);
      return;
    }
    const finalSlug = slug || slugify(title);
    const { error } = await supabase.from("kb_articles").insert({
      title,
      slug: finalSlug,
      body,
      category_id: categoryId || null,
      published,
      author_id: user.id,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/kb/${finalSlug}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card">
        <h1 className="mb-4 text-xl font-semibold">New article</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Slug</label>
            <input className="input" required value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Body</label>
            <textarea className="input min-h-[260px]" required value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Publish immediately
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn" disabled={loading} type="submit">
            {loading ? "Saving..." : "Save article"}
          </button>
        </form>
      </div>
    </div>
  );
}
