"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Scar = { id: string; theme: string; content: string; golden_advice: string | null };
export default function CicatricesPage() {
  const [scars, setScars] = useState<Scar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void createClient().from("paroles").select("id, theme, content, golden_advice").eq("is_public_scar", true).eq("status", "healed").order("created_at", { ascending: false }).then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) setError(queryError.message); else setScars(data ?? []);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return <section><p className="text-xs uppercase tracking-[0.16em] text-[#8B949E]">Mur des Cicatrices Dorées</p><h1 className="mt-2 text-2xl font-semibold">Ce qui a aidé</h1>
    {loading ? <p className="mt-8 text-sm text-[#8B949E]">Chargement…</p> : error ? <p role="alert" className="mt-8 text-sm text-[#EF4444]">{error}</p> : scars.length === 0 ? <p className="mt-8 text-sm text-[#8B949E]">Aucune parole partagée pour le moment.</p> : <div className="mt-6 space-y-4">{scars.map((scar) => <article key={scar.id} className="rounded-md border border-[#30363D] bg-[#161B22] p-4"><h2 className="text-sm font-medium text-[#F0F6FC]">{scar.theme}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#8B949E]">{scar.content}</p>{scar.golden_advice && <blockquote className="mt-4 border-l-2 border-[#F59E0B] pl-4 text-sm leading-6 text-[#F0F6FC]">{scar.golden_advice}</blockquote>}</article>)}</div>}
  </section>;
}
