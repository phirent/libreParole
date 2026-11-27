"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Circle = { id: string; theme: string; content: string; expires_at: string; role: string };

export default function CerclesPage() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: memberships, error: membershipError } = await supabase.from("circle_members").select("parole_id, role").eq("user_id", user.id).eq("is_banned", false);
        if (membershipError) throw membershipError;
        if (!memberships?.length) { if (active) setCircles([]); return; }
        const ids = [...new Set(memberships.map((m) => m.parole_id))];
        const { data: paroles, error: paroleError } = await supabase.from("paroles").select("id, theme, content, expires_at").in("id", ids).eq("status", "open").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false });
        if (paroleError) throw paroleError;
        const roles = new Map(memberships.map((m) => [m.parole_id, m.role]));
        if (active) setCircles((paroles ?? []).map((p) => ({ ...p, role: roles.get(p.id) ?? "listener" })));
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Impossible de charger vos cercles."); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, []);

  return <section>
    <p className="text-xs uppercase tracking-[0.16em] text-[#8B949E]">Espace d’écoute</p><h1 className="mt-2 text-2xl font-semibold">Mes Cercles</h1>
    {loading ? <p className="mt-8 text-sm text-[#8B949E]">Chargement de vos cercles…</p> : error ? <p role="alert" className="mt-8 text-sm text-[#EF4444]">{error}</p> : circles.length === 0 ? <div className="mt-10 rounded-md border border-[#30363D] bg-[#161B22] p-5"><p className="text-[#8B949E]">Aucun cercle actif pour le moment.</p><Link href="/app/deposer" className="mt-4 inline-block text-sm text-[#F59E0B]">Déposer une parole</Link></div> : <div className="mt-6 space-y-3">{circles.map((circle) => {
      const remaining = Math.max(0, Math.ceil((new Date(circle.expires_at).getTime() - Date.now()) / 3600000));
      return <Link key={circle.id} href={`/app/cercle/${circle.id}`} className="block rounded-md border border-[#30363D] bg-[#161B22] p-4 hover:border-[#8B949E]"><div className="flex items-start justify-between gap-3"><h2 className="font-medium">{circle.theme}</h2><span className="shrink-0 rounded-full border border-[#30363D] px-2 py-1 text-xs text-[#8B949E]">{circle.role === "author" ? "Votre parole" : "Cercle d’écoute"}</span></div><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[#8B949E]">{circle.content}</p><p className="mt-3 text-xs text-[#8B949E]">{remaining}h restantes</p></Link>;
    })}</div>}
  </section>;
}
