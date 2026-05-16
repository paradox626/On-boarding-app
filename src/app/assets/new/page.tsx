"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewAssetPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    asset_tag: "",
    name: "",
    category: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("assets")
      .insert({
        asset_tag: form.asset_tag,
        name: form.name,
        category: form.category || null,
        manufacturer: form.manufacturer || null,
        model: form.model || null,
        serial_number: form.serial_number || null,
        purchase_date: form.purchase_date || null,
        notes: form.notes || null,
      })
      .select("id")
      .single();
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/assets/${data.id}`);
    router.refresh();
  }

  const fields: { key: keyof typeof form; label: string; type?: string; required?: boolean }[] = [
    { key: "asset_tag", label: "Asset tag", required: true },
    { key: "name", label: "Name", required: true },
    { key: "category", label: "Category" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "model", label: "Model" },
    { key: "serial_number", label: "Serial number" },
    { key: "purchase_date", label: "Purchase date", type: "date" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card">
        <h1 className="mb-4 text-xl font-semibold">Add asset</h1>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.key === "name" ? "sm:col-span-2" : ""}>
              <label className="label">{f.label}</label>
              <input
                className="input"
                type={f.type || "text"}
                required={f.required}
                value={form[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input min-h-[100px]" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button className="btn" disabled={loading} type="submit">
              {loading ? "Saving..." : "Save asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
