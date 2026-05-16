"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

export function RoleSelect({
  userId,
  initialRole,
  disabled,
}: {
  userId: string;
  initialRole: UserRole;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [error, setError] = useState<string | null>(null);

  async function change(next: UserRole) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role: next }).eq("id", userId);
    if (error) {
      setError(error.message);
      setRole(initialRole);
      return;
    }
    setRole(next);
    router.refresh();
  }

  return (
    <div>
      <select
        className="input w-32 py-1 text-xs"
        value={role}
        disabled={disabled}
        onChange={(e) => change(e.target.value as UserRole)}
      >
        <option value="user">user</option>
        <option value="agent">agent</option>
        <option value="admin">admin</option>
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
