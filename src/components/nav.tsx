import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: UserRole | null = null;
  let displayName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", user.id)
      .single();
    role = (profile?.role as UserRole | undefined) ?? "user";
    displayName = profile?.full_name || profile?.email || user.email || "";
  }

  const isStaff = role === "agent" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-brand">
            IT Support
          </Link>
          {user && (
            <nav className="flex items-center gap-4 text-sm text-slate-700">
              <Link href="/tickets" className="hover:text-brand">Tickets</Link>
              <Link href="/kb" className="hover:text-brand">Knowledge Base</Link>
              <Link href="/chat" className="hover:text-brand">Chat</Link>
              {isStaff && <Link href="/assets" className="hover:text-brand">Assets</Link>}
              {isAdmin && <Link href="/admin" className="hover:text-brand">Admin</Link>}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-slate-600">
                {displayName} {role && <span className="text-xs text-slate-400">({role})</span>}
              </span>
              <form action="/logout" method="post">
                <button className="btn-secondary" type="submit">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-700 hover:text-brand">Sign in</Link>
              <Link href="/signup" className="btn">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
